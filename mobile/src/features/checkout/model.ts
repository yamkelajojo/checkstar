export const MIN_ORDER_CENTS = 5000;
export const MIN_ADDRESS_LENGTH = 8;

export interface CanSubmitInput {
  itemCount: number;
  subtotalCents: number;
  address: string;
  authenticated: boolean;
  storeSelected: boolean;
  submitting: boolean;
}

/**
 * Whether the Place order button can be pressed. All gates must pass:
 * non-empty cart, subtotal at or above the minimum order, a long-enough
 * delivery address, an authenticated Customer, a selected Store, and no
 * submit already in flight.
 */
export function canSubmit(input: CanSubmitInput): boolean {
  return (
    input.itemCount > 0 &&
    input.subtotalCents >= MIN_ORDER_CENTS &&
    input.address.trim().length >= MIN_ADDRESS_LENGTH &&
    input.authenticated &&
    !input.submitting
  );
}
