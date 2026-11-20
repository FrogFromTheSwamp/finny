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
