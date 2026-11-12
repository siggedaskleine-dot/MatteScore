import AsyncStorage from '@react-native-async-storage/async-storage';
import { demoRequest } from './demo';

const BASE_URL = 'https://v3.football.api-sports.io';
const BUILD_KEY = process.env.EXPO_PUBLIC_API_FOOTBALL_KEY ?? '';
const KEY_STORAGE = 'ms-api-key';

// The key can be baked in at build time (.env.local) or entered in the app's settings.
let apiKey = BUILD_KEY;
const keyListeners = new Set<(k: string) => void>();

export function getApiKey() {
  return apiKey;
}

/** True when no API key is configured; the app then shows clearly-labelled demo data. */
export function isDemo() {
  return apiKey.length === 0;
}

export function onApiKeyChange(l: (k: string) => void) {
  keyListeners.add(l);
  return () => {
    keyListeners.delete(l);
  };
}

export async function loadApiKey() {
  try {
    const stored = await AsyncStorage.getItem(KEY_STORAGE);
    if (stored) setKeyInternal(stored);
  } catch {
    // ignore
  }
}

function setKeyInternal(k: string) {
  if (k === apiKey) return;
  apiKey = k;
  memory.clear();
  keyListeners.forEach((l) => l(k));
}

export async function saveApiKey(k: string) {
  const key = k.trim();
  if (key) await AsyncStorage.setItem(KEY_STORAGE, key);
  else await AsyncStorage.removeItem(KEY_STORAGE);
  setKeyInternal(key || BUILD_KEY);
}

/** Calls /status to check that a key works. Does not count against the daily quota. */
export async function checkApiKey(k: string) {
  const res = await fetch(`${BASE_URL}/status`, { headers: { 'x-apisports-key': k.trim() } });
  const json = await res.json();
  const errors = json.errors;
  if (errors && (Array.isArray(errors) ? errors.length : Object.keys(errors).length)) {
    throw new ApiError(Array.isArray(errors) ? errors.join(', ') : Object.values(errors).join(', '));
  }
  const r = json.response;
  return {
    plan: r?.subscription?.plan as string | undefined,
    used: r?.requests?.current as number | undefined,
    limit: r?.requests?.limit_day as number | undefined,
  };
}

export class ApiError extends Error {}

type Listener = (remaining: number | null) => void;
let remainingToday: number | null = null;
const listeners = new Set<Listener>();
export const onQuotaChange = (l: Listener) => {
  listeners.add(l);
  l(remainingToday);
  return () => listeners.delete(l);
};

const memory: Map<string, { at: number; data: unknown }> = new Map<string, { at: number; data: unknown }>();
const inflight = new Map<string, Promise<unknown>>();
const STORAGE_PREFIX = 'ms-cache:';

/**
 * GET an api-football endpoint and return its `response` field.
 * Results are cached in memory and on disk for `ttlSeconds`, because the
 * free plan only allows 100 requests per day.
 */
export async function apiGet<T>(
  path: string,
  params: Record<string, string | number>,
  ttlSeconds: number,
): Promise<T> {
  const query = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');
  const key = `${path}?${query}`;

  if (isDemo()) return demoRequest(path, params) as T;

  const now = Date.now();
  const mem = memory.get(key);
  if (mem && now - mem.at < ttlSeconds * 1000) return mem.data as T;

  try {
    const raw = await AsyncStorage.getItem(STORAGE_PREFIX + key);
    if (raw) {
      const stored = JSON.parse(raw) as { at: number; data: T };
      if (now - stored.at < ttlSeconds * 1000) {
        memory.set(key, stored);
        return stored.data;
      }
    }
  } catch {
    // ignore storage errors, fall through to network
  }

  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;

  const p = (async () => {
    const res = await fetch(`${BASE_URL}${path}?${query}`, {
      headers: { 'x-apisports-key': apiKey },
    });
    const rem = res.headers.get('x-ratelimit-requests-remaining');
    if (rem !== null) {
      remainingToday = Number(rem);
      listeners.forEach((l) => l(remainingToday));
    }
    if (!res.ok) throw new ApiError(`Servern svarade ${res.status}`);
    const json = await res.json();
    const errors = json.errors;
    const hasErrors = errors && (Array.isArray(errors) ? errors.length > 0 : Object.keys(errors).length > 0);
    if (hasErrors) {
      const msg = Array.isArray(errors) ? errors.join(', ') : Object.values(errors).join(', ');
      throw new ApiError(String(msg));
    }
    const entry = { at: Date.now(), data: json.response as T };
    memory.set(key, entry);
    AsyncStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry)).catch(() => {});
    return entry.data;
  })();

  inflight.set(key, p);
  try {
    return await p;
  } finally {
    inflight.delete(key);
  }
}

/** Remove expired disk-cache entries older than two days. */
export async function pruneCache() {
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(STORAGE_PREFIX));
    const old: string[] = [];
    for (const k of keys) {
      const raw = await AsyncStorage.getItem(k);
      if (!raw) continue;
      const { at } = JSON.parse(raw);
      if (Date.now() - at > 2 * 86400 * 1000) old.push(k);
    }
    if (old.length) await AsyncStorage.multiRemove(old);
  } catch {
    // ignore
  }
}
