import { useState } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { container, cx, navLink } from '../lib/ui'

/** Without a (demo) session, any /admin route redirects to login. The API enforces this too. */
export function RequireAdmin() {
    const { token } = useAuth()
    const loc = useLocation()
    if (!token) return <Navigate to="/admin/login" replace state={{ from: loc.pathname }} />
    return <AdminShell />
}

const links: [string, string][] = [
    ['/admin', 'Dashboard'],
    ['/admin/products', 'Products'],
    ['/admin/categories', 'Categories'],
    ['/admin/orders', 'Orders'],
    ['/admin/customers', 'Customers'],
]

function AdminShell() {
    const { logout } = useAuth()
    const nav = useNavigate()
    const [open, setOpen] = useState(false)

    return (
        <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 border-b-4 border-hotpink bg-cobalt text-white">
            <div className={cx(container, 'flex min-h-[62px] flex-wrap items-center justify-between gap-4')}>
            <strong className="font-display text-lg">
                UCverse Admin <span className="ml-1.5 rounded-md bg-lemon px-1.5 py-0.5 align-middle text-[0.7rem] font-bold text-ink">Demo</span>
            </strong>
            <button
                className="min-h-11 cursor-pointer rounded-[10px] border-2 border-lemon bg-transparent px-3.5 font-bold text-lemon focus-visible:outline-lemon md:hidden"
                aria-expanded={open} onClick={() => setOpen((o) => !o)}
            >
                {open ? 'Close' : 'Menu'}
            </button>
            <nav
                aria-label="Admin" onClick={() => setOpen(false)}
                className={cx('w-full flex-col items-start gap-1 pb-3 md:flex md:w-auto md:flex-row md:items-center md:gap-5 md:pb-0', open ? 'flex' : 'hidden')}
            >
                {links.map(([to, label]) => (
                <NavLink key={to} to={to} end={to === '/admin'} className={({ isActive }) => cx(navLink, isActive ? 'border-lemon' : 'border-transparent')}>
                    {label}
                </NavLink>
                ))}
                <Link to="/" target="_blank" className={cx(navLink, 'border-transparent')}>View store</Link>
                <button className={cx(navLink, 'cursor-pointer border-transparent bg-transparent')} onClick={async () => { await logout(); nav('/admin/login') }}>
                Log out
                </button>
            </nav>
            </div>
        </header>
        <main className={cx(container, 'flex-1 pb-12 pt-6')}><Outlet /></main>
        </div>
    )
}