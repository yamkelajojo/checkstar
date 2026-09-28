/**
 * Prototype banking details.
 *
 * The rider registration flow no longer collects banking information —
 * for the prototype, Checkstar fabricates a clearly-labelled dummy record
 * on submit so the existing API contract (`banking_details` payload) keeps
 * working end-to-end without asking users for sensitive data.
 *
 * Everything generated here is obviously fake by design:
 *   - bank name is branded as a prototype,
 *   - branch code is prefixed with PROTOTYPE,
 *   - the account number is derived from the rider's email (deterministic
 *     and reproducible) or random when no seed is given.
 *
 * Keep this in sync with the `banking_details` rules in
 * `backend/app/Http/Requests/RegisterRiderRequest.php` (all fields
 * nullable strings).
 */

export interface PrototypeBankingDetails {
  bank: string;
  account_number: string;
  branch_code: string;
  account_type: string;
  /** Matches the API's generic `banking_details` record type. */
  [key: string]: string;
}

const PROTOTYPE_BANK = "Checkstar Prototype Bank";
const PROTOTYPE_BRANCH_CODE = "PROTOTYPE-000000";

/** djb2-style hash — tiny, dependency-free, stable across browsers. */
function hashSeed(seed: string): number {
  let hash = 5381;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 33) ^ seed.charCodeAt(i);
    hash >>>= 0; // keep it a 32-bit unsigned integer
  }
  return hash;
}

/** Derive a stable 10-digit account number from a seed string. */
function digitsFromSeed(seed: string): string {
  let hash = hashSeed(seed);
  let digits = "";
  while (digits.length < 10) {
    // xorshift32 step: cheap, deterministic, plenty of spread for a demo
    hash ^= hash << 13;
    hash >>>= 0;
    hash ^= hash >> 17;
    hash ^= hash << 5;
    hash >>>= 0;
    digits += String(hash).slice(-4).padStart(4, "0");
  }
  // Never start with a zero — reads more like a real account number.
  return digits.replace(/^0/, "9").slice(0, 10);
}

function randomDigits(): string {
  let digits = "";
  while (digits.length < 10) {
    digits += String(Math.floor(Math.random() * 10));
  }
  return digits.replace(/^0/, "9").slice(0, 10);
}

/**
 * Build the dummy `banking_details` payload for a prototype rider.
 *
 * @param seed Usually the rider's email — makes the generated account
 *             number stable per rider, which keeps the demo data sane
 *             when the same person re-registers.
 */
export function createPrototypeBankingDetails(seed?: string): PrototypeBankingDetails {
  return {
    bank: PROTOTYPE_BANK,
    account_number: seed ? digitsFromSeed(seed) : randomDigits(),
    branch_code: PROTOTYPE_BRANCH_CODE,
    account_type: "savings",
  };
}
