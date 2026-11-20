/**
 * «Пропуск» ребёнка на сервере.
 *
 * При первом запуске после онбординга приложение регистрирует ребёнка на
 * сервере и получает токен устройства (device token) — постоянный пропуск
 * этого телефона. По нему в любой момент можно получить короткоживущий
 * access token (30 минут), который прикладывается к запросам.
 *
 * Если сети нет — ничего страшного: приложение работает как раньше,
 * а регистрация повторится при следующем запуске или возврате в приложение.
 *
 * ВАЖНО: пока токен устройства хранится в AsyncStorage, как и остальные данные
 * игры. Перед релизом его нужно перенести в защищённое хранилище
 * (expo-secure-store) — это требует пересборки dev-клиента.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { ApiError, apiRequest } from '@/api/client';
import type { AccessToken, ChildProfile, ChildRegistered } from '@/api/types';

type ServerSessionState = {
  childId: string | null;
  deviceId: string | null;
  deviceToken: string | null;
  accessToken: string | null;
  accessExpiresAt: number; // миллисекунды, Date.now()
  lastError: string | null;
  lastContactAt: string | null; // когда последний раз удалось связаться

  clear: () => void;
};

const empty = {
  childId: null,
  deviceId: null,
  deviceToken: null,
  accessToken: null,
  accessExpiresAt: 0,
  lastError: null,
  lastContactAt: null,
};

export const useServerSession = create<ServerSessionState>()(
  persist(
    (set) => ({
      ...empty,
      clear: () => set(empty),
    }),
    {
      name: 'finny-server-session',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      // Короткоживущий access token не сохраняем — его всегда можно получить заново
      partialize: ({ childId, deviceId, deviceToken, lastContactAt }) => ({
        childId,
        deviceId,
        deviceToken,
        lastContactAt,
      }),
    },
  ),
);

const get = () => useServerSession.getState();
const set = (patch: Partial<ServerSessionState>) => useServerSession.setState(patch);

function noteSuccess() {
  set({ lastError: null, lastContactAt: new Date().toISOString() });
}

function noteError(error: unknown) {
  set({ lastError: error instanceof Error ? error.message : String(error) });
}

function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Moscow';
  } catch {
    return 'Europe/Moscow';
  }
}

function waitForHydration(): Promise<void> {
  if (useServerSession.persist.hasHydrated()) return Promise.resolve();
  return new Promise((resolve) => {
    const unsubscribe = useServerSession.persist.onFinishHydration(() => {
      unsubscribe();
      resolve();
    });
  });
}

export function isRegistered(): boolean {
  return !!get().deviceToken;
}

// Если регистрацию одновременно запросят два экрана, сервер должен получить один запрос
let registering: Promise<void> | null = null;

/** Зарегистрировать ребёнка на сервере, если это ещё не сделано. Ошибки не бросает. */
export function ensureChildRegistered(profile: { petName: string; petColorId: string }): Promise<void> {
  if (isRegistered()) return Promise.resolve();
  if (registering) return registering;

  registering = (async () => {
    try {
      // Сохранённый пропуск подгружается из памяти телефона не мгновенно.
      // Пока не подгрузился, нельзя решать «не зарегистрирован» — иначе
      // при каждом запуске на сервере появлялся бы новый ребёнок.
      await waitForHydration();
      if (isRegistered()) return;

      const data = await apiRequest<ChildRegistered>('/auth/children/register', {
        method: 'POST',
        body: {
          pet_name: profile.petName || null,
          pet_color: profile.petColorId || null,
          timezone: deviceTimezone(),
          platform: Platform.OS,
        },
      });
      set({
        childId: data.child_id,
        deviceId: data.device_id,
        deviceToken: data.device_token,
        accessToken: data.access_token,
        accessExpiresAt: Date.now() + data.expires_in * 1000,
      });
      noteSuccess();
    } catch (error) {
      noteError(error);
    } finally {
      registering = null;
    }
  })();
  return registering;
}

/** Действующий access token; при необходимости обменивает device token на новый. */
async function childAccessToken(forceRefresh = false): Promise<string> {
  const state = get();
  if (!state.deviceToken) throw new ApiError(401, 'Профиль ещё не зарегистрирован на сервере');

  const stillValid = state.accessToken && state.accessExpiresAt - Date.now() > 60_000;
  if (stillValid && !forceRefresh) return state.accessToken!;

  const data = await apiRequest<AccessToken>('/auth/children/token', {
    method: 'POST',
    body: { device_token: state.deviceToken },
  });
  set({ accessToken: data.access_token, accessExpiresAt: Date.now() + data.expires_in * 1000 });
  return data.access_token;
}

/**
 * Запрос от имени ребёнка. Если сервер ответил 401 (токен истёк раньше,
 * чем мы думали), один раз обновляем токен и повторяем.
 */
export async function childRequest<T>(
  path: string,
  options: { method?: 'GET' | 'POST'; body?: unknown } = {},
): Promise<T> {
  try {
    let token = await childAccessToken();
    try {
      const result = await apiRequest<T>(path, { ...options, token });
      noteSuccess();
      return result;
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) throw error;
      token = await childAccessToken(true);
      const result = await apiRequest<T>(path, { ...options, token });
      noteSuccess();
      return result;
    }
  } catch (error) {
    noteError(error);
    throw error;
  }
}

/** Проверка связи: «узнаёт ли сервер этого ребёнка». */
export function fetchChildProfile(): Promise<ChildProfile> {
  return childRequest<ChildProfile>('/children/me');
}
