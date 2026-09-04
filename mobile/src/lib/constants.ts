// Order constraints
export const MIN_ORDER_CENTS = 5000;
export const FREE_DELIVERY_THRESHOLD_CENTS = 35000;
export const MAX_QUANTITY_PER_ITEM = 8;
export const EST_DELIVERY_FEE_CENTS = 0;

// Location
export const DURBAN_COORDS = { latitude: -29.8587, longitude: 31.0218 } as const;

// Timing
export const BOOT_TIMEOUT_MS = 5000;
export const SEARCH_DEBOUNCE_MS = 400;
export const VALIDATION_DEBOUNCE_MS = 500;
export const POLL_BASE_MS = 10_000;
export const POLL_MAX_MS = 60_000;
