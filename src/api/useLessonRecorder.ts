/**
 * «Диктофон» урока: открывает сессию, когда урок появляется на экране,
 * записывает ответы ребёнка и закрывает сессию — завершённой или брошенной.
 *
 * Сессия привязана к ФОКУСУ экрана, а не к его созданию: список уроков
 * заранее готовит (prefetch) экран следующего урока в фоне, и если
 * начинать сессию при создании экрана, в базе появлялись бы «фантомные»
 * брошенные уроки, которые ребёнок даже не открывал.
 */
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

import { finishSession, flushLearning, recordAnswer, startSession } from '@/api/learningOutbox';
import { taskVersion } from '@/api/taskCatalog';

export function useLessonRecorder(lessonId: string) {
  const sessionRef = useRef<string | null>(null);
  const attemptsRef = useRef<Record<string, number>>({});
  const stepStartedAt = useRef(Date.now());
  const completedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      const sessionId = startSession(lessonId);
      sessionRef.current = sessionId;
      attemptsRef.current = {};
      completedRef.current = false;
      stepStartedAt.current = Date.now();

      return () => {
        // Ушёл из урока, не закончив, — урок брошен (важно для анализа)
        if (!completedRef.current) finishSession(sessionId, 'abandoned');
        sessionRef.current = null;
        void flushLearning();
      };
    }, [lessonId]),
  );

  /** Отметить, что ребёнок увидел новый шаг: от этого момента считается время ответа. */
  const markStepStart = useCallback(() => {
    stepStartedAt.current = Date.now();
  }, []);

  /** Записать решение ребёнка. Если такого задания нет в каталоге — тихо пропускаем. */
  const record = useCallback((taskId: string, answer: Record<string, unknown>) => {
    const version = taskVersion(taskId);
    if (version === undefined) return;
    const attemptNo = (attemptsRef.current[taskId] ?? 0) + 1;
    attemptsRef.current[taskId] = attemptNo;
    recordAnswer({
      sessionId: sessionRef.current,
      taskId,
      taskVersion: version,
      answer,
      attemptNo,
      durationMs: Date.now() - stepStartedAt.current,
    });
  }, []);

  /** Сколько миллисекунд прошло с появления шага (защита от случайного двойного тапа). */
  const stepAge = useCallback(() => Date.now() - stepStartedAt.current, []);

  const complete = useCallback(() => {
    if (!sessionRef.current || completedRef.current) return;
    completedRef.current = true;
    finishSession(sessionRef.current, 'completed');
    void flushLearning();
  }, []);

  return { record, complete, markStepStart, stepAge };
}
