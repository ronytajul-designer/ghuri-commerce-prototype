import { MotionConfig, motion } from "motion/react"
import { useId, useLayoutEffect, useRef, useState } from "react"
import { spring } from "@/lib/motion-tokens"
import { cn } from "@/lib/utils"

/**
 * One look for every tab-like control on the TuffUI pages, matching the approved Products
 * status tabs: grey track, white active pill with a soft shadow and hairline ring (raised grey
 * in dark), optional muted count after the label. The track scrolls sideways on its own, so a
 * long row never scrolls the page.
 */
const TRACK = "inline-flex h-8 w-max items-center rounded-full bg-foreground/[0.05] p-0.5"
const ITEM =
  "relative flex h-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-3 text-[0.8125rem] font-medium outline-none transition-[color,scale] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] disabled:opacity-40"
const PILL =
  "absolute inset-0 rounded-full bg-white shadow-[0_1px_2px_rgb(0_0_0/0.12)] ring-1 ring-black/10 dark:bg-surface-raised dark:ring-white/10"

export type TabOptionTuffui<T extends string = string> = {
  value: T
  label: React.ReactNode
  count?: number
  disabled?: boolean
}

function Scroller({ fill, className, children }: { fill?: boolean; className?: string; children: React.ReactNode }) {
  return <div className={cn("max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", fill ? "w-full" : "w-fit", className)}>{children}</div>
}

function Label({ label, count }: { label: React.ReactNode; count?: number }) {
  return (
    <span className="relative flex items-center gap-2">
      {label}
      {count !== undefined && <span className="text-xs text-muted-foreground tabular-nums">{count}</span>}
    </span>
  )
}

/** State tabs (filters, preview size, pickers). Radio group with roving focus and arrow keys. */
export function SegmentedTabsTuffui<T extends string = string>({
  options, value: valueProp, defaultValue, onValueChange, label, fill, className,
}: {
  options: TabOptionTuffui<T>[]
  value?: T
  defaultValue?: T
  onValueChange?: (value: T) => void
  /** Accessible name for the group. */
  label: string
  /** Stretch the track and split it evenly (pickers inside forms). */
  fill?: boolean
  className?: string
}) {
  const [inner, setInner] = useState<T>(defaultValue ?? options[0]?.value)
  const value = valueProp ?? inner
  const [instant, setInstant] = useState(false)
  const pillId = useId()
  const ref = useRef<HTMLDivElement>(null)

  const select = (next: T, fromKeyboard: boolean) => {
    setInstant(fromKeyboard)
    if (valueProp === undefined) setInner(next)
    onValueChange?.(next)
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
    if (!step) return
    e.preventDefault()
    const enabled = options.filter((o) => !o.disabled)
    const at = enabled.findIndex((o) => o.value === value)
    const next = enabled[(at + step + enabled.length) % enabled.length]
    if (!next) return
    select(next.value, true)
    const btn = ref.current?.querySelector<HTMLButtonElement>(`[data-value="${CSS.escape(next.value)}"]`)
    btn?.focus()
    btn?.scrollIntoView({ block: "nearest", inline: "nearest" })
  }

  return (
    <MotionConfig reducedMotion="user">
      <Scroller fill={fill} className={className}>
        <div ref={ref} role="radiogroup" aria-label={label} onKeyDown={onKeyDown} data-tabs-tuffui="" className={cn(TRACK, fill && "w-full min-w-max")}>
          {options.map((o) => {
            const active = o.value === value
            return (
              <button key={o.value} type="button" role="radio" aria-checked={active} data-value={o.value}
                tabIndex={active ? 0 : -1} disabled={o.disabled} onClick={(e) => select(o.value, e.detail === 0)}
                className={cn(ITEM, fill && "flex-1", active ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
                {active && <motion.span layoutId={pillId} transition={instant ? { duration: 0 } : spring} className={PILL} data-pill="" />}
                <Label label={o.label} count={o.count} />
              </button>
            )
          })}
        </div>
      </Scroller>
    </MotionConfig>
  )
}

// Remembers the last active nav item per nav, so the pill can slide from it after the page changes.
const lastNav = new Map<string, string>()

/** Navigation tabs (links). Same visual and the same sliding pill as the state tabs. */
export function SegmentedNavTuffui({
  items, active, label, className,
}: {
  items: readonly { href: string; label: React.ReactNode; key: string; count?: number }[]
  active: string
  label: string
  className?: string
}) {
  const ref = useRef<HTMLUListElement>(null)
  const [from, setFrom] = useState<{ x: number; width: number } | null>(null)
  useLayoutEffect(() => {
    const prev = lastNav.get(label)
    lastNav.set(label, active)
    if (!prev || prev === active || !ref.current) return
    const a = ref.current.querySelector<HTMLElement>(`[data-key="${CSS.escape(prev)}"]`)
    const b = ref.current.querySelector<HTMLElement>(`[data-key="${CSS.escape(active)}"]`)
    if (a && b) setFrom({ x: a.offsetLeft - b.offsetLeft, width: a.offsetWidth })
  }, [active, label])

  return (
    <MotionConfig reducedMotion="user">
      <Scroller className={className}>
        <nav aria-label={label}>
          <ul ref={ref} className={TRACK} data-tabs-tuffui="">
            {items.map((n) => {
              const on = n.key === active
              return (
                <li key={n.key} className="h-full" data-key={n.key}>
                  <a href={n.href} aria-current={on ? "page" : undefined}
                    className={cn(ITEM, on ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
                    {on && (
                      <motion.span key={from ? `${from.x}` : "still"} className={PILL} data-pill="" style={{ transformOrigin: "left" }}
                        initial={from ? { x: from.x, width: from.width } : false}
                        animate={{ x: 0, width: "100%" }} transition={spring} />
                    )}
                    <Label label={n.label} count={n.count} />
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>
      </Scroller>
    </MotionConfig>
  )
}
