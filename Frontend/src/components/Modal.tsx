import { useEffect, type ReactNode } from 'react';

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [onClose])

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4" onClick={onClose}>
        <div
            role="dialog" aria-modal="true" aria-label={title}
            className="w-full max-w-110 rounded-xl border-2 border-ink bg-white p-5 shadow-hotpink-lg"
            onClick={(e) => e.stopPropagation()}
        >
            <h2 className="mb-2 text-2xl font-bold">{title}</h2>
            {children}
        </div>
        </div>
    )
}