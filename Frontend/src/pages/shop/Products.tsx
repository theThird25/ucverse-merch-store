import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../api/client'
import { Empty, ErrorState, Loading } from '../../components/Bits'
import { ProductCard } from '../../components/ProductCard'
import { useAsync, useDebounced } from '../../lib/hooks'
import { btn, fieldLabel, filterBar, input } from '../../lib/ui'

export default function Products() {
    const [params, setParams] = useSearchParams()
    const category = params.get('category') ?? ''
    const sort = params.get('sort') ?? ''
    const urlQ = params.get('q') ?? ''

    const [text, setText] = useState(urlQ)
    const debounced = useDebounced(text, 300)

    // Push the typed search into the URL after a short pause.
    useEffect(() => {
        if (debounced === urlQ) return
        const next = new URLSearchParams(params)
        if (debounced.trim()) next.set('q', debounced)
        else next.delete('q')
        setParams(next, { replace: true })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debounced])

    const cats = useAsync(() => api.categories(), [])
    const list = useAsync(() => api.products({ q: urlQ, category, sort }), [urlQ, category, sort])

    const setParam = (k: string, v: string) => {
        const next = new URLSearchParams(params)
        if (v) next.set(k, v)
        else next.delete(k)
        setParams(next)
    }
    const clearAll = () => { setText(''); setParams(new URLSearchParams()) }

    return (
        <>
        <h1 className="mb-3 text-3xl font-extrabold md:text-4xl">Shop</h1>
        <form className={filterBar} role="search" onSubmit={(e) => e.preventDefault()}>
            <label className="flex min-w-55 flex-[1_1_220px] flex-col gap-1">
            <span className={fieldLabel}>Search products</span>
            <input className={input} type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. hoodie" />
            </label>
            <label className="flex min-w-38 flex-col gap-1">
            <span className={fieldLabel}>Category</span>
            <select className={input} value={category} onChange={(e) => setParam('category', e.target.value)}>
                <option value="">All categories</option>
                {(cats.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            </label>
            <label className="flex min-w-38 flex-col gap-1">
            <span className={fieldLabel}>Sort by price</span>
            <select className={input} value={sort} onChange={(e) => setParam('sort', e.target.value)}>
                <option value="">Default (name)</option>
                <option value="price_asc">Low to high</option>
                <option value="price_desc">High to low</option>
            </select>
            </label>
        </form>

        {list.loading && !list.data ? <Loading /> : list.error ? <ErrorState message={list.error} onRetry={list.reload} /> :
            list.data!.length === 0 ? (
            <Empty title="No products match your search">
                <p className="mb-3 text-muted">Try a different keyword or category.</p>
                <button className={btn()} onClick={clearAll}>Clear filters</button>
            </Empty>
            ) : (
            <>
                <p className="mb-2 text-sm text-muted" aria-live="polite">{list.data!.length} product{list.data!.length === 1 ? '' : 's'}</p>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-5">
                {list.data!.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
            </>
            )}
        </>
    )
}