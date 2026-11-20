/** Форматы ответов сервера (повторяют server/app/schemas.py). */

export type ChildRegistered = {
  child_id: string;
  device_id: string;
  device_token: string;
  access_token: string;
  token_type: string;
  expires_in: number;
};

export type AccessToken = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

export type ChildProfile = {
  id: string;
  pet_name: string | null;
  pet_color: string | null;
  timezone: string;
};

export type TokenPair = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
};

export type LinkCode = {
  code: string;
  expires_at: string;
};

export type LinkedChild = ChildProfile & {
  linked_at: string;
  /** true — ребёнок уже был в списке, новая связь не создавалась */
  already_linked?: boolean;
};

export type ParentMe = {
  id: string;
  email: string;
  name: string;
  children: LinkedChild[];
};
