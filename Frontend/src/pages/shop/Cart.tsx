import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import type { CartLine } from '../../api/types'
import { Empty, ErrorState, Loading, Notice, ProductImage } from '../../components/Bits'
import { useCart } from '../../context/CartContext'
import { isPositiveInt } from '../../lib/cart'
import { useAsync } from '../../lib/hooks'
import { formatPHP } from '../../lib/money'
import { btn, cx, fieldError, linkBtn, qtyInput } from '../../lib/ui'

function QtyControl({ line, onChange }: { line: CartLine; onChange: (n: number) => void }) {
    const [text, setText] = useState(String(line.qty))
    const [err, setErr] = useState('')
    useEffect(() => { setText(String(line.qty)); setErr('') }, [line.qty])

    const commit = (raw: string) => {
        const n = Number(raw)
        if (!raw.trim() || !isPositiveInt(n)) { setErr('Enter a whole number of 1 or more.'); return }
        if (n > line.stock) { setErr(`Only ${line.stock} in stock.`); onChange(line.stock); return }
        setErr('')
        if (n !== line.qty) onChange(n)
    }

    return (
        <div className="col-span-2 sm:col-span-1">
        <div className="inline-flex items-center gap-1">
            <button className={btn('default', 'sm')} aria-label={`Decrease ${line.name}`} disabled={line.qty <= 1} onClick={() => onChange(line.qty - 1)}>−</button>
            <input
            className={qtyInput}
            aria-label={`Quantity for ${line.name}`} type="number" min={1} max={line.stock} step={1} inputMode="numeric"
            value={text} onChange={(e) => setText(e.target.value)}
            onBlur={() => commit(text)} onKeyDown={(e) => e.key === 'Enter' && commit(text)}
            />
            <button className={btn('default', 'sm')} aria-label={`Increase ${line.name}`} disabled={line.qty >= line.stock} onClick={() => onChange(line.qty + 1)}>+</button>
        </div>
        {err && <p className={fieldError} role="alert">{err}</p>}
        </div>
    )
}

export default function Cart() {
    const cart = useCart()
    const key = JSON.stringify(cart.items)
    const res = useAsync(() => (cart.items.length ? api.resolveCart(cart.items) : Promise.resolve(null)), [key])

    if (cart.items.length === 0) {
        return (
        <Empty title="Your cart is empty">
            <p className="mb-3 text-muted">Add a few things you like and they will appear here.</p>
            <Link className={btn('primary')} to="/products">Browse products</Link>
        </Empty>
        )
    }
    if (!res.data && res.loading) return <Loading />
    if (!res.data) return <ErrorState message={res.error ?? 'Could not load your cart.'} onRetry={res.reload} />

    const { lines, totalCents, hasIssues } = res.data

    return (
        <>
        <h1 className="mb-3 text-3xl font-extrabold md:text-4xl">Your cart</h1>
        {hasIssues && <Notice kind="warn">Some items need attention before you can check out.</Notice>}

        <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {lines.map((l) => (
            <li key={l.productId} className="grid grid-cols-[64px_1fr] items-center gap-3 rounded-xl border-2 border-ink bg-white p-3 sm:grid-cols-[72px_1fr_auto_auto_auto]">
                <div className="aspect-square w-16 overflow-hidden rounded-lg border-2 border-ink sm:w-18"><ProductImage src={l.imageUrl} alt={l.name} /></div>
                <div>
                <Link to={`/products/${l.productId}`} className="font-bold text-ink no-underline hover:underline">{l.name}</Link>
                {l.issue === 'UNAVAILABLE' && <p className={fieldError}>This product is no longer available. Please remove it.</p>}
                {l.issue === 'OUT_OF_STOCK' && <p className={fieldError}>Out of stock. Please remove it.</p>}
                {l.issue === 'INSUFFICIENT_STOCK' && (
                    <p className={fieldError}>
                    Only {l.stock} available.{' '}
                    <button className={linkBtn} onClick={() => cart.update(l.productId, l.stock, l.stock)}>Set to {l.stock}</button>
                    </p>
                )}
                {l.issue !== 'UNAVAILABLE' && <p className="text-sm text-muted">Unit price {formatPHP(l.unitPriceCents)}</p>}
                </div>
                {l.issue !== 'UNAVAILABLE' && l.issue !== 'OUT_OF_STOCK' && (
                <QtyControl line={l} onChange={(n) => cart.update(l.productId, n, l.stock)} />
                )}
                <div className="col-span-2 min-w-26 font-extrabold sm:col-span-1 sm:text-right">{l.issue ? '—' : formatPHP(l.lineTotalCents)}</div>
                <button className={cx(btn('dangerGhost', 'sm'), 'col-span-2 sm:col-span-1')} onClick={() => cart.remove(l.productId)} aria-label={`Remove ${l.name}`}>Remove</button>
            </li>
            ))}
        </ul>

        <div className="mt-4 flex flex-col gap-2.5 rounded-xl border-2 border-ink bg-white p-4 shadow-cobalt-lg">
            <div className="flex justify-between gap-4"><span>Subtotal</span><span>{formatPHP(totalCents)}</span></div>
            <div className="flex justify-between gap-4 border-t-2 border-dashed border-ink pt-2.5 font-display text-xl font-extrabold"><span>Total</span><span>{formatPHP(totalCents)}</span></div>
            <p className="text-sm text-muted">No shipping, tax or service charge in this demo.</p>
            {hasIssues
            ? <button className={btn('primary', 'lg')} disabled>Proceed to checkout</button>
            : <Link className={btn('primary', 'lg')} to="/checkout">Proceed to checkout</Link>}
        </div>
        </>
    )
}