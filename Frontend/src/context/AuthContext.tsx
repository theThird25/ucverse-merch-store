import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { adminToken, api, setUnauthorizedHandler } from '../api/client'

interface AuthCtx {
    token: string | null
    login: (email: string, password: string) => Promise<void>
    logout: () => Promise<void>
}
const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(adminToken.get())

    const login = useCallback(async (email: string, password: string) => {
        const r = await api.login(email, password)
        adminToken.set(r.token)
        setToken(r.token)
    }, [])

    const logout = useCallback(async () => {
        try { await api.logout() } catch { /* token may already be invalid */ }
        adminToken.clear()
        setToken(null)
    }, [])

    // Any 401 from an admin call (expired/revoked token) drops the session.
    useEffect(() => {
        setUnauthorizedHandler(() => { adminToken.clear(); setToken(null) })
    }, [])

    const value = useMemo(() => ({ token, login, logout }), [token, login, logout])
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const c = useContext(Ctx)
    if (!c) throw new Error('useAuth must be used inside AuthProvider')
    return c
}