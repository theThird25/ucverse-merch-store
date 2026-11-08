import { useEffect, useState, type ReactNode } from 'react';
import type { Product } from '../api/types';
import { badgeBase, badgeTone, btn, cx, emptyBox, fieldError, fieldLabel, hintText, noticeBase, noticeTone, pillTone } from '../lib/ui';

export function Notice({ kind = 'info', children }: { kind?: 'info' | 'error' | 'success' | 'warn'; children: ReactNode }) {
    return <div className={cx(noticeBase, noticeTone[kind])} role={kind === 'error' ? 'alert' : 'status'}>{children}</div>
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
    const [slow, setSlow] = useState(false)
    useEffect(() => {
        const t = setTimeout(() => setSlow(true), 4000)
        return () => clearTimeout(t)
    }, [])
    return (
        <p className="text-muted" role="status">
        {slow ? 'Still loading… the free server may be waking up, which can take up to a minute.' : label}
        </p>
    )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
    return (
        <div className={emptyBox}>
        <p className="mb-3">{message}</p>
        {onRetry && <button className={btn()} onClick={onRetry}>Try again</button>}
        </div>
    )
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
    return (
        <div className={emptyBox}>
        <h3 className="mb-2 text-xl font-bold">{title}</h3>
        {children}
        </div>
    )
}

export function StockBadge({ product }: { product: Pick<Product, 'inStock' | 'stock'> }) {
    if (!product.inStock) return <span className={cx(badgeBase, badgeTone.out)}>Out of Stock</span>
    if (product.stock <= 5) return <span className={cx(badgeBase, badgeTone.low)}>Only {product.stock} left</span>
    return <span className={cx(badgeBase, badgeTone.ok)}>In stock ({product.stock})</span>
}

export function ProductImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
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

export function StatusPill({ status }: { status: string }) {
    return <span className={cx(badgeBase, pillTone[status.toLowerCase()] ?? 'bg-white text-ink')}>{status}</span>
}

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
    return (
        <label className="flex min-w-0 flex-col gap-1">
        <span className={fieldLabel}>{label}</span>
        {children}
        {hint && !error && <span className={hintText}>{hint}</span>}
        {error && <span className={fieldError} role="alert">{error}</span>}
        </label>
    )
}