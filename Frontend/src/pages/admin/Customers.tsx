import { api } from '../../api/client'
import { Empty, ErrorState, Loading } from '../../components/Bits'
import { useAsync } from '../../lib/hooks'
import { formatPHP } from '../../lib/money'
import { stackCell, table, tableWrap, tbody, th, thead, tr } from '../../lib/ui'

export default function Customers() {
    const res = useAsync(() => api.customers(), [])

    return (
        <>
        <h1 className="my-3 text-3xl font-extrabold md:text-4xl">Customers</h1>
        <p className="mb-3 text-muted">Derived from orders (guest checkout). Repeat emails are merged, and the latest submitted name and contact are shown.</p>
        {res.loading && !res.data ? <Loading /> : res.error && !res.data ? <ErrorState message={res.error} onRetry={res.reload} /> :
            res.data!.length === 0 ? <Empty title="No customers yet" /> : (
            <div className={tableWrap}>
                <table className={table}>
                <thead className={thead}><tr><th className={th}>Name</th><th className={th}>Email</th><th className={th}>Contact</th><th className={th}>Orders</th><th className={th}>Completed total</th></tr></thead>
                <tbody className={tbody}>
                    {res.data!.map((c) => (
                    <tr key={c.email} className={tr}>
                        <td className={stackCell} data-label="Name">{c.name}</td>
                        <td className={stackCell} data-label="Email">{c.email}</td>
                        <td className={stackCell} data-label="Contact">{c.phone}</td>
                        <td className={stackCell} data-label="Orders">{c.orderCount}</td>
                        <td className={stackCell} data-label="Completed total">{formatPHP(c.completedTotalCents)}</td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            )}
        </>
    )
}