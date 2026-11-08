import { Link, useLocation } from 'react-router-dom'
import type { Order } from '../../api/types'
import { Empty, StatusPill } from '../../components/Bits'
import { formatDateTime } from '../../lib/hooks'
import { formatPHP } from '../../lib/money'
import { badgeBase, badgeTone, btn, cx, panel } from '../../lib/ui'

export default function Confirmation() {
    const loc = useLocation()
    let order = (loc.state as { order?: Order } | null)?.order
    if (!order) {
        try { order = JSON.parse(sessionStorage.getItem('ucv_last_order') ?? 'null') ?? undefined } catch { order = undefined }
    }
    if (!order) {
        return <Empty title="No recent order"><Link className={btn()} to="/products">Continue shopping</Link></Empty>
    }

    return (
        <div>
        <p className={cx(badgeBase, badgeTone.ok)}>Order saved</p>
        <h1 className="my-2 text-3xl font-extrabold md:text-4xl">Thank you, {order.customerName.split(' ')[0]}!</h1>
        <p>
            Your order number is{' '}
            <strong className="rounded-md border-2 border-ink bg-lemon px-2 font-display text-xl">{order.orderNumber}</strong>. Keep it for reference.
        </p>

        <div className="my-4 grid gap-4 md:grid-cols-2">
            <section className={cx(panel, 'my-0')}>
            <h2 className="mb-2 text-2xl font-bold">Details</h2>
            <dl className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-1.5">
                <dt className="font-semibold text-muted">Status</dt><dd><StatusPill status={order.status} /></dd>
                <dt className="font-semibold text-muted">Placed</dt><dd>{formatDateTime(order.createdAt)}</dd>
                <dt className="font-semibold text-muted">Name</dt><dd className="wrap-anywhere">{order.customerName}</dd>
                <dt className="font-semibold text-muted">Email</dt><dd className="wrap-anywhere">{order.email}</dd>
                <dt className="font-semibold text-muted">Contact</dt><dd>{order.phone}</dd>
                <dt className="font-semibold text-muted">Address</dt><dd className="wrap-anywhere">{order.address}</dd>
                <dt className="font-semibold text-muted">Payment</dt><dd>{order.paymentMethod}</dd>
                {order.notes && <><dt className="font-semibold text-muted">Notes</dt><dd className="wrap-anywhere">{order.notes}</dd></>}
            </dl>
            </section>
            <section className={cx(panel, 'my-0')}>
            <h2 className="mb-2 text-2xl font-bold">Items</h2>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {order.items.map((i) => (
                <li key={i.productId} className="flex justify-between gap-4">
                    <div><strong>{i.name}</strong><div className="text-sm text-muted">{i.qty} × {formatPHP(i.unitPriceCents)}</div></div>
                    <div>{formatPHP(i.lineTotalCents)}</div>
                </li>
                ))}
            </ul>
            <div className="mt-2.5 flex justify-between gap-4 border-t-2 border-dashed border-ink pt-2.5 font-display text-xl font-extrabold"><span>Total</span><span>{formatPHP(order.totalCents)}</span></div>
            </section>
        </div>
        <Link className={btn('primary')} to="/products">Continue shopping</Link>
        </div>
    )
}