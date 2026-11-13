import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { addItem, parseStored, removeItem, setQty, type CartItem } from '../lib/cart'

const KEY = 'ucv_cart_v1'

interface CartCtx {
    items: CartItem[]
    count: number
    add: (productId: string, qty: number, stock: number) => void
    update: (productId: string, qty: number, stock: number) => void
    remove: (productId: string) => void
    clear: () => void
}

const Ctx = createContext<CartCtx | null>(null)

function load(): CartItem[] {
    try { return parseStored(localStorage.getItem(KEY)) } catch { return [] }
}

export function CartProvider({ children }: Readonly<{ children: ReactNode }>) {
    const [items, setItems] = useState<CartItem[]>(load)

    // Persist across refreshes. Only ids + quantities are stored; prices always come from the server.
    useEffect(() => {
        try { localStorage.setItem(KEY, JSON.stringify(items)) } catch { /* storage unavailable */ }
    }, [items])

    const add = useCallback((id: string, qty: number, stock: number) => setItems((c) => addItem(c, id, qty, stock).items), [])
    const update = useCallback((id: string, qty: number, stock: number) => setItems((c) => setQty(c, id, qty, stock)), [])
    const remove = useCallback((id: string) => setItems((c) => removeItem(c, id)), [])
    const clear = useCallback(() => setItems([]), [])

    const value = useMemo(
        () => ({ items, count: items.reduce((n, i) => n + i.qty, 0), add, update, remove, clear }),
        [items, add, update, remove, clear],
    )
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCart() {
    const c = useContext(Ctx)
    if (!c) throw new Error('useCart must be used inside CartProvider')
    return c
}