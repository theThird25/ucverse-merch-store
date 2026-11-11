import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { Empty, ErrorState, Loading, StatusPill } from '../../components/Bits'
import { formatDateTime, useAsync } from '../../lib/hooks'
import { formatPHP } from '../../lib/money'
import { actionCell, btn, stackCell, table, tableWrap, tbody, th, thead, tr } from '../../lib/ui'

export default function Orders() {
    const res = useAsync(() => api.orders(), [])

    return (
        <>
        <div className="my-3 flex flex-wrap items-center justify-between gap-2.5">
            <h1 className="text-3xl font-extrabold md:text-4xl">Orders</h1>
            <button className={btn()} onClick={res.reload}>Refresh</button>
        </div>

        {res.loading && !res.data ? <Loading /> : res.error && !res.data ? <ErrorState message={res.error} onRetry={res.reload} /> :
            res.data!.length === 0 ? <Empty title="No orders yet"><p className="text-muted">Orders placed on the store will appear here.</p></Empty> : (
            <div className={tableWrap}>
                <table className={table}>
                <thead className={thead}><tr><th className={th}>Order</th><th className={th}>Customer</th><th className={th}>Date</th><th className={th}>Total</th><th className={th}>Payment</th><th className={th}>Status</th><th className={th}>Details</th></tr></thead>
                <tbody className={tbody}>
                    {res.data!.map((o) => (
                    <tr key={o.orderNumber} className={tr}>
                        <td className={stackCell} data-label="Order"><strong>{o.orderNumber}</strong></td>
                        <td className={stackCell} data-label="Customer">{o.customerName}</td>
                        <td className={stackCell} data-label="Date">{formatDateTime(o.createdAt)}</td>
                        <td className={stackCell} data-label="Total">{formatPHP(o.totalCents)}</td>
                        <td className={stackCell} data-label="Payment">{o.paymentMethod}</td>
                        <td className={stackCell} data-label="Status"><StatusPill status={o.status} /></td>
                        <td className={actionCell}><Link className={btn('default', 'sm')} to={`/admin/orders/${o.orderNumber}`}>View Details</Link></td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            )}
        </>
    )
}