import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../api/client'
import { Empty, ErrorState, Loading, Notice, ProductImage, StockBadge } from '../../components/Bits'
import { ProductCard } from '../../components/ProductCard'
import { useCart } from '../../context/CartContext'
import { useAsync } from '../../lib/hooks'
import { formatPHP } from '../../lib/money'
import { btn, fieldLabel, input } from '../../lib/ui'

export default function ProductDetail() {
    const { id = '' } = useParams()
    const cart = useCart()
    const [qty, setQty] = useState('1')
    const [msg, setMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

    const res = useAsync(() => api.product(id), [id])

    if (res.loading) return <Loading />
    if (res.error) {
        // The server answers 404 "not available" for missing AND inactive products (direct links included).
        return res.error.toLowerCase().includes('not available')
        ? <Empty title="This product is not available"><Link className={btn()} to="/products">Back to shop</Link></Empty>
        : <ErrorState message={res.error} onRetry={res.reload} />
    }

    const { product: p, related } = res.data!
    const inCart = cart.items.find((i) => i.productId === p.id)?.qty ?? 0
    const room = p.stock - inCart

    const add = () => {
        const n = Number(qty)
        if (!qty.trim() || !Number.isInteger(n) || n < 1) {
        return setMsg({ kind: 'error', text: 'Quantity must be a whole number of at least 1.' })
        }
        if (n > room) {
        return setMsg({
            kind: 'error',
            text: room <= 0 ? `All ${p.stock} available are already in your cart.` : `Only ${room} more can be added (stock ${p.stock}, in cart ${inCart}).`,
        })
        }
        cart.add(p.id, n, p.stock)
        setMsg({ kind: 'success', text: `Added ${n} to your cart.` })
    }

    return (
        <>
        <p className="mb-3 text-sm"><Link to="/products">← All products</Link></p>
        <div className="grid items-start gap-5 md:grid-cols-2 md:gap-8">
            <div className="aspect-4/3 overflow-hidden rounded-xl border-2 border-ink shadow-hotpink md:shadow-hotpink-lg">
            <ProductImage src={p.imageUrl} alt={p.name} />
            </div>
            <div className="flex flex-col items-start gap-2">
            <p className="text-muted">{p.categoryName}</p>
            <h1 className="text-3xl font-extrabold md:text-4xl">{p.name}</h1>
            <p className="font-display text-3xl font-extrabold text-cobalt">{formatPHP(p.priceCents)}</p>
            <StockBadge product={p} />
            <p className="max-w-[60ch]">{p.description}</p>

            {p.inStock ? (
                <div className="my-3 flex flex-wrap items-end gap-4">
                <label className="flex w-28 flex-col gap-1">
                    <span className={fieldLabel}>Quantity</span>
                    <input className={input} type="number" min={1} max={p.stock} step={1} inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} />
                </label>
                <button className={btn('primary', 'lg')} onClick={add}>Add to Cart</button>
                </div>
            ) : (
                <button className={btn('primary', 'lg')} disabled>Out of Stock</button>
            )}

            {msg && <div className="self-stretch"><Notice kind={msg.kind}>{msg.text} {msg.kind === 'success' && <Link to="/cart">View cart</Link>}</Notice></div>}
            </div>
        </div>

        {/* Omitted entirely when there are no related products. */}
        {related.length > 0 && (
            <section aria-labelledby="rel-h">
            <h2 id="rel-h" className="mb-3 mt-10 text-2xl font-bold">Related products</h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-5">
                {related.map((r) => <ProductCard key={r.id} product={r} />)}
            </div>
            </section>
        )}
        </>
    )
}