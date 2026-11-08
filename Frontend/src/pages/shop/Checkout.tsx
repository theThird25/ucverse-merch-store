import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, ApiError, errorMessage } from '../../api/client'
import type { CartChange } from '../../api/types'
import { Empty, ErrorState, Field, Loading, Notice } from '../../components/Bits'
import { useCart } from '../../context/CartContext'
import { useAsync } from '../../lib/hooks'
import { formatPHP } from '../../lib/money'
import { btn, checkInput, fieldError, fieldset, input, legend } from '../../lib/ui'

const METHODS = ['Cash on Delivery', 'E-Wallet', 'Bank Transfer']

type Form = { customerName: string; email: string; phone: string; address: string; paymentMethod: string; notes: string }
type Errors = Partial<Record<keyof Form, string>>

/** Mirrors the server rules for quick feedback. The server stays the authority. */
function validate(f: Form): Errors {
    const e: Errors = {}
    if (!f.customerName.trim()) e.customerName = 'Please enter your name.'
    if (!f.email.trim()) e.email = 'Please enter your email.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'Enter a valid email address.'
    if (!f.phone.trim()) e.phone = 'Please enter a contact number.'
    else if (!/^\+?[0-9\s\-().]{7,25}$/.test(f.phone.trim()) || f.phone.replace(/\D/g, '').length < 7) {
        e.phone = 'Enter a valid contact number.'
    }
    if (!f.address.trim()) e.address = 'Please enter your delivery address.'
    if (!METHODS.includes(f.paymentMethod)) e.paymentMethod = 'Choose a payment method.'
    return e
}

function describe(c: CartChange): string {
    switch (c.type) {
        case 'PRICE_CHANGED': return `${c.name}: price changed from ${formatPHP(c.oldPriceCents ?? 0)} to ${formatPHP(c.newPriceCents ?? 0)}.`
        case 'OUT_OF_STOCK': return `${c.name} is now out of stock.`
        case 'INSUFFICIENT_STOCK': return `${c.name}: only ${c.availableStock} left (you asked for ${c.requestedQty}).`
        default: return `${c.name} is no longer available.`
    }
}

export default function Checkout() {
    const nav = useNavigate()
    const cart = useCart()
    const key = JSON.stringify(cart.items)
    const res = useAsync(() => (cart.items.length ? api.resolveCart(cart.items) : Promise.resolve(null)), [key])

    const [form, setForm] = useState<Form>({ customerName: '', email: '', phone: '', address: '', paymentMethod: '', notes: '' })
    const [errors, setErrors] = useState<Errors>({})
    const [saving, setSaving] = useState(false)
    const [failure, setFailure] = useState('')
    const [changes, setChanges] = useState<CartChange[]>([])
    const [reviewed, setReviewed] = useState(false)

    const set = (k: keyof Form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))

    if (cart.items.length === 0) {
        return (
        <Empty title="Your cart is empty">
            <p className="mb-3 text-muted">Add something before checking out.</p>
            <Link className={btn('primary')} to="/products">Browse products</Link>
        </Empty>
        )
    }
    if (!res.data && res.loading) return <Loading />
    if (!res.data) return <ErrorState message={res.error ?? 'Could not load your cart.'} onRetry={res.reload} />

    const { lines, totalCents, hasIssues } = res.data
    const mustReview = changes.length > 0 && !reviewed

    const onSubmit = async (ev: FormEvent) => {
        ev.preventDefault()
        if (saving) return
        setFailure('')

        const errs = validate(form)
        setErrors(errs)
        if (Object.keys(errs).length) return

        setSaving(true)
        try {
        const order = await api.placeOrder({
            ...form,
            // The unit price is only "the price the customer saw". The server recomputes the total itself.
            items: lines.map((l) => ({ productId: l.productId, qty: l.qty, unitPriceCents: l.unitPriceCents })),
        })

        // Only now, after the server confirmed the order is saved, clear the cart and show confirmation.
        cart.clear()
        try { sessionStorage.setItem('ucv_last_order', JSON.stringify(order)) } catch { /* ignore */ }
        nav('/order-confirmation', { state: { order }, replace: true })
        } catch (e) {
        if (e instanceof ApiError && e.code === 'CART_CHANGED' && e.changes?.length) {
            setChanges(e.changes)
            setReviewed(false)
            res.reload() // show the latest prices and stock; the cart is kept
            setFailure(e.message)
        } else if (e instanceof ApiError && e.status === 422 && e.fieldErrors) {
            const next: Errors = {}
            for (const [k, v] of Object.entries(e.fieldErrors)) next[k as keyof Form] = v[0]
            setErrors(next)
            setFailure('Please fix the highlighted fields.')
        } else {
            setFailure(errorMessage(e)) // the cart is untouched
        }
        } finally {
        setSaving(false)
        }
    }

    return (
        <>
        <h1 className="mb-3 text-3xl font-extrabold md:text-4xl">Checkout</h1>
        <div className="grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
            <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            {failure && <Notice kind="error">{failure}</Notice>}
            {changes.length > 0 && (
                <Notice kind="warn">
                <strong>Your order was not placed. Please review:</strong>
                <ul>{changes.map((c, i) => <li key={i}>{describe(c)}</li>)}</ul>
                <label className="flex items-center gap-2 py-1">
                    <input className={checkInput} type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} /> I have reviewed these changes
                </label>
                {changes.some((c) => c.type !== 'PRICE_CHANGED') && <p className="text-sm"><Link to="/cart">Go to your cart to fix these items</Link></p>}
                </Notice>
            )}

            <fieldset className={fieldset}>
                <legend className={legend}>Your details</legend>
                <Field label="Full name" error={errors.customerName}>
                <input className={input} value={form.customerName} onChange={set('customerName')} autoComplete="name" aria-invalid={!!errors.customerName} />
                </Field>
                <Field label="Email" error={errors.email}>
                <input className={input} type="email" value={form.email} onChange={set('email')} autoComplete="email" aria-invalid={!!errors.email} />
                </Field>
                <Field label="Contact number" error={errors.phone} hint="e.g. 0917 555 0123 or +63 917 555 0123">
                <input className={input} type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" aria-invalid={!!errors.phone} />
                </Field>
                <Field label="Delivery address" error={errors.address}>
                <textarea className={input} rows={3} value={form.address} onChange={set('address')} autoComplete="street-address" aria-invalid={!!errors.address} />
                </Field>
            </fieldset>

            <fieldset className={fieldset}>
                <legend className={legend}>Payment method</legend>
                {METHODS.map((m) => (
                <label key={m} className="flex items-center gap-2 py-1">
                    <input className={checkInput} type="radio" name="pay" checked={form.paymentMethod === m} onChange={() => setForm((f) => ({ ...f, paymentMethod: m }))} /> {m}
                </label>
                ))}
                {errors.paymentMethod && <span className={fieldError} role="alert">{errors.paymentMethod}</span>}
                <p className="text-sm text-muted">Selection only. No payment is collected in this demo.</p>
            </fieldset>

            <Field label="Order notes (optional)">
                <textarea className={input} rows={2} value={form.notes} onChange={set('notes')} />
            </Field>

            <button className={btn('primary', 'lg')} type="submit" disabled={saving || hasIssues || mustReview}>
                {saving ? 'Placing order…' : 'Place order'}
            </button>
            {hasIssues && <p className={fieldError}>Some items are unavailable. <Link to="/cart">Review your cart</Link>.</p>}
            </form>

            <aside className="order-first flex flex-col gap-2.5 rounded-xl border-2 border-ink bg-white p-4 shadow-cobalt-lg lg:sticky lg:top-24 lg:order-none" aria-label="Order summary">
            <h2 className="text-2xl font-bold">Order summary</h2>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {lines.map((l) => (
                <li key={l.productId} className="flex justify-between gap-4">
                    <div><strong>{l.name}</strong><div className="text-sm text-muted">{l.qty} × {formatPHP(l.unitPriceCents)}</div></div>
                    <div>{l.issue ? '—' : formatPHP(l.lineTotalCents)}</div>
                </li>
                ))}
            </ul>
            <div className="flex justify-between gap-4 border-t-2 border-dashed border-ink pt-2.5 font-display text-xl font-extrabold"><span>Total</span><span>{formatPHP(totalCents)}</span></div>
            <p className="text-sm text-muted">Prices and stock are re-checked when you place the order.</p>
            </aside>
        </div>
        </>
    )
}