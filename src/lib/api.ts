import * as SecureStore from "expo-secure-store";

import type { Feed, Member } from "./types";

export const API_ORIGIN =
  process.env.EXPO_PUBLIC_API_ORIGIN ?? "https://www.ways2earn.com";
const TOKEN_KEY = "ways2earn.mobile.session";

export class ApiError extends Error {
  constructor(message: string, public code?: string, public email?: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function token() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function saveToken(value: string | null) {
  if (value)
    await SecureStore.setItemAsync(TOKEN_KEY, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export function assetUrl(path: string | null | undefined) {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function request<T>(
  path = "",
  body?: Record<string, unknown>,
): Promise<T> {
  const bearer = await token();
  const response = await fetch(`${API_ORIGIN}/api/mobile${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = (await response.json()) as T & {
    error?: string;
    code?: string;
    email?: string;
  };
  if (!response.ok)
    throw new ApiError(
      result.error || "Ways2Earn could not complete that request.",
      result.code,
      result.email,
    );
  return result;
}

export async function signIn(login: string, password: string) {
  const result = await request<{ token: string; user: Member }>("/session", {
    action: "login",
    login,
    password,
  });
  await saveToken(result.token);
  return result.user;
}

export async function signOut(bearerOverride?: string | null) {
  const bearer = bearerOverride ?? (await token());
  if (bearer)
    await fetch(`${API_ORIGIN}/api/mobile/session`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${bearer}`,
      },
      body: JSON.stringify({ action: "logout" }),
    });
}

export async function registerAccount(handle: string, email: string, password: string) {
  return request<{ ok: true; message: string }>("/registration", {
    action: "register",
    handle,
    email,
    password,
    confirm_password: password,
  });
}

export async function resendConfirmation(email: string) {
  return request<{ ok: true; message: string }>("/registration", {
    action: "resend",
    email,
  });
}

export const getFeed = () => request<Feed>();
export const mutate = <T = { ok: true }>(body: Record<string, unknown>) =>
  request<T>("", body);

export async function uploadImage(uri: string) {
  const bearer = await token();
  const data = new FormData();
  data.append("image", {
    uri,
    name: "ways2earn-image.jpg",
    type: "image/jpeg",
  } as unknown as Blob);
  const response = await fetch(`${API_ORIGIN}/api/mobile/images`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
    },
    body: data,
  });
  const result = (await response.json()) as { url?: string; error?: string };
  if (!response.ok || !result.url)
    throw new Error(result.error || "The image could not be uploaded.");
  return result.url;
}
