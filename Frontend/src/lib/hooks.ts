import { useCallback, useEffect, useRef, useState } from 'react';

export interface Async<T> { data: T | null; loading: boolean; error: string | null; reload: () => void }

/** Small data-loading hook: loading / error / data plus a manual reload. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): Async<T> {
    const [data, setData] = useState<T | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [tick, setTick] = useState(0)
    const fnRef = useRef(fn)
    fnRef.current = fn

    useEffect(() => {
        let alive = true
        setLoading(true)
        setError(null)
        fnRef.current()
        .then((d) => { if (alive) setData(d) })
        .catch((e: unknown) => { if (alive) setError(e instanceof Error ? e.message : 'Something went wrong.') })
        .finally(() => { if (alive) setLoading(false) })
        return () => { alive = false }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, tick])

    const reload = useCallback(() => setTick((t) => t + 1), [])
    return { data, loading, error, reload }
}

export function useDebounced<T>(value: T, ms = 300): T {
    const [v, setV] = useState(value)
    useEffect(() => {
        const t = setTimeout(() => setV(value), ms)
        return () => clearTimeout(t)
    }, [value, ms])
    return v
}

export const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })