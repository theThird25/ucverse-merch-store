import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { ErrorState, Loading } from '../../components/Bits'
import { useAsync } from '../../lib/hooks'
import { formatPHP } from '../../lib/money'
import { btn, cx, statShadows } from '../../lib/ui'

export default function Dashboard() {
    const res = useAsync(() => api.dashboard(), [])
    if (res.loading && !res.data) return <Loading />
    if (res.error && !res.data) return <ErrorState message={res.error} onRetry={res.reload} />
    const d = res.data!

    const cards: [string, string, string?][] = [
        ['Total Products', String(d.totalProducts), 'Includes inactive products'],
        ['Total Orders', String(d.totalOrders), 'Includes cancelled orders'],
        ['Pending Orders', String(d.pendingOrders)],
        ['Completed Orders', String(d.completedOrders)],
        ['Total Customers', String(d.totalCustomers), 'Unique checkout emails'],
        ['Total Sales', formatPHP(d.totalSalesCents), 'Completed orders only'],
    ]

    return (
        <>
        <div className="my-3 flex flex-wrap items-center justify-between gap-2.5">
            <h1 className="text-3xl font-extrabold md:text-4xl">Overview</h1>
            <button className={btn()} onClick={res.reload}>Refresh</button>
        </div>
        <div className="my-4 grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
            {cards.map(([label, value, note], i) => (
            <div key={label} className={cx('rounded-xl border-2 border-ink bg-white p-4', statShadows[i % 3])}>
                <div className="wrap-anywhere font-display text-3xl font-extrabold text-cobalt">{value}</div>
                <div className="font-bold">{label}</div>
                {note && <div className="text-sm text-muted">{note}</div>}
            </div>
            ))}
        </div>
        <div className="my-3 flex flex-wrap items-center gap-2.5">
            <Link className={btn()} to="/admin/orders">Manage orders</Link>
            <Link className={btn()} to="/admin/products">Manage products</Link>
        </div>
        </>
    )
}