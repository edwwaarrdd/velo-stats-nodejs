/**
 * Formats dates and times the way the API renders them: UTC ISO-8601 with a
 * "Z" suffix and no sub-second precision.
 */
export function apiDateTime(value: Date | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return `${value.toISOString().slice(0, 19)}Z`;
}

export function apiDate(value: Date | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return value.toISOString().slice(0, 10);
}
