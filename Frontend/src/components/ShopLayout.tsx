import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { container, cx } from '../lib/ui'

const navLink = 'border-b-[3px] py-1.5 font-semibold text-white no-underline hover:text-lemon focus-visible:outline-lemon'

export function ShopLayout() {
    const { count } = useCart()
    const [open, setOpen] = useState(false)
    const loc = useLocation()

    useEffect(() => {
        setOpen(false)
        if (loc.hash) document.getElementById(loc.hash.slice(1))?.scrollIntoView()
        else window.scrollTo(0, 0)
    }, [loc.pathname, loc.hash])

    const link = ({ isActive }: { isActive: boolean }) => cx(navLink, isActive ? 'border-lemon' : 'border-transparent')

    return (
        <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 border-b-4 border-hotpink bg-cobalt text-white">
            <div className={cx(container, 'flex min-h-[62px] flex-wrap items-center justify-between gap-4')}>
            <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-white no-underline hover:text-lemon focus-visible:outline-lemon" aria-label="UCverse Merch Store home">
                <img src="/images/hero.svg" alt="" width="36" height="36" />
                <span>UCverse Merch</span>
            </Link>
            <button
                className="min-h-11 cursor-pointer rounded-[10px] border-2 border-lemon bg-transparent px-3.5 font-bold text-lemon focus-visible:outline-lemon md:hidden"
                aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen((o) => !o)}
            >
                {open ? 'Close' : 'Menu'}
            </button>
            <nav
                id="main-nav" aria-label="Main"
                className={cx('w-full flex-col items-start gap-1 pb-3 md:flex md:w-auto md:flex-row md:items-center md:gap-5 md:pb-0', open ? 'flex' : 'hidden')}
            >
                <NavLink to="/" end className={link}>Home</NavLink>
                <NavLink to="/products" className={link}>Shop</NavLink>
                <Link to="/#categories" className={cx(navLink, 'border-transparent')}>Categories</Link>
                <a href="#contact" className={cx(navLink, 'border-transparent')}>Contact</a>
                <NavLink to="/cart" className={link}>
                Cart{' '}
                <span className="inline-block min-w-6 rounded-full border-2 border-ink bg-hotpink px-1.5 text-center text-[0.8rem] font-bold text-ink" aria-label={`${count} items`}>{count}</span>
                </NavLink>
            </nav>
            </div>
        </header>

        <main className={cx(container, 'flex-1 pb-12 pt-6')}><Outlet /></main>

        <footer id="contact" className="mt-10 border-t-[6px] border-lemon bg-ink pb-4 pt-8 text-white">
            <div className={cx(container, 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3')}>
            <div>
                <h4 className="mb-2 text-lg font-bold text-lemon">UCverse Merch Store</h4>
                <p>Campus merch for students.</p>
                <p className="mt-2 text-sm">UCverse is an unofficial, fictional demo store built for a coding assessment. It is not affiliated with or endorsed by the University of Cebu. No payments are taken.</p>
            </div>
            <div>
                <h4 className="mb-2 text-lg font-bold text-lemon">Contact (sample details)</h4>
                <p>UCverse Merch Booth, Sample Building, Cebu City (fictional)</p>
                <p>hello@ucverse.example</p>
                <p>+63 32 555 0100</p>
            </div>
            <div>
                <h4 className="mb-2 text-lg font-bold text-lemon">Follow us (demo links)</h4>
                {['Facebook', 'Instagram', 'TikTok'].map((n) => (
                <p key={n}><a className="text-lemon hover:text-hotpink focus-visible:outline-lemon" href={`https://${n.toLowerCase()}.com`} target="_blank" rel="noreferrer noopener">{n}</a></p>
                ))}
            </div>
            </div>
            <div className={cx(container, 'mt-6 flex flex-wrap justify-between gap-2 text-sm')}>
            <span>© UCverse Merch Store (fictional, unofficial)</span>
            <Link to="/admin/login" className="text-lemon hover:text-hotpink focus-visible:outline-lemon">Admin demo</Link>
            </div>
        </footer>
        </div>
    )
}