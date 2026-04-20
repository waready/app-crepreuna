export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

export function pickString(source: Record<string, unknown>, keys: string[], fallback = '') {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value);
    }
  }
  return fallback;
}

export function pickNumber(source: Record<string, unknown>, keys: string[], fallback = 0) {
  for (const key of keys) {
    const value = Number(source[key]);
    if (Number.isFinite(value)) {
      return value;
    }
  }
  return fallback;
}

export function findArray(value: unknown, preferredKeys: string[] = []): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.filter((item) => item && typeof item === 'object') as Record<string, unknown>[];
  }

  const record = asRecord(value);
  for (const key of preferredKeys) {
    const candidate = record[key];
    if (Array.isArray(candidate)) {
      return candidate.filter((item) => item && typeof item === 'object') as Record<string, unknown>[];
    }
  }

  for (const candidate of Object.values(record)) {
    if (Array.isArray(candidate)) {
      return candidate.filter((item) => item && typeof item === 'object') as Record<string, unknown>[];
    }
    if (candidate && typeof candidate === 'object') {
      const nested = findArray(candidate, preferredKeys);
      if (nested.length) {
        return nested;
      }
    }
  }

  return [];
}

export function findRecord(value: unknown, preferredKeys: string[] = []): Record<string, unknown> {
  const record = asRecord(value);
  for (const key of preferredKeys) {
    const candidate = record[key];
    if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
      return candidate as Record<string, unknown>;
    }
  }
  return record;
}
