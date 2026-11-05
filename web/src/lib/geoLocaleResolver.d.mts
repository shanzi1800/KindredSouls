export const LIFESTYLE_GEO_ZONES: readonly string[];
export const LIFESTYLE_GEO_ZONE_NAMES: Readonly<Record<string, string>>;

export function geoZoneFromCountry(cc: unknown): string | null;
export function geoZoneFromTimezone(tz: unknown): string | null;
export function resolveLifestyleGeoZone(hints: { country?: string; timezone?: string } | null | undefined): string | null;
export function resolveBrowserGeoZone(): string | null;
