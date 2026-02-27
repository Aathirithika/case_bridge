/**
 * server/data/barCouncilLookup.js
 *
 * Utility to enrich lawyer profiles with Bar Council data.
 * Import this in chatEngine.js and chat.js to augment DB results.
 *
 * Usage:
 *   import { enrichLawyerWithBarData } from '../data/barCouncilLookup.js';
 *   const enriched = lawyers.map(enrichLawyerWithBarData);
 */

// ── Import your existing barCouncilData ──
// (Adjust the path/import based on whether barCouncilData.js exports an array or object)
import barCouncilData from './barCouncilData.js';

/**
 * Build a fast lookup map keyed by barCouncilNumber (uppercase, trimmed).
 * Runs once at module load time.
 */
const barCouncilMap = (() => {
  const map = new Map();
  const list = Array.isArray(barCouncilData) ? barCouncilData : Object.values(barCouncilData);
  for (const entry of list) {
    const key = String(entry.barCouncilNumber || entry.enrollmentNumber || '').toUpperCase().trim();
    if (key) map.set(key, entry);
  }
  return map;
})();

/**
 * Enrich a lean lawyer object (from MongoDB .lean()) with Bar Council data.
 * If no match is found the original object is returned unchanged.
 *
 * @param {Object} lawyer  - Mongoose lean lawyer document
 * @returns {Object}       - Lawyer with extra barCouncil fields merged in
 */
export function enrichLawyerWithBarData(lawyer) {
  if (!lawyer?.barCouncilNumber) return lawyer;

  const key = String(lawyer.barCouncilNumber).toUpperCase().trim();
  const barData = barCouncilMap.get(key);

  if (!barData) return lawyer;

  return {
    ...lawyer,
    // Merge fields from barCouncilData that aren't already in the DB record
    enrollmentDate:   lawyer.enrollmentDate   ?? barData.enrollmentDate,
    stateBarCouncil:  lawyer.stateBarCouncil  ?? barData.stateBarCouncil,
    practiceState:    lawyer.practiceState    ?? barData.practiceState   ?? barData.state,
    isVerifiedByBar:  barData.isActive        ?? barData.isVerified      ?? true,
    barCouncilStatus: barData.status          ?? 'Active',
  };
}

/**
 * Look up a lawyer directly by barCouncilNumber.
 * Useful for admin screens or verification flows.
 *
 * @param {string} barCouncilNumber
 * @returns {Object|null}
 */
export function lookupByBarCouncil(barCouncilNumber) {
  if (!barCouncilNumber) return null;
  const key = String(barCouncilNumber).toUpperCase().trim();
  return barCouncilMap.get(key) || null;
}

export default barCouncilMap;