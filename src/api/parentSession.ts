/**
 * Сессия родителя: вход по почте и паролю, токены, запросы от имени родителя.
 *
 * Refresh-токен (30 дней) сохраняется на устройстве, чтобы не вводить пароль
 * каждый раз. Access-токен (30 минут) живёт только в памяти и обновляется
 * по refresh-токену. Сервер при обновлении выдаёт НОВЫЙ refresh-токен и
 * отзывает старый (ротация), поэтому одновременно обновлять токен из двух
 * мест нельзя — для этого ниже «одна дверь» (refreshing).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { ApiError, apiRequest } from '@/api/client';
import type { LinkedChild, ParentMe, TokenPair } from '@/api/types';

type ParentSessionState = {
  email: string | null;
  name: string | null;
  refreshToken: string | null;
  accessToken: string | null;
  accessExpiresAt: number;
  clear: () => void;
};

const empty = { email: null, name: null, refreshToken: null, accessToken: null, accessExpiresAt: 0 };

export const useParentSession = create<ParentSessionState>()(
  persist(
    (set) => ({
      ...empty,
      clear: () => set(empty),
    }),
    {
      name: 'finny-parent-session',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ email, name, refreshToken }) => ({ email, name, refreshToken }),
    },
  ),
);

const get = () => useParentSession.getState();
const set = (patch: Partial<ParentSessionState>) => useParentSession.setState(patch);

function saveTokens(pair: TokenPair) {
  set({
    accessToken: pair.access_token,
    refreshToken: pair.refresh_token,
    accessExpiresAt: Date.now() + pair.expires_in * 1000,
  });
}

// ---------- Вход и выход ----------

export async function registerParent(input: { email: string; password: string; name: string }) {
  const pair = await apiRequest<TokenPair>('/auth/parents/register', {
    method: 'POST',
    body: { email: input.email.trim(), password: input.password, name: input.name.trim() },
  });
  saveTokens(pair);
  set({ email: input.email.trim().toLowerCase(), name: input.name.trim() });
}

export async function loginParent(input: { email: string; password: string }) {
  const pair = await apiRequest<TokenPair>('/auth/parents/login', {
    method: 'POST',
    body: { email: input.email.trim(), password: input.password },
  });
  saveTokens(pair);
  set({ email: input.email.trim().toLowerCase() });
}

/** Выйти: отозвать refresh-токен на сервере (если есть связь) и забыть его здесь. */
export async function logoutParent() {
  const refreshToken = get().refreshToken;
  get().clear();
  if (!refreshToken) return;
  try {
    await apiRequest('/auth/logout', { method: 'POST', body: { refresh_token: refreshToken } });
  } catch {
    // Нет связи — не страшно: токен на устройстве уже удалён, на сервере истечёт сам
  }
}

// ---------- Токены ----------

let refreshing: Promise<string> | null = null;

async function parentAccessToken(forceRefresh = false): Promise<string> {
  const state = get();
  if (!state.refreshToken) throw new ApiError(401, 'Нужно войти в аккаунт');
  const stillValid = state.accessToken && state.accessExpiresAt - Date.now() > 60_000;
  if (stillValid && !forceRefresh) return state.accessToken!;

  if (!refreshing) {
    refreshing = (async () => {
      try {
        const pair = await apiRequest<TokenPair>('/auth/refresh', {
          method: 'POST',
          body: { refresh_token: state.refreshToken },
        });
        saveTokens(pair);
        return pair.access_token;
      } catch (error) {
        // Refresh-токен отозван или истёк — придётся войти заново
        if (error instanceof ApiError && error.status === 401) get().clear();
        throw error;
      } finally {
        refreshing = null;
      }
    })();
  }
  return refreshing;
}

export async function parentRequest<T>(
  path: string,
  options: { method?: 'GET' | 'POST'; body?: unknown } = {},
): Promise<T> {
  let token = await parentAccessToken();
  try {
    return await apiRequest<T>(path, { ...options, token });
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    token = await parentAccessToken(true);
    return apiRequest<T>(path, { ...options, token });
  }
}

// ---------- Данные ----------

export async function fetchParentMe(): Promise<ParentMe> {
  const me = await parentRequest<ParentMe>('/parents/me');
  set({ name: me.name, email: me.email });
  return me;
}

export function linkChild(code: string): Promise<LinkedChild> {
  return parentRequest<LinkedChild>('/family/link', { method: 'POST', body: { code, consent: true } });
}
