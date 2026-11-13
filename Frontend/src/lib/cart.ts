/** Pure cart rules. The cart stores ONLY product ids and quantities, never prices. */
export interface CartItem { productId: string; qty: number }

export const isPositiveInt = (n: unknown): n is number =>
  typeof n === 'number' && Number.isInteger(n) && n > 0

/** Adds qty, merging into an existing line (no duplicates) and capping at stock. */
export function addItem(items: CartItem[], productId: string, qty: number, stock: number): { items: CartItem[]; capped: boolean } {
  if (!isPositiveInt(qty) || stock < 1) return { items, capped: false }
  const existing = items.find((i) => i.productId === productId)
  const wanted = (existing?.qty ?? 0) + qty
  const finalQty = Math.min(wanted, stock)
  const next = existing
    ? items.map((i) => (i.productId === productId ? { ...i, qty: finalQty } : i))
    : [...items, { productId, qty: finalQty }]
  return { items: next, capped: wanted > stock }
}

export function setQty(items: CartItem[], productId: string, qty: number, stock: number): CartItem[] {
  if (!isPositiveInt(qty)) return items
  return items.map((i) => (i.productId === productId ? { ...i, qty: Math.min(qty, Math.max(stock, 1)) } : i))
}

export const removeItem = (items: CartItem[], productId: string) =>
  items.filter((i) => i.productId !== productId)

/** localStorage is user-editable, so never trust what is in it. */
export function parseStored(raw: string | null): CartItem[] {
  try {
    const data = JSON.parse(raw ?? '[]')
    if (!Array.isArray(data)) return []
    const merged = new Map<string, number>()
    for (const d of data) {
      if (d && typeof d.productId === 'string' && isPositiveInt(d.qty)) {
        merged.set(d.productId, (merged.get(d.productId) ?? 0) + d.qty)
      }
    }
    return [...merged].map(([productId, qty]) => ({ productId, qty }))
  } catch {
    return []
  }
}