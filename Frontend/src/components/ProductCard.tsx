import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '../api/types'
import { useCart } from '../context/CartContext'
import { formatPHP } from '../lib/money'
import { btn, card } from '../lib/ui'
import { ProductImage, StockBadge } from './Bits'

export function ProductCard({ product }: { product: Product }) {
    const cart = useCart()
    const [msg, setMsg] = useState('')
    const inCart = cart.items.find((i) => i.productId === product.id)?.qty ?? 0

    const onAdd = () => {
        if (inCart >= product.stock) { setMsg(`All ${product.stock} available are already in your cart.`); return }
        cart.add(product.id, 1, product.stock)
        setMsg('Added to cart')
        setTimeout(() => setMsg(''), 1800)
    }

    return (
        <article className={card}>
        <Link to={`/products/${product.id}`} className="block aspect-4/3 border-b-2 border-ink bg-lemon-soft" aria-label={`View ${product.name}`}>
            <ProductImage src={product.imageUrl} alt={product.name} />
        </Link>
        <div className="flex flex-1 flex-col gap-1.5 p-3.5">
            <p className="text-sm text-muted">{product.categoryName}</p>
            <h3 className="text-[1.05rem] font-bold">
            <Link to={`/products/${product.id}`} className="text-ink no-underline hover:text-cobalt hover:underline">{product.name}</Link>
            </h3>
            <p className="font-display text-lg font-extrabold text-cobalt">{formatPHP(product.priceCents)}</p>
            <StockBadge product={product} />
            <div className="mt-auto flex flex-wrap gap-2 pt-2.5">
            <Link className={`${btn('ghost')} flex-1`} to={`/products/${product.id}`}>View Details</Link>
            {/* Out-of-stock products stay visible, but cannot be added. */}
            <button className={`${btn('primary')} flex-1`} onClick={onAdd} disabled={!product.inStock}>
                {product.inStock ? 'Add to Cart' : 'Out of Stock'}
            </button>
            </div>
            <p className="min-h-5 text-sm text-muted" aria-live="polite">{msg}</p>
        </div>
        </article>
    )
}