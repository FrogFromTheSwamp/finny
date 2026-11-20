/**
 * Очередь отправки учебных данных (outbox) — сердце offline-first.
 *
 * Каждый ответ ребёнка сначала записывается в очередь на телефоне (она
 * сохраняется в памяти устройства и переживает закрытие приложения),
 * а уже потом, когда есть связь, отправляется на сервер пачкой.
 *
 * Почему это надёжно:
 * - у каждого ответа свой UUID, созданный телефоном. Если ответ сервера
 *   потерялся и пачка уйдёт повторно, сервер узнает уже сохранённые
 *   ответы и не создаст дублей;
 * - из очереди удаляется только то, что сервер явно подтвердил
 *   (accepted, duplicate) или окончательно отклонил (rejected);
 * - нет сети — всё остаётся в очереди до следующей попытки.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { childRequest, isRegistered } from '@/api/childSession';
import { uuid4 } from '@/api/uuid';

type SessionStatus = 'started' | 'completed' | 'abandoned';

type SessionPayload = {
  id: string;
  kind: 'lesson' | 'practice' | 'assessment';
  lesson_id: string | null;
  status: SessionStatus;
  started_at: string;
  finished_at: string | null;
};

type OutboxSession = SessionPayload & {
  /** Какой статус сессии сервер уже подтвердил (null — ещё ничего). */
  confirmedStatus: SessionStatus | null;
};

type EventPayload = {
  id: string;
  session_id: string | null;
  task_id: string;
  task_version: number;
  attempt_no: number;
  answer: Record<string, unknown>;
  hint_used: boolean;
  duration_ms: number | null;
  device_seq: number;
  occurred_at: string;
};

type ItemResult = { id: string; status: 'accepted' | 'duplicate' | 'rejected'; reason?: string | null };
type SyncResponse = { sessions: ItemResult[]; events: ItemResult[] };

type OutboxState = {
  sessions: Record<string, OutboxSession>;
  events: EventPayload[];
  /** Порядковый номер события на устройстве (на случай, если часы телефона врут). */
  seq: number;
  sentTotal: number;
  lastFlushAt: string | null;
  lastFlushError: string | null;
};

export const useLearningOutbox = create<OutboxState>()(
  persist(
    // Явный тип: иначе TypeScript решит, что пустой [] — это «список из ничего» (never[])
    (): OutboxState => ({
      sessions: {},
      events: [],
      seq: 0,
      sentTotal: 0,
      lastFlushAt: null,
      lastFlushError: null,
    }),
    {
      name: 'finny-learning-outbox',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

const state = () => useLearningOutbox.getState();
const update = (patch: Partial<OutboxState> | ((s: OutboxState) => Partial<OutboxState>)) =>
  useLearningOutbox.setState(patch);

const isFinal = (status: SessionStatus) => status !== 'started';

// ---------- Запись ----------

export function startSession(lessonId: string): string {
  const id = uuid4();
  const session: OutboxSession = {
    id,
    kind: 'lesson',
    lesson_id: lessonId,
    status: 'started',
    started_at: new Date().toISOString(),
    finished_at: null,
    confirmedStatus: null,
  };
  update((s) => ({ sessions: { ...s.sessions, [id]: session } }));
  return id;
}

export function finishSession(id: string, status: 'completed' | 'abandoned') {
  update((s) => {
    const session = s.sessions[id];
    if (!session || isFinal(session.status)) return {};
    return {
      sessions: {
        ...s.sessions,
        [id]: { ...session, status, finished_at: new Date().toISOString() },
      },
    };
  });
}

export function recordAnswer(input: {
  sessionId: string | null;
  taskId: string;
  taskVersion: number;
  answer: Record<string, unknown>;
  attemptNo: number;
  durationMs: number | null;
}) {
  update((s) => {
    const seq = s.seq + 1;
    const event: EventPayload = {
      id: uuid4(),
      session_id: input.sessionId,
      task_id: input.taskId,
      task_version: input.taskVersion,
      attempt_no: input.attemptNo,
      answer: input.answer,
      hint_used: false,
      duration_ms: input.durationMs,
      device_seq: seq,
      occurred_at: new Date().toISOString(),
    };
    return { events: [...s.events, event], seq };
  });
}

// ---------- Отправка ----------

const BATCH_SIZE = 200;
let flushing: Promise<void> | null = null;

function waitForHydration(): Promise<void> {
  if (useLearningOutbox.persist.hasHydrated()) return Promise.resolve();
  return new Promise((resolve) => {
    const unsubscribe = useLearningOutbox.persist.onFinishHydration(() => {
      unsubscribe();
      resolve();
    });
  });
}

function toPayload({ confirmedStatus: _ignored, ...session }: OutboxSession): SessionPayload {
  return session;
}

/** Отправить очередь на сервер. Ошибки не бросает: неотправленное остаётся в очереди. */
export function flushLearning(): Promise<void> {
  if (flushing) return flushing;

  flushing = (async () => {
    try {
      await waitForHydration();
      if (!isRegistered()) return; // без пропуска сервер нас не примет — подождём

      for (;;) {
        const { sessions, events } = state();
        // Сессии, чей текущий статус сервер ещё не подтвердил
        const sentSessions = Object.values(sessions).filter((s) => s.confirmedStatus !== s.status);
        const sentEvents = events.slice(0, BATCH_SIZE);
        if (!sentSessions.length && !sentEvents.length) break;

        const response = await childRequest<SyncResponse>('/sync/learning', {
          method: 'POST',
          body: { sessions: sentSessions.map(toPayload), events: sentEvents },
        });

        update((s) => {
          const nextSessions = { ...s.sessions };
          response.sessions.forEach((result, i) => {
            const sent = sentSessions[i]!;
            const current = nextSessions[result.id];
            if (!current) return;
            if (result.status === 'rejected' || (isFinal(sent.status) && current.status === sent.status)) {
              delete nextSessions[result.id]; // завершённая и подтверждённая — больше не нужна
            } else {
              nextSessions[result.id] = { ...current, confirmedStatus: sent.status };
            }
          });
          const handled = new Set(response.events.map((r) => r.id));
          return {
            sessions: nextSessions,
            events: s.events.filter((e) => !handled.has(e.id)),
            sentTotal: s.sentTotal + response.events.filter((r) => r.status === 'accepted').length,
            lastFlushAt: new Date().toISOString(),
            lastFlushError: null,
          };
        });

        if (sentEvents.length < BATCH_SIZE) break;
      }
    } catch (error) {
      update({ lastFlushError: error instanceof Error ? error.message : String(error) });
    } finally {
      flushing = null;
    }
  })();
  return flushing;
}
