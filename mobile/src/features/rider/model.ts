/** Toggles an order item's bought-selection state. */
export function toggleBoughtId(current: number[], id: number): number[] {
  return current.includes(id) ? current.filter((i) => i !== id) : [...current, id];
}

/** True when every line of an order has been selected as bought. */
export function allItemsSelected(boughtIds: number[], totalItems: number): boolean {
  return boughtIds.length === totalItems;
}

/** The ids of every line in an order, used for the mark-bought flow. */
export function allItemIds(items: { id: number }[]): number[] {
  return items.map((i) => i.id);
}
