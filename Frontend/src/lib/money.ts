/** All amounts are integer centavos. Never do arithmetic on peso floats. */
export function formatPHP(cents: number): string {
    const sign = cents < 0 ? '-' : ''
    const abs = Math.abs(Math.trunc(cents))
    const pesos = Math.floor(abs / 100).toLocaleString('en-US')
    const centavos = String(abs % 100).padStart(2, '0')
    return `${sign}PHP ${pesos}.${centavos}`
}

/** Parse "120", "120.5" or "1,200.00" into centavos with string maths. Returns null if invalid. */
export function parsePesosToCents(input: string): number | null {
    const s = input.trim().split(',').join('')
    if (!/^\d+(\.\d{1,2})?$/.test(s)) return null
    const [whole, frac = ''] = s.split('.')
    return Number(whole) * 100 + Number(frac.padEnd(2, '0'))
}

export function centsToInput(cents: number): string {
    return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`
}