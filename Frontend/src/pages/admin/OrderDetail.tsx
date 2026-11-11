import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, errorMessage } from '../../api/client'
import type { Order, OrderStatus } from '../../api/types'
import { ErrorState, Loading, Notice, StatusPill } from '../../components/Bits'
import { formatDateTime, useAsync } from '../../lib/hooks'
import { formatPHP } from '../../lib/money'
import { btn, cell, cx, panel, tableWrap, th } from '../../lib/ui'

const dt = 'font-semibold text-muted'

export default function OrderDetail() {
    const { orderNumber = '' } = useParams()
    const res = useAsync(() => api.order(orderNumber), [orderNumber])
    const [order, setOrder] = useState<Order | null>(null)
    const [msg, setMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
    const [busy, setBusy] = useState(false)

    useEffect(() => { if (res.data) setOrder(res.data) }, [res.data])

    if (res.loading && !order) return <Loading />
    if (res.error && !order) return <ErrorState message={res.error} onRetry={res.reload} />
    if (!order) return null

    const change = async (to: OrderStatus) => {
        if (to === 'Cancelled' && !window.confirm('Cancel this order? Stock will be returned to inventory.')) return
        setBusy(true)
        setMsg(null)
        try {
        const updated = await api.setOrderStatus(order.orderNumber, to)
        setOrder(updated)
        setMsg({ kind: 'success', text: `Status updated to ${to}.${to === 'Cancelled' ? ' Stock was restored.' : ''}` })
        } catch (e) {
        setMsg({ kind: 'error', text: errorMessage(e) })
        res.reload() // pick up the status that is really saved
        } finally {
        setBusy(false)
        }
    }

    return (
        <>
        <p className="mb-3 text-sm"><Link to="/admin/orders">← Orders</Link></p>
        <div className="my-3 flex flex-wrap items-center justify-between gap-2.5">
            <h1 className="text-3xl font-extrabold md:text-4xl">{order.orderNumber}</h1>
            <StatusPill status={order.status} />
        </div>
        {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

        <section className={cx(panel, 'my-4')}>
            <h2 className="mb-2 text-2xl font-bold">Update status</h2>
            {order.allowedNext.length === 0 ? (
            <p className="text-muted">This order is {order.status} and can no longer change.</p>
            ) : (
            <div className="flex flex-wrap items-center gap-2.5">
                {order.allowedNext.map((s) => (
                <button key={s} className={btn(s === 'Cancelled' ? 'dangerGhost' : 'primary')} disabled={busy} onClick={() => change(s)}>
                    {s === 'Cancelled' ? 'Cancel order' : `Mark as ${s}`}
                </button>
                ))}
            </div>
            )}
        </section>

        <div className="my-4 grid gap-4 md:grid-cols-2">
            <section className={panel}>
            <h2 className="mb-2 text-2xl font-bold">Customer</h2>
            <dl className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-1.5">
                <dt className={dt}>Name</dt><dd className="wrap-anywhere">{order.customerName}</dd>
                <dt className={dt}>Email</dt><dd className="wrap-anywhere">{order.email}</dd>
                <dt className={dt}>Contact</dt><dd>{order.phone}</dd>
                <dt className={dt}>Address</dt><dd className="wrap-anywhere">{order.address}</dd>
                <dt className={dt}>Payment</dt><dd>{order.paymentMethod}</dd>
                <dt className={dt}>Placed</dt><dd>{formatDateTime(order.createdAt)}</dd>
                <dt className={dt}>Notes</dt><dd className="wrap-anywhere">{order.notes || <span className="text-muted">None</span>}</dd>
            </dl>
            </section>
            <section className={panel}>
            <h2 className="mb-2 text-2xl font-bold">Items</h2>
            <div className={tableWrap}>
                <table className="w-full border-collapse">
                <thead><tr><th className={th}>Product</th><th className={th}>Qty</th><th className={th}>Unit</th><th className={th}>Line total</th></tr></thead>
                <tbody>
                    {order.items.map((i) => (
                    <tr key={i.productId}><td className={cell}>{i.name}</td><td className={cell}>{i.qty}</td><td className={cell}>{formatPHP(i.unitPriceCents)}</td><td className={cell}>{formatPHP(i.lineTotalCents)}</td></tr>
                    ))}
                </tbody>
                </table>
            </div>
            <div className="mt-3 flex justify-between gap-4"><span>Subtotal</span><span>{formatPHP(order.subtotalCents)}</span></div>
            <div className="mt-2.5 flex justify-between gap-4 border-t-2 border-dashed border-ink pt-2.5 font-display text-xl font-extrabold"><span>Total</span><span>{formatPHP(order.totalCents)}</span></div>
            </section>
        </div>
        </>
    )
}