export const MIN_ORDER_CENTS = 5000;
export const MIN_ADDRESS_LENGTH = 8;

export interface CanSubmitInput {
  itemCount: number;
  subtotalCents: number;
  address: string;
  authenticated: boolean;
  storeSelected: boolean;
  submitting: boolean;
  validatingFulfillment?: boolean;
  fulfillmentValid?: boolean;
}

/**
 * Whether the Place order button can be pressed. All gates must pass:
 * non-empty cart, subtotal at or above the minimum order, a long-enough
 * delivery address, an authenticated Customer, no submit already in flight,
 * and fulfillment validation must have completed successfully.
 *
 * Note: storeSelected is NOT required — the backend auto-selects the
 * optimal store via the Dispatch Policy algorithm. We gate on
 * fulfillmentValid instead, which indicates at least one store can
 * fulfill the complete order.
 */
export function canSubmit(input: CanSubmitInput): boolean {
  return (
    input.itemCount > 0 &&
    input.subtotalCents >= MIN_ORDER_CENTS &&
    input.address.trim().length >= MIN_ADDRESS_LENGTH &&
    input.authenticated &&
    !input.submitting &&
    !input.validatingFulfillment &&
    input.fulfillmentValid === true
  );
}
