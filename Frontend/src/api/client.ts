import type {
    CartChange, Category, CustomerRow, DashboardStats, Order, OrderStatus, Product, ProductInput, ResolvedCart,
} from './types'

const BASE = (import.meta.env.VITE_API_URL as string | undefined) || '/api'
const TOKEN_KEY = 'ucv_admin_token'

export const adminToken = {
    get: () => { try { return sessionStorage.getItem(TOKEN_KEY) } catch { return null } },
    set: (t: string) => { try { sessionStorage.setItem(TOKEN_KEY, t) } catch { /* ignore */ } },
    clear: () => { try { sessionStorage.removeItem(TOKEN_KEY) } catch { /* ignore */ } },
}

export class ApiError extends Error {
    status: number
    code?: string
    fieldErrors?: Record<string, string[]>
    changes?: CartChange[]

    constructor(status: number, message: string, code?: string, fieldErrors?: Record<string, string[]>, changes?: CartChange[]) {
        super(message)
        this.status = status
        this.code = code
        this.fieldErrors = fieldErrors
        this.changes = changes
    }
}

let onUnauthorized: () => void = () => {}
export const setUnauthorizedHandler = (fn: () => void) => { onUnauthorized = fn }

const RETRYABLE = new Set([502, 503, 504])
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const isSafeToRetry = (method: string, path: string) =>
    method === 'GET' || path === '/cart/validate' || path === '/admin/login'

async function fetchWithRetry(url: string, init: RequestInit, attempts: number): Promise<Response | null> {
    let res: Response | null = null
    for (let i = 0; i < attempts; i++) {
        res = await fetch(url, init).catch(() => null)
        if (res && !RETRYABLE.has(res.status)) break
        if (i < attempts - 1) await sleep(5000 * (i + 1))
    }
    return res
}

function buildHeaders(hasBody: boolean, admin: boolean): Record<string, string> {
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (hasBody) headers['Content-Type'] = 'application/json'
    const token = admin ? adminToken.get() : null
    if (token) headers.Authorization = `Bearer ${token}`
    return headers
}

async function request<T>(method: string, path: string, body?: unknown, admin = false): Promise<T> {
    const init: RequestInit = {
        method,
        headers: buildHeaders(body !== undefined, admin),
        body: body === undefined ? undefined : JSON.stringify(body),
    }
    const res = await fetchWithRetry(`${BASE}${path}`, init, isSafeToRetry(method, path) ? 5 : 1)
    if (!res) throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.', 'NETWORK')

    const json = await res.json().catch(() => null)
    if (!res.ok) {
        if (res.status === 401 && admin && path !== '/admin/login') onUnauthorized()
        throw new ApiError(res.status, json?.message ?? 'Something went wrong. Please try again.', json?.code, json?.errors, json?.changes)
    }
    return json.data as T
}

const qs = (o: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    Object.entries(o).forEach(([k, v]) => { if (v) p.set(k, v) })
    const s = p.toString()
    return s ? `?${s}` : ''
}

export interface CheckoutPayload {
    customerName: string; email: string; phone: string; address: string
    paymentMethod: string; notes: string
    items: { productId: string; qty: number; unitPriceCents: number }[]
}

export const api = {
    // public
    categories: () => request<Category[]>('GET', '/categories'),
    products: (f: { q?: string; category?: string; sort?: string }) => request<Product[]>('GET', `/products${qs(f)}`),
    product: (id: string) => request<{ product: Product; related: Product[] }>('GET', `/products/${encodeURIComponent(id)}`),
    paymentMethods: () => request<string[]>('GET', '/payment-methods'),
    resolveCart: (items: { productId: string; qty: number }[]) => request<ResolvedCart>('POST', '/cart/validate', { items }),
    placeOrder: (p: CheckoutPayload) => request<Order>('POST', '/orders', p),

    // admin
    login: (email: string, password: string) => request<{ token: string; email: string }>('POST', '/admin/login', { email, password }),
    logout: () => request<boolean>('POST', '/admin/logout', {}, true),
    me: () => request<{ email: string }>('GET', '/admin/me', undefined, true),
    dashboard: () => request<DashboardStats>('GET', '/admin/dashboard', undefined, true),
    customers: () => request<CustomerRow[]>('GET', '/admin/customers', undefined, true),

    adminProducts: (f: { q?: string; category?: string; status?: string }) => request<Product[]>('GET', `/admin/products${qs(f)}`, undefined, true),
    adminProduct: (id: string) => request<Product>('GET', `/admin/products/${encodeURIComponent(id)}`, undefined, true),
    createProduct: (p: ProductInput) => request<Product>('POST', '/admin/products', p, true),
    updateProduct: (id: string, p: ProductInput) => request<Product>('PUT', `/admin/products/${encodeURIComponent(id)}`, p, true),
    deleteProduct: (id: string) => request<boolean>('DELETE', `/admin/products/${encodeURIComponent(id)}`, undefined, true),

    adminCategories: () => request<Category[]>('GET', '/admin/categories', undefined, true),
    createCategory: (name: string) => request<Category>('POST', '/admin/categories', { name }, true),
    updateCategory: (id: string, name: string) => request<Category>('PUT', `/admin/categories/${encodeURIComponent(id)}`, { name }, true),
    deleteCategory: (id: string) => request<boolean>('DELETE', `/admin/categories/${encodeURIComponent(id)}`, undefined, true),

    orders: () => request<Order[]>('GET', '/admin/orders', undefined, true),
    order: (no: string) => request<Order>('GET', `/admin/orders/${encodeURIComponent(no)}`, undefined, true),
    setOrderStatus: (no: string, status: OrderStatus) => request<Order>('PATCH', `/admin/orders/${encodeURIComponent(no)}/status`, { status }, true),
}

/** First useful message from a Laravel validation error, or the generic message. */
export function errorMessage(e: unknown): string {
    if (e instanceof ApiError) {
        const first = e.fieldErrors && Object.values(e.fieldErrors)[0]?.[0]
        return first ?? e.message
    }
    return 'Something went wrong. Please try again.'
}