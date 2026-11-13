import { useState } from 'react'
import { api, errorMessage } from '../../api/client'
import { Empty, ErrorState, Loading, Notice } from '../../components/Bits'
import { useAsync } from '../../lib/hooks'
import { actionCell, btn, fieldLabel, filterBar, input, stackCell, table, tableWrap, tbody, th, thead, tr } from '../../lib/ui'

export default function Categories() {
    const res = useAsync(() => api.adminCategories(), [])
    const [name, setName] = useState('')
    const [editId, setEditId] = useState<string | null>(null)
    const [editName, setEditName] = useState('')
    const [msg, setMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

    /** Runs an API call, shows success or the server's explanation, then refreshes the list. */
    const run = async (fn: () => Promise<unknown>, ok: string): Promise<boolean> => {
        try {
        await fn()
        setMsg({ kind: 'success', text: ok })
        res.reload()
        return true
        } catch (e) {
        setMsg({ kind: 'error', text: errorMessage(e) })
        return false
        }
    }

    const add = async (e: FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return setMsg({ kind: 'error', text: 'Category name is required.' })
        if (await run(() => api.createCategory(name), `Added “${name.trim()}”.`)) setName('')
    }

    return (
        <>
        <h1 className="my-3 text-3xl font-extrabold md:text-4xl">Categories</h1>
        {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

        <form className={filterBar} onSubmit={add}>
            <label className="flex min-w-55 flex-[1_1_220px] flex-col gap-1">
            <span className={fieldLabel}>New category</span>
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <button className={btn('primary')}>Add</button>
        </form>

        {res.loading && !res.data ? <Loading /> : res.error && !res.data ? <ErrorState message={res.error} onRetry={res.reload} /> :
            res.data!.length === 0 ? <Empty title="No categories yet" /> : (
            <div className={tableWrap}>
                <table className={table}>
                <thead className={thead}><tr><th className={th}>Name</th><th className={th}>Products</th><th className={th}>Actions</th></tr></thead>
                <tbody className={tbody}>
                    {res.data!.map((c) => (
                    <tr key={c.id} className={tr}>
                        <td className={stackCell} data-label="Name">
                        {editId === c.id
                            ? <input className={input} aria-label="Category name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                            : c.name}
                        </td>
                        <td className={stackCell} data-label="Products">{c.productCount}</td>
                        <td className={actionCell}>
                        <div className="flex flex-wrap gap-1.5">
                            {editId === c.id ? (
                            <>
                                <button className={btn('primary', 'sm')} onClick={async () => { if (await run(() => api.updateCategory(c.id, editName), 'Category updated.')) setEditId(null) }}>Save</button>
                                <button className={btn('default', 'sm')} onClick={() => setEditId(null)}>Cancel</button>
                            </>
                            ) : (
                            <>
                                <button className={btn('default', 'sm')} onClick={() => { setEditId(c.id); setEditName(c.name) }}>Rename</button>
                                <button className={btn('dangerGhost', 'sm')} onClick={() => {
                                if (window.confirm(`Delete category “${c.name}”?`)) run(() => api.deleteCategory(c.id), 'Category deleted.')
                                }}>Delete</button>
                            </>
                            )}
                        </div>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            )}
        </>
    )
}