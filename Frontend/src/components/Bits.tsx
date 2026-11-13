import { useEffect, useState, type ReactNode } from 'react'
import type { Product } from '../api/types'
import type { Async } from '../lib/hooks'
import { badgeBase, badgeTone, btn, cx, emptyBox, fieldError, fieldLabel, hintText, noticeBase, noticeTone, pillTone } from '../lib/ui'

type NoticeKind = 'info' | 'error' | 'success' | 'warn'

export function Notice({ kind = 'info', children }: Readonly<{ kind?: NoticeKind; children: ReactNode }>) {
    const classes = cx('block', noticeBase, noticeTone[kind])
    // <output> has the implicit "status" role; errors are announced more urgently with role="alert".
    if (kind === 'error') return <div className={classes} role="alert">{children}</div>
    return <output className={classes}>{children}</output>
}

export function Loading({ label = 'Loading…' }: Readonly<{ label?: string }>) {
    const [slow, setSlow] = useState(false)
    useEffect(() => {
        const t = setTimeout(() => setSlow(true), 4000)
        return () => clearTimeout(t)
    }, [])
    return (
        <output className="block text-muted">
        {slow ? 'Still loading… the free server may be waking up, which can take up to a minute.' : label}
        </output>
    )
}

export function ErrorState({ message, onRetry }: Readonly<{ message: string; onRetry?: () => void }>) {
    return (
        <div className={emptyBox}>
        <p className="mb-3">{message}</p>
        {onRetry && <button className={btn()} onClick={onRetry}>Try again</button>}
        </div>
    )
}

export function Empty({ title, children }: Readonly<{ title: string; children?: ReactNode }>) {
    return (
        <div className={emptyBox}>
        <h3 className="mb-2 text-xl font-bold">{title}</h3>
        {children}
        </div>
    )
}

export function AsyncList<T>({ state, empty, children }: Readonly<{
    state: Async<T[]>
    empty: ReactNode
    children: (rows: T[]) => ReactNode
    }>) {
    if (state.loading && !state.data) return <Loading />
    if (state.error && !state.data) return <ErrorState message={state.error} onRetry={state.reload} />
    if (!state.data || state.data.length === 0) return <>{empty}</>
    return <>{children(state.data)}</>
}

export function StockBadge({ product }: Readonly<{ product: Pick<Product, 'inStock' | 'stock'> }>) {
    if (!product.inStock) return <span className={cx(badgeBase, badgeTone.out)}>Out of Stock</span>
    if (product.stock <= 5) return <span className={cx(badgeBase, badgeTone.low)}>Only {product.stock} left</span>
    return <span className={cx(badgeBase, badgeTone.ok)}>In stock ({product.stock})</span>
}

export function ProductImage({ src, alt, className }: Readonly<{ src: string; alt: string; className?: string }>) {
    return (
        <img
        src={src || '/images/hero.svg'}
        alt={alt}
        loading="lazy"
        className={cx('h-full w-full object-cover', className)}
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/hero.svg' }}
        />
    )
}

export function StatusPill({ status }: Readonly<{ status: string }>) {
    return <span className={cx(badgeBase, pillTone[status.toLowerCase()] ?? 'bg-white text-ink')}>{status}</span>
}

export function Field({ label, error, hint, children }: Readonly<{ label: string; error?: string; hint?: string; children: ReactNode }>) {
    return (
        <label className="flex min-w-0 flex-col gap-1">
        <span className={fieldLabel}>{label}</span>
        {children}
        {hint && !error && <span className={hintText}>{hint}</span>}
        {error && <span className={fieldError} role="alert">{error}</span>}
        </label>
    )
}