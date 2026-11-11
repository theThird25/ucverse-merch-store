import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError, errorMessage } from '../../api/client'
import type { Product } from '../../api/types'
import { Empty, ErrorState, Loading, Notice, ProductImage } from '../../components/Bits'
import { Modal } from '../../components/Modal'
import { useAsync, useDebounced } from '../../lib/hooks'
import { centsToInput, formatPHP } from '../../lib/money'
import {
    actionCell, badgeBase, badgeTone, btn, cx, fieldLabel, filterBar, input, stackCell, table, tableWrap, tbody, th, thead, tr,
} from '../../lib/ui'

function availability(p: Product) {
    if (!p.isActive) return <span className={cx(badgeBase, badgeTone.off)}>Inactive</span>
    // Derived: an active product with zero stock shows as Out of Stock.
    return p.inStock
        ? <span className={cx(badgeBase, badgeTone.ok)}>Active</span>
        : <span className={cx(badgeBase, badgeTone.out)}>Out of Stock</span>
}

export default function Products() {
    const [q, setQ] = useState('')
    const [category, setCategory] = useState('')
    const [status, setStatus] = useState('')
    const dq = useDebounced(q)

    const cats = useAsync(() => api.adminCategories(), [])
    const res = useAsync(() => api.adminProducts({ q: dq, category, status }), [dq, category, status])

    const [toDelete, setToDelete] = useState<Product | null>(null)
    const [blocked, setBlocked] = useState<Product | null>(null)
    const [msg, setMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
    const [busy, setBusy] = useState(false)

    const doDelete = async () => {
        if (!toDelete) return
        setBusy(true)
        try {
        await api.deleteProduct(toDelete.id)
        setMsg({ kind: 'success', text: `Deleted “${toDelete.name}”.` })
        res.reload()
        } catch (e) {
        if (e instanceof ApiError && e.code === 'PRODUCT_REFERENCED') setBlocked(toDelete)
        else setMsg({ kind: 'error', text: errorMessage(e) })
        } finally {
        setBusy(false)
        setToDelete(null)
        }
    }

    const deactivate = async () => {
        if (!blocked) return
        setBusy(true)
        try {
        await api.updateProduct(blocked.id, {
            name: blocked.name, categoryId: blocked.categoryId, description: blocked.description,
            price: centsToInput(blocked.priceCents), stock: blocked.stock, isActive: false, imageUrl: blocked.imageUrl,
        })
        setMsg({ kind: 'success', text: `“${blocked.name}” is now inactive and hidden from customers.` })
        res.reload()
        } catch (e) {
        setMsg({ kind: 'error', text: errorMessage(e) })
        } finally {
        setBusy(false)
        setBlocked(null)
        }
    }

    return (
        <>
        <div className="my-3 flex flex-wrap items-center justify-between gap-2.5">
            <h1 className="text-3xl font-extrabold md:text-4xl">Products</h1>
            <Link className={btn('primary')} to="/admin/products/new">Add product</Link>
        </div>
        {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

        <div className={filterBar}>
            <label className="flex min-w-55 flex-[1_1_220px] flex-col gap-1">
            <span className={fieldLabel}>Search</span>
            <input className={input} type="search" value={q} onChange={(e) => setQ(e.target.value)} />
            </label>
            <label className="flex min-w-38 flex-col gap-1">
            <span className={fieldLabel}>Category</span>
            <select className={input} value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All</option>
                {(cats.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            </label>
            <label className="flex min-w-38 flex-col gap-1">
            <span className={fieldLabel}>Status</span>
            <select className={input} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="out_of_stock">Out of stock</option>
            </select>
            </label>
        </div>

        {res.loading && !res.data ? <Loading /> : res.error && !res.data ? <ErrorState message={res.error} onRetry={res.reload} /> :
            res.data!.length === 0 ? <Empty title="No products found"><p className="text-muted">Adjust your filters or add a product.</p></Empty> : (
            <div className={tableWrap}>
                <table className={table}>
                <thead className={thead}><tr><th className={th}>Product</th><th className={th}>Category</th><th className={th}>Price</th><th className={th}>Stock</th><th className={th}>Status</th><th className={th}>Actions</th></tr></thead>
                <tbody className={tbody}>
                    {res.data!.map((p) => (
                    <tr key={p.id} className={tr}>
                        <td className={stackCell} data-label="Product">
                        <div className="flex items-center gap-2.5">
                            <div className="size-11 shrink-0 overflow-hidden rounded-lg border-2 border-ink bg-lemon-soft"><ProductImage src={p.imageUrl} alt="" /></div>
                            <strong>{p.name}</strong>
                        </div>
                        </td>
                        <td className={stackCell} data-label="Category">{p.categoryName}</td>
                        <td className={stackCell} data-label="Price">{formatPHP(p.priceCents)}</td>
                        <td className={stackCell} data-label="Stock">{p.stock}</td>
                        <td className={stackCell} data-label="Status">{availability(p)}</td>
                        <td className={actionCell}>
                        <div className="flex flex-wrap gap-1.5">
                            <Link className={btn('default', 'sm')} to={`/admin/products/${p.id}`}>Edit</Link>
                            <button className={btn('dangerGhost', 'sm')} onClick={() => setToDelete(p)}>Delete</button>
                        </div>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            )}

        {toDelete && (
            <Modal title="Delete product?" onClose={() => setToDelete(null)}>
            <p>“{toDelete.name}” will be permanently deleted. This cannot be undone.</p>
            <div className="my-3 flex flex-wrap items-center gap-2.5">
                <button className={btn()} onClick={() => setToDelete(null)}>Cancel</button>
                <button className={btn('danger')} disabled={busy} onClick={doDelete}>{busy ? 'Deleting…' : 'Delete'}</button>
            </div>
            </Modal>
        )}

        {blocked && (
            <Modal title="Cannot delete this product" onClose={() => setBlocked(null)}>
            <p>“{blocked.name}” appears on existing orders, so deleting it would break order history. You can mark it Inactive instead. It will be hidden from customers.</p>
            <div className="my-3 flex flex-wrap items-center gap-2.5">
                <button className={btn()} onClick={() => setBlocked(null)}>Keep as is</button>
                <button className={btn('primary')} disabled={busy} onClick={deactivate}>Mark as inactive</button>
            </div>
            </Modal>
        )}
        </>
    )
}