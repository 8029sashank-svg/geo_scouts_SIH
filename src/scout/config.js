/**
 * Geo-Farm Field Scout — central map/operating-radius configuration.
 *
 * Single source of truth for the student's allowed operating radius so
 * the value isn't duplicated across FieldMap, Missions, and MissionDetail.
 * Change it here only.
 *
 * Gating uses each mission's existing `distanceKm` mock field (already
 * shown throughout the app), not live geolocation math — this is a
 * frontend prototype, not real GPS geofencing.
 */
export const STUDENT_OPERATING_RADIUS_KM = 15;

export function isWithinOperatingRadius(distanceKm) {
  return typeof distanceKm === 'number' && distanceKm <= STUDENT_OPERATING_RADIUS_KM;
}
