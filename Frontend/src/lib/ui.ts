export const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ')

// ---------------------------------------------------------------- buttons
type Variant = 'default' | 'primary' | 'ghost' | 'danger' | 'dangerGhost'
type Size = 'sm' | 'md' | 'lg'

const btnBase =
    'inline-flex cursor-pointer items-center justify-center gap-2 rounded-[10px] border-2 border-ink font-bold no-underline transition duration-100 motion-reduce:transition-none ' +
    'not-disabled:hover:-translate-x-px not-disabled:hover:-translate-y-px not-disabled:hover:shadow-hard-lg ' +
    'not-disabled:active:translate-x-0.5 not-disabled:active:translate-y-0.5 not-disabled:active:shadow-hard-xs ' +
    'disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none'

const btnVariant: Record<Variant, string> = {
    default: 'bg-white text-ink shadow-hard hover:text-ink',
    primary: 'bg-cobalt text-white shadow-hard hover:bg-cobalt-dark hover:text-white',
    ghost: 'bg-transparent text-ink shadow-none hover:text-ink',
    danger: 'bg-err text-white shadow-hard hover:text-white',
    dangerGhost: 'bg-white text-err shadow-hard-sm hover:text-err',
}

const btnSize: Record<Size, string> = {
    sm: 'min-h-9.5 px-3 py-1 text-sm',
    md: 'min-h-11 px-4 py-2',
    lg: 'min-h-11 px-6 py-3 text-lg',
}

/** Use on <button> and on <Link> alike. */
export const btn = (variant: Variant = 'default', size: Size = 'md') => cx(btnBase, btnVariant[variant], btnSize[size])

export const linkBtn = 'cursor-pointer border-0 bg-transparent p-0 text-cobalt underline'

// ------------------------------------------------------------------ forms
const inputBase = 'rounded-[10px] border-2 border-ink bg-white text-ink aria-invalid:border-err aria-invalid:bg-err-bg'
export const input = cx(inputBase, 'min-h-11 w-full px-3 py-2')
export const qtyInput = cx(inputBase, 'min-h-9.5 w-16 px-1 py-1 text-center')
export const checkInput = 'size-5 shrink-0 accent-cobalt'
export const fieldLabel = 'text-[0.92rem] font-bold'
export const fieldError = 'mt-0.5 text-sm font-semibold text-err'
export const hintText = 'text-sm text-muted'
export const fieldset = 'flex min-w-0 flex-col gap-3.5 rounded-xl border-2 border-ink bg-white p-4'
export const legend = 'rounded-lg border-2 border-ink bg-lemon px-2 font-display font-bold'
export const filterBar = 'mb-5 flex flex-wrap items-end gap-3 rounded-xl border-2 border-ink bg-lemon-soft p-4'

// ----------------------------------------------------------------- surfaces
export const container = 'mx-auto w-full max-w-6xl px-4'
export const card = 'flex flex-col overflow-hidden rounded-xl border-2 border-ink bg-white shadow-hotpink'
/** No margin on purpose: add my-4 (or a grid gap) where it is used. */
export const panel = 'rounded-xl border-2 border-ink bg-white px-5 py-4'
export const emptyBox = 'my-4 rounded-xl border-2 border-dashed border-ink bg-white px-4 py-10 text-center'
export const statShadows = ['shadow-cobalt', 'shadow-hotpink', 'shadow-lemon'] as const

// ----------------------------------------------------------- badges / notices
export const badgeBase = 'inline-block w-fit rounded-full border-2 border-ink px-2.5 py-0.5 text-[0.8rem] font-bold'
export const badgeTone = {
    ok: 'bg-cobalt-tint text-cobalt-dark',
    low: 'bg-lemon text-ink',
    out: 'bg-hotpink text-ink',
    off: 'bg-line text-ink',
} as const

export const pillTone: Record<string, string> = {
    pending: 'bg-lemon text-ink',
    confirmed: 'bg-cobalt-tint text-cobalt-dark',
    preparing: 'bg-cobalt text-white',
    shipped: 'bg-hotpink text-ink',
    completed: 'bg-ok-bg text-ok',
    cancelled: 'bg-err-bg text-err',
}

export const noticeBase = 'my-3 rounded-[10px] border-2 border-ink px-4 py-3 [&_ul]:my-1 [&_ul]:ml-4 [&_ul]:list-disc'
export const noticeTone = {
    info: 'bg-cobalt-tint',
    success: 'bg-ok-bg text-ok',
    warn: 'bg-lemon text-ink',
    error: 'bg-err-bg text-err',
} as const

// ------------------------------------------------------------------ navigation
export const navLink = 'border-b-[3px] py-1.5 font-semibold text-white no-underline hover:text-lemon focus-visible:outline-lemon'

// ------------------------------------------------------------------- tables
// On phones the stacked tables turn each row into a card and show data-label beside each value.
export const tableWrap = 'overflow-x-auto rounded-xl border-2 border-ink bg-white'
export const table = 'w-full border-collapse max-md:block'
export const thead = 'max-md:sr-only'
export const tbody = 'max-md:block'
export const tr = 'max-md:block max-md:border-b-2 max-md:border-ink max-md:px-3 max-md:py-2 [&:last-child>td]:border-b-0'
export const th = 'whitespace-nowrap border-b-2 border-ink bg-lemon-soft px-3 py-2.5 text-left text-sm font-extrabold'
export const cell = 'border-b border-line px-3 py-2.5 align-middle'
export const stackCell =
    'border-b border-line px-3 py-2.5 align-middle max-md:flex max-md:justify-between max-md:gap-4 max-md:border-0 max-md:px-0 max-md:py-1 max-md:text-right ' +
    'before:text-left before:font-bold before:text-muted before:content-[attr(data-label)] md:before:content-none'
export const actionCell = 'border-b border-line px-3 py-2.5 align-middle max-md:block max-md:border-0 max-md:px-0 max-md:py-1'