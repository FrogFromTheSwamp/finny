/**
 * Где искать сервер.
 *
 * Сервер работает на компьютере на порту 8000. Как до него добраться,
 * зависит от того, где запущено приложение:
 * - в браузере на этом же компьютере — тот же адрес, что у страницы, порт 8000;
 * - на телефоне — по IP компьютера в Wi-Fi-сети. Этот IP Expo уже знает:
 *   телефон скачивает с него код приложения (hostUri = "192.168.1.5:8081"),
 *   поэтому берём оттуда адрес и меняем порт на 8000.
 *
 * Если нужно указать адрес вручную (например, настоящий сервер),
 * задай переменную EXPO_PUBLIC_API_URL в файле .env в корне проекта.
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = 8000;

function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:${API_PORT}`;
  }

  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) return `http://${host}:${API_PORT}`;

  return `http://localhost:${API_PORT}`;
}

export const API_URL = resolveApiUrl();
