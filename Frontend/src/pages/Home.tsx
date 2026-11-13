import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { AsyncList } from '../components/Bits'
import { ProductCard } from '../components/ProductCard'
import { useAsync } from '../lib/hooks'
import { btn } from '../lib/ui'

const productGrid = 'grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-5'

export default function Home() {
    const cats = useAsync(() => api.categories(), [])
    const products = useAsync(() => api.products({}), [])

    return (
        <>
        <section className="mb-6 mr-2 mt-2 grid items-center gap-8 rounded-[20px] border-2 border-ink bg-lemon p-5 shadow-cobalt-xl md:grid-cols-[1.2fr_0.8fr] md:p-8">
            <div>
            <span className="mb-3 inline-block -rotate-3 rounded-lg border-2 border-ink bg-hotpink px-3 py-1 text-sm font-extrabold text-ink shadow-hard">
                Unofficial · Fictional demo
            </span>
            <h1 className="max-w-[14ch] text-4xl font-extrabold text-cobalt md:text-6xl">Campus merch made for UC students.</h1>
            <p className="mt-3 max-w-[44ch] text-lg">Tees, hoodies, tumblers and school essentials with the UCverse mark. A fictional student project.</p>
            <div className="my-3 flex flex-wrap items-center gap-2.5">
                <Link className={btn('primary', 'lg')} to="/products">Shop all merch</Link>
            </div>
            </div>
            <img className="order-first w-full max-w-55 justify-self-center md:order-none md:max-w-90" src="/images/hero.svg" alt="UCverse merch illustration" />
        </section>

        <section className="my-4 rounded-xl border-2 border-ink bg-cobalt px-4 py-3.5 text-white" aria-label="Promotion">
            <strong className="text-lemon">Demo store:</strong> an unofficial, fictional student project, not affiliated with the University of Cebu. Every product, price, customer and contact detail is made up.
        </section>

        <section id="categories" aria-labelledby="cat-h">
            <h2 id="cat-h" className="mb-3 mt-8 text-2xl font-bold">Browse by category</h2>
            <AsyncList state={cats} empty={<p className="text-muted">No categories yet.</p>}>
            {(rows) => (
                <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                {rows.map((c) => (
                    <Link
                    key={c.id} to={`/products?category=${c.id}`}
                    className="flex flex-col gap-0.5 rounded-xl border-2 border-l-12 border-t-ink border-r-ink border-b-ink border-l-hotpink bg-white p-5 font-display text-xl font-bold text-ink no-underline shadow-ink hover:bg-lemon-soft hover:text-ink"
                    >
                    <span>{c.name}</span>
                    <span className="font-sans text-sm font-normal text-muted">Shop {c.name.toLowerCase()}</span>
                    </Link>
                ))}
                </div>
            )}
            </AsyncList>
        </section>

        <section aria-labelledby="feat-h">
            <h2 id="feat-h" className="mb-3 mt-8 text-2xl font-bold">Featured products</h2>
            <AsyncList state={products} empty={<p className="text-muted">No products yet.</p>}>
            {(rows) => (
                <div className={productGrid}>
                {rows.filter((p) => p.inStock).slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
            )}
            </AsyncList>
        </section>
        </>
    )
}