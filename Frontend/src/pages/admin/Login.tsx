import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { errorMessage } from '../../api/client'
import { Field, Notice } from '../../components/Bits'
import { useAuth } from '../../context/AuthContext'
import { btn, cx, input, panel } from '../../lib/ui'

export default function Login() {
    const { token, login } = useAuth()
    const nav = useNavigate()
    const from = (useLocation().state as { from?: string } | null)?.from ?? '/admin'
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [err, setErr] = useState('')
    const [busy, setBusy] = useState(false)

    if (token) return <Navigate to="/admin" replace />

    const submit = async (e: FormEvent) => {
        e.preventDefault()
        setErr('')
        setBusy(true)
        try {
        await login(email, password)
        nav(from, { replace: true })
        } catch (x) {
        setErr(errorMessage(x))
        } finally {
        setBusy(false)
        }
    }

    return (
        <div className="mx-auto my-12 w-full max-w-105 px-4">
        <form className={cx(panel, 'flex flex-col gap-4 shadow-hotpink')} onSubmit={submit}>
            <h1 className="text-3xl font-extrabold">Admin login</h1>
            <Notice kind="warn">Simulated demo login. Not suitable for production. Demo credentials are in the README.</Notice>
            {err && <Notice kind="error">{err}</Notice>}
            <Field label="Email">
            <input className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
            </Field>
            <Field label="Password">
            <input className={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
            </Field>
            <button className={btn('primary')} disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
            <p className="text-sm"><Link to="/">← Back to the store</Link></p>
        </form>
        </div>
    )
}