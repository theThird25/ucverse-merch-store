import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, ApiError, errorMessage } from '../../api/client'
import type { ProductInput } from '../../api/types'
import { ErrorState, Field, Loading, Notice, ProductImage } from '../../components/Bits'
import { useAsync } from '../../lib/hooks'
import { centsToInput, parsePesosToCents } from '../../lib/money'
import { btn, cx, input, panel } from '../../lib/ui'

const BLANK: ProductInput = { name: '', categoryId: '', description: '', price: '', stock: 0, isActive: true, imageUrl: '' }
type Errs = Partial<Record<keyof ProductInput, string>>

export default function ProductForm() {
    const { id } = useParams()
    const editing = !!id
    const nav = useNavigate()

    const cats = useAsync(() => api.adminCategories(), [])
    const existing = useAsync(() => (editing ? api.adminProduct(id!) : Promise.resolve(null)), [id])

    const [f, setF] = useState<ProductInput>(BLANK)
    const [stockText, setStockText] = useState('0')
    const [errs, setErrs] = useState<Errs>({})
    const [banner, setBanner] = useState('')
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        const p = existing.data
        if (p) {
        setF({ name: p.name, categoryId: p.categoryId, description: p.description, price: centsToInput(p.priceCents), stock: p.stock, isActive: p.isActive, imageUrl: p.imageUrl })
        setStockText(String(p.stock))
        }
    }, [existing.data])

    if (cats.loading || existing.loading) return <Loading />
    if (cats.error || existing.error) {
        return <ErrorState message={(cats.error || existing.error)!} onRetry={() => { cats.reload(); existing.reload() }} />
    }

    const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) => setF((x) => ({ ...x, [k]: v }))

    const validate = (): Errs => {
        const e: Errs = {}
        if (!f.name.trim()) e.name = 'Name is required.'
        if (!f.categoryId) e.categoryId = 'Choose a category.'
        const cents = parsePesosToCents(f.price)
        if (cents === null) e.price = 'Enter a valid price with up to 2 decimals.'
        else if (cents <= 0) e.price = 'Price must be greater than zero.'
        if (!/^\d+$/.test(stockText.trim())) e.stock = 'Stock must be a whole number, 0 or more.'
        return e
    }

    const submit = async (ev: FormEvent) => {
        ev.preventDefault()
        setBanner('')
        const e = validate()
        setErrs(e)
        if (Object.keys(e).length) return

        setBusy(true)
        try {
        const payload: ProductInput = { ...f, price: centsToInput(parsePesosToCents(f.price)!), stock: Number(stockText) }
        if (editing) await api.updateProduct(id!, payload)
        else await api.createProduct(payload)
        nav('/admin/products')
        } catch (x) {
        if (x instanceof ApiError && x.fieldErrors) {
            const next: Errs = {}
            for (const [k, v] of Object.entries(x.fieldErrors)) next[k as keyof ProductInput] = v[0]
            setErrs(next)
        }
        setBanner(errorMessage(x))
        } finally {
        setBusy(false)
        }
    }

    return (
        <>
        <p className="mb-3 text-sm"><Link to="/admin/products">← Products</Link></p>
        <h1 className="mb-3 text-3xl font-extrabold md:text-4xl">{editing ? 'Edit product' : 'Add product'}</h1>

        <form className={cx(panel, 'flex max-w-2xl flex-col gap-4')} onSubmit={submit} noValidate>
            {banner && <Notice kind="error">{banner}</Notice>}
            <Field label="Name" error={errs.name}>
            <input className={input} value={f.name} onChange={(e) => set('name', e.target.value)} aria-invalid={!!errs.name} />
            </Field>
            <Field label="Category" error={errs.categoryId}>
            <select className={input} value={f.categoryId} onChange={(e) => set('categoryId', e.target.value)} aria-invalid={!!errs.categoryId}>
                <option value="">Select…</option>
                {(cats.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            </Field>
            <Field label="Description">
            <textarea className={input} rows={4} value={f.description} onChange={(e) => set('description', e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Price (PHP)" error={errs.price}>
                <input className={input} inputMode="decimal" value={f.price} onChange={(e) => set('price', e.target.value)} placeholder="120.00" aria-invalid={!!errs.price} />
            </Field>
            <Field label="Stock quantity" error={errs.stock}>
                <input className={input} inputMode="numeric" value={stockText} onChange={(e) => setStockText(e.target.value)} aria-invalid={!!errs.stock} />
            </Field>
            </div>
            <Field label="Image URL or bundled path" hint="e.g. /images/classic-tee.svg or https://…">
            <input className={input} value={f.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} />
            </Field>
            {f.imageUrl && <div className="h-22.5 w-30 overflow-hidden rounded-lg border-2 border-ink bg-lemon-soft"><ProductImage src={f.imageUrl} alt="Preview" /></div>}
            <Field label="Status">
            <select className={input} value={f.isActive ? 'active' : 'inactive'} onChange={(e) => set('isActive', e.target.value === 'active')}>
                <option value="active">Active (visible to customers)</option>
                <option value="inactive">Inactive (hidden)</option>
            </select>
            </Field>
            <div className="flex flex-wrap items-center gap-2.5">
            <button className={btn('primary')} disabled={busy}>{busy ? 'Saving…' : 'Save product'}</button>
            <Link className={btn()} to="/admin/products">Cancel</Link>
            </div>
        </form>
        </>
    )
}