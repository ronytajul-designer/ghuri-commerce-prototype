import { useId, useRef, useState } from "react"
import { toast } from "sonner"
import { motion, MotionConfig } from "motion/react"
import {
  ArrowCounterClockwise, ArrowLeft, ChatCircle, Minus, Money as MoneyIcon, Phone, Plus, ShoppingBag, SquaresFour, Trash, Truck,
} from "@phosphor-icons/react"
import { Button as ActionButton, IconButton } from "@/components/ui/action-button"
import { EmptyState } from "@/components/ui/empty-state"
import { NEGATIVE_TEXT, Pill } from "@/components/app/order-bits-tuffui"
import { Inset, Panel, Shell, ShellHeader } from "@/components/ui/surface"
import { ThemeMenu } from "@/components/app/app-shell-tuffui"
import { Money } from "@/components/app/money"
import { enter, spring } from "@/lib/motion-tokens"
import { outline } from "@/lib/phosphor"
import { cn } from "@/lib/utils"
import { productStock, stockFor, useApp } from "@/store/store"
import type { AppState, Product, ThemeSettings } from "@/store/types"
import { cartLines } from "@/pages/storefront-pages"

/** Contrast fixes shared by the TuffUI storefront, checkout and auth pages: 3:1 edges on fields and unchecked choices. */
export const EDGE = "shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--foreground)_55%,transparent)]"
export const EDGES = "[&_input:not([type=file]):not([data-affix])]:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--foreground)_55%,transparent)] [&_textarea]:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--foreground)_55%,transparent)] [&_[role=combobox]]:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--foreground)_55%,transparent)] [&_[role=radio][aria-checked=false]]:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--foreground)_55%,transparent)]"

export const go = (hash: string) => { window.location.hash = hash }

/* ---------- Shared frame ---------- */

function StoreHeaderTuffui({ back }: { back?: { href: string; label: string } }) {
  const { state } = useApp()
  const count = state.cart.reduce((n, l) => n + l.qty, 0)
  return (
    <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
        <div className="flex min-w-0 items-center gap-2">
          {back && <IconButton icon={outline(ArrowLeft)} label={back.label} size="md" onClick={() => go(back.href)} />}
          <a href="#store-tuffui" className="truncate rounded-full px-2 font-semibold tracking-wide uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring">{state.store.name}</a>
        </div>
        <div className="flex items-center gap-2">
          {state.store.phone && <IconButton icon={outline(Phone)} size="md" label={`Call ${state.store.name}`} onClick={() => { window.location.href = `tel:${state.store.phone}` }} />}
          {state.store.whatsapp && <IconButton icon={outline(ChatCircle)} size="md" label="Message on WhatsApp" onClick={() => window.open(`https://wa.me/88${state.store.whatsapp}`, "_blank", "noreferrer")} />}
          <ActionButton variant="secondary" size="md" icon={outline(ShoppingBag)} onClick={() => go("cart-tuffui")} aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}>
            {count > 0 && <motion.span key={count} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring} className="tabular-nums">{count}</motion.span>}
          </ActionButton>
          <ThemeMenu />
        </div>
      </div>
    </header>
  )
}

function StoreFooterTuffui() {
  const { state } = useApp()
  return (
    <footer className="mt-auto px-4 pb-4 md:px-8">
      <Shell className="mx-auto max-w-6xl">
        <Panel className="grid gap-6 p-6 text-sm md:grid-cols-3">
          <div className="flex flex-col gap-2"><span className="font-semibold uppercase">{state.store.name}</span>{state.store.address && <span className="text-muted-foreground">{state.store.address}</span>}</div>
          <div className="flex flex-col gap-2">
            <span className="font-medium">Contact</span>
            {state.store.phone ? <a href={`tel:${state.store.phone}`} className="text-muted-foreground hover:text-foreground">Call {state.store.phone}</a> : <span className="text-muted-foreground">Contact details coming soon</span>}
            {state.store.facebook && <span className="text-muted-foreground">{state.store.facebook}</span>}
          </div>
          <div className="flex flex-col gap-2"><span className="font-medium">Returns</span><span className="text-muted-foreground">{state.store.returnPolicy || "Ask the seller before ordering."}</span></div>
        </Panel>
        <div className="flex flex-wrap items-center justify-center gap-4 px-4 py-4 text-xs text-muted-foreground">
          <span>Powered by Ghuri Commerce</span>
          <a href="#home-tuffui" className="inline-flex min-h-6 items-center gap-1 underline underline-offset-4"><SquaresFour className="size-3.5" aria-hidden="true" />Back to admin (prototype)</a>
        </div>
      </Shell>
    </footer>
  )
}

export function StoreFrameTuffui({ back, children }: { back?: { href: string; label: string }; children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <div className={cn("flex min-h-svh flex-col bg-background", EDGES)}>
        <StoreHeaderTuffui back={back} />
        <motion.div className="flex flex-1 flex-col" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={enter}>{children}</motion.div>
        <StoreFooterTuffui />
      </div>
    </MotionConfig>
  )
}

const effectivePrice = (p: Product, variantKey?: string) => p.variants.find((v) => v.key === variantKey)?.price ?? p.price

/* ---------- Choice chips (size, colour, collections): wraps, tab-safe with nothing picked ---------- */

type Chip = { value: string; label: string; disabled?: boolean; srNote?: string }

function ChipGroup({ label, value, onValueChange, options, className }: { label: string; value: string; onValueChange: (v: string) => void; options: Chip[]; className?: string }) {
  const pill = useId()
  const ref = useRef<HTMLDivElement>(null)
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
    if (!step) return
    e.preventDefault()
    const btns = [...(ref.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [])]
    const at = btns.findIndex((b) => b === document.activeElement)
    const next = btns[(at + step + btns.length) % btns.length]
    next?.focus(); next?.click()
  }
  return (
    <div ref={ref} role="radiogroup" aria-label={label} onKeyDown={onKeyDown} className={cn("flex flex-wrap gap-2", className)}>
      {options.map((o) => {
        const on = o.value === value
        return (
          <button key={o.value} type="button" role="radio" aria-checked={on} disabled={o.disabled}
            tabIndex={on || !value ? 0 : -1} onClick={() => onValueChange(o.value)}
            className={cn(
              "relative h-9 min-w-12 rounded-full px-4 text-sm font-medium transition-[color,scale] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97] disabled:line-through disabled:opacity-40",
              on ? "bg-foreground text-background" : "bg-foreground/[0.06] text-foreground hover:bg-foreground/[0.1]",
            )}>
            {on && <motion.span layoutId={pill} transition={spring} className="absolute inset-0 rounded-full bg-foreground" aria-hidden="true" />}
            <span className="relative">{o.label}</span>
            {o.srNote && <span className="sr-only"> ({o.srNote})</span>}
          </button>
        )
      })}
    </div>
  )
}

function Stepper({ label, value, onLess, onMore, lessDisabled, moreDisabled, describedBy }: { label: string; value: number; onLess: () => void; onMore: () => void; lessDisabled?: boolean; moreDisabled?: boolean; describedBy?: string }) {
  return (
    <div className="flex items-center rounded-full bg-foreground/[0.06] p-0.5" role="group" aria-label={label}>
      <IconButton icon={outline(Minus)} label="Less" disabled={lessDisabled} onClick={onLess} />
      <motion.span key={value} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={enter} className="w-8 text-center text-sm tabular-nums" aria-live="polite">{value}</motion.span>
      <IconButton icon={outline(Plus)} label="More" aria-describedby={describedBy} disabled={moreDisabled} onClick={onMore} />
    </div>
  )
}

function ProductCard({ p }: { p: Product }) {
  const off = p.compareAt ? Math.round((1 - p.price / p.compareAt) * 100) : 0
  const out = productStock(p) === 0
  return (
    <a href={`#store-tuffui-p-${p.id}`} className="group flex h-full w-full flex-col gap-2 rounded-[1.375rem] bg-surface p-1.5 pb-4 outline-none transition-[scale] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface-inset">
        {p.photos[0] && <img src={p.photos[0]} alt="" className="size-full object-cover transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-105" />}
        {off > 0 && !out && <Pill tone="negative" className="absolute top-2 left-2">{off}% off</Pill>}
        {out && <Pill tone="neutral" className="absolute top-2 left-2">Sold out</Pill>}
      </div>
      <span className="px-2 pt-2 text-sm font-medium">{p.title}</span>
      <span className="flex items-baseline gap-2 px-2 text-sm"><Money value={p.price} className="font-semibold" />{p.compareAt && <Money value={p.compareAt} className="text-muted-foreground line-through" />}</span>
    </a>
  )
}

/* ---------- Store home ---------- */

function StoreHomeContentTuffui({ state, theme }: { state: AppState; theme: ThemeSettings }) {
  const [col, setCol] = useState("all")
  const live = state.products.filter((p) => p.status === "active")
  const collections = state.collections.filter((c) => c.visible && live.some((p) => p.collectionIds.includes(c.id)))
  const shown = col === "all" ? live : live.filter((p) => p.collectionIds.includes(col))
  const minFee = state.zones.length ? Math.min(...state.zones.map((z) => z.fee)) : 0
  return (
    <main className="flex flex-col">
      {theme.announcement && <div className="bg-foreground px-4 py-2 text-center text-sm text-background">{theme.announcement}</div>}
      <section className="mx-auto w-full max-w-6xl px-4 pt-4 md:px-8 md:pt-8">
        <Shell>
          <Panel className="flex flex-col items-start gap-4 px-6 py-12 md:px-12 md:py-16">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tighter text-balance md:text-5xl">{theme.heroTitle}</h1>
            <p className="max-w-xl text-muted-foreground md:text-lg">{theme.heroSubtitle}</p>
            <ActionButton variant="primary" size="md" className="mt-2" onClick={() => document.getElementById("products-grid")?.scrollIntoView({ behavior: "smooth" })}>{theme.heroCta}</ActionButton>
          </Panel>
          <ul aria-label="Why order here" className="grid grid-cols-1 gap-4 px-4 py-4 text-sm sm:grid-cols-3">
            <li className="flex items-center gap-2"><MoneyIcon className="size-4 text-muted-foreground" aria-hidden="true" />Cash on delivery</li>
            <li className="flex items-center gap-2"><Truck className="size-4 text-muted-foreground" aria-hidden="true" /><span>{state.zones.length ? <>Delivery from <Money value={minFee} />, all over Bangladesh</> : "Delivery all over Bangladesh"}</span></li>
            <li className="flex items-center gap-2"><ArrowCounterClockwise className="size-4 text-muted-foreground" aria-hidden="true" />{state.store.returnPolicy ? "Easy exchange" : "Ask about exchange"}</li>
          </ul>
        </Shell>
      </section>
      <section id="products-grid" className="mx-auto flex w-full max-w-6xl scroll-mt-16 flex-col gap-6 px-4 py-8 md:px-8">
        {theme.showCollections && collections.length > 0 && (
          <ChipGroup label="Collections" value={col} onValueChange={setCol} options={[{ value: "all", label: "All" }, ...collections.map((c) => ({ value: c.id, label: c.title }))]} />
        )}
        {shown.length === 0 ? (
          <Shell><Panel><EmptyState icon={ShoppingBag} title="No products yet" description="New products are coming soon." /></Panel></Shell>
        ) : (
          <motion.ul key={col} className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.03 } } }}>
            {shown.map((p) => <motion.li key={p.id} className="flex" variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: enter } }}><ProductCard p={p} /></motion.li>)}
          </motion.ul>
        )}
      </section>
    </main>
  )
}

export function StoreHomeTuffuiPage() {
  const { state } = useApp()
  return <StoreFrameTuffui><StoreHomeContentTuffui state={state} theme={state.theme} /></StoreFrameTuffui>
}

/* ---------- Product page ---------- */

export function StoreProductTuffuiPage({ id }: { id: string }) {
  const { state, set } = useApp()
  const p = state.products.find((x) => x.id === id && x.status === "active")
  const [size, setSize] = useState("")
  const [colour, setColour] = useState("")
  const [qty, setQty] = useState(1)
  const [photo, setPhoto] = useState(0)
  const [tried, setTried] = useState(false)
  if (!p) return (
    <StoreFrameTuffui back={{ href: "store-tuffui", label: "Back to store" }}>
      <main className="mx-auto w-full max-w-xl px-4 py-12"><Shell><Panel><EmptyState icon={ShoppingBag} title="This product is not available" action={{ label: "See other products", onClick: () => go("store-tuffui") }} /></Panel></Shell></main>
    </StoreFrameTuffui>
  )

  const key = [p.sizes.length ? size : "", p.colours.length ? colour : ""].filter(Boolean).join(" / ")
  const needsChoice = (p.sizes.length > 0 && !size) || (p.colours.length > 0 && !colour)
  const variant = p.variants.find((v) => v.key === key)
  const inStock = p.variants.length ? (variant ? variant.stock : 1) : p.stock
  const inCart = state.cart.filter((l) => l.productId === p.id && l.variantKey === (variant?.key ?? undefined)).reduce((n, l) => n + l.qty, 0)
  const known = !p.variants.length || !!variant
  const maxQty = known ? Math.max(0, inStock - inCart) : Infinity
  const shownQty = known ? Math.max(1, Math.min(qty, maxQty)) : qty
  const price = effectivePrice(p, variant?.key)
  const off = p.compareAt ? Math.round((1 - price / p.compareAt) * 100) : 0
  const variantStock = (s: string, c: string) => p.variants.find((v) => v.key === [s, c].filter(Boolean).join(" / "))?.stock ?? 0
  const sizeOut = (s: string) => p.colours.length ? (colour ? variantStock(s, colour) === 0 : p.colours.every((c) => variantStock(s, c) === 0)) : variantStock(s, "") === 0
  const colourOut = (c: string) => p.sizes.length ? (size ? variantStock(size, c) === 0 : p.sizes.every((s) => variantStock(s, c) === 0)) : variantStock("", c) === 0

  const add = (now: boolean) => {
    setTried(true)
    if (needsChoice || inStock === 0) return
    if (maxQty <= 0) {
      if (now) go("checkout-tuffui")
      else toast.error(`You already have all ${inStock} in your cart`)
      return
    }
    const q = shownQty
    set((s) => {
      const existing = s.cart.find((l) => l.productId === p.id && l.variantKey === (variant?.key ?? undefined))
      const cart = existing ? s.cart.map((l) => (l === existing ? { ...l, qty: l.qty + q } : l)) : [...s.cart, { productId: p.id, variantKey: variant?.key, qty: q }]
      return { ...s, cart }
    })
    if (now) go("checkout-tuffui")
    else toast.success("Added to cart", { action: { label: "View cart", onClick: () => go("cart-tuffui") } })
  }

  return (
    <StoreFrameTuffui back={{ href: "store-tuffui", label: "Back to store" }}>
      <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-6 md:grid-cols-2 md:px-8 md:py-8">
        <div className="flex min-w-0 flex-col gap-4">
          <Shell className="aspect-square"><Panel className="size-full overflow-hidden">
            {p.photos[photo] && <motion.img key={photo} src={p.photos[photo]} alt={p.title} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={enter} className="size-full object-cover" />}
          </Panel></Shell>
          {p.photos.length > 1 && (
            <div className="flex flex-wrap gap-2">{p.photos.map((src, i) => <button key={i} type="button" onClick={() => setPhoto(i)} aria-label={`Photo ${i + 1}`} aria-pressed={i === photo} className={cn("size-16 overflow-hidden rounded-xl bg-surface outline-none transition-[scale] duration-150 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.96]", i === photo ? "ring-2 ring-foreground" : "opacity-70 hover:opacity-100")}><img src={src} alt="" className="size-full object-cover" /></button>)}</div>
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tighter text-balance">{p.title}</h1>
            <div className="flex flex-wrap items-baseline gap-2">
              <Money value={price} className="text-2xl font-semibold" />
              {p.compareAt && <><Money value={p.compareAt} className="text-muted-foreground line-through" /><Pill tone="negative">{off}% off</Pill></>}
            </div>
          </div>
          {p.sizes.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="px-1 text-[0.8125rem] font-medium" aria-hidden="true">Size{size && <span className="font-normal text-muted-foreground">: {size}</span>}</span>
              <ChipGroup label="Size" value={size} onValueChange={setSize} options={p.sizes.map((s) => ({ value: s, label: s, disabled: sizeOut(s), srNote: sizeOut(s) ? "sold out" : undefined }))} />
            </div>
          )}
          {p.colours.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="px-1 text-[0.8125rem] font-medium" aria-hidden="true">Colour{colour && <span className="font-normal text-muted-foreground">: {colour}</span>}</span>
              <ChipGroup label="Colour" value={colour} onValueChange={setColour} options={p.colours.map((c) => ({ value: c, label: c, disabled: colourOut(c), srNote: colourOut(c) ? "sold out" : undefined }))} />
            </div>
          )}
          {tried && needsChoice && <p role="alert" className={cn("px-1 text-sm", NEGATIVE_TEXT)}>Choose {[p.sizes.length && !size ? "a size" : "", p.colours.length && !colour ? "a colour" : ""].filter(Boolean).join(" and ")}.</p>}
          {known && inStock > 0 && (inStock <= 5 || shownQty >= maxQty) && (
            <p className="px-1 text-sm text-warning-foreground" id="stock-note">Only {inStock} left{inCart > 0 ? `, ${inCart} already in your cart` : ""}</p>
          )}
          <div className="flex items-center gap-4">
            <span className="px-1 text-sm font-medium" aria-hidden="true">Quantity</span>
            <Stepper label="Quantity" value={shownQty} lessDisabled={shownQty <= 1} moreDisabled={shownQty >= maxQty}
              describedBy={known && inStock > 0 ? "stock-note" : undefined} onLess={() => setQty(shownQty - 1)} onMore={() => setQty(shownQty + 1)} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <ActionButton variant="primary" size="md" className="h-12 text-base" onClick={() => add(true)} disabled={inStock === 0}>{inStock === 0 ? "Sold out" : "Order now"}</ActionButton>
            <ActionButton variant="secondary" size="md" className="h-12 text-base" icon={outline(ShoppingBag)} onClick={() => add(false)} disabled={inStock === 0}>Add to cart</ActionButton>
          </div>
          <Inset className="flex flex-col gap-4 p-4 text-sm">
            <div className="flex gap-2"><MoneyIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><span>Cash on delivery. Check the parcel before you pay.</span></div>
            <div className="flex gap-2"><Truck className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              {state.zones.length ? <span className="flex flex-col gap-1">{state.zones.map((z) => <span key={z.id}>{z.name}: <Money value={z.fee} />, {z.eta}</span>)}</span> : <span>Delivery charge shown at checkout</span>}
            </div>
            {state.store.returnPolicy && <div className="flex gap-2"><ArrowCounterClockwise className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><span>{state.store.returnPolicy}</span></div>}
          </Inset>
          {p.description && <div className="flex flex-col gap-2"><h2 className="text-sm font-medium">Details</h2><p className="text-sm text-muted-foreground">{p.description}</p></div>}
          {state.store.phone && (
            <p className="text-sm text-muted-foreground">Questions before ordering? <a href={`tel:${state.store.phone}`} className="font-medium text-foreground underline underline-offset-4">Call {state.store.phone}</a></p>
          )}
        </div>
      </main>
    </StoreFrameTuffui>
  )
}

/* ---------- Cart ---------- */

export function CartTuffuiPage() {
  const { state, set } = useApp()
  const lines = cartLines(state)
  const sub = lines.reduce((s, l) => s + l.price * l.line.qty, 0)
  const free = state.freeDeliveryOver
  const setQty = (i: number, q: number) => set((s) => ({ ...s, cart: q <= 0 ? s.cart.filter((_, n) => n !== i) : s.cart.map((l, n) => (n === i ? { ...l, qty: q } : l)) }))
  return (
    <StoreFrameTuffui back={{ href: "store-tuffui", label: "Continue shopping" }}>
      <main className="mx-auto grid w-full max-w-5xl items-start gap-6 px-4 py-6 md:px-8 md:py-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <h1 className="text-3xl font-semibold tracking-tighter lg:col-span-2">Your cart</h1>
        {lines.length === 0 ? (
          <Shell className="lg:col-span-2"><Panel><EmptyState icon={ShoppingBag} title="Your cart is empty" action={{ label: "Shop now", onClick: () => go("store-tuffui") }} /></Panel></Shell>
        ) : (
          <>
            <Shell className="min-w-0">
              <ShellHeader title="Items" subtitle={`${lines.reduce((n, l) => n + l.line.qty, 0)} in your cart`} as="h2" />
              <Panel>
                <ul className="divide-y divide-foreground/[0.06]">
                  {lines.map((l, i) => {
                    const left = stockFor(l.product, l.variant?.key)
                    return (
                      <motion.li key={`${l.product.id}-${l.variant?.key ?? ""}`} layout transition={spring} className="flex gap-4 p-4">
                        <img src={l.product.photos[0]} alt="" className="size-20 shrink-0 rounded-xl bg-surface object-cover" />
                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                          <div className="flex items-start justify-between gap-2"><div className="flex min-w-0 flex-col"><span className="font-medium">{l.product.title}</span>{l.variant && <span className="text-sm text-muted-foreground">{l.variant.label}</span>}</div><Money value={l.price * l.line.qty} className="font-medium" /></div>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <Stepper label={`Quantity of ${l.product.title}`} value={l.line.qty} onLess={() => setQty(i, l.line.qty - 1)} moreDisabled={l.line.qty >= left} onMore={() => setQty(i, l.line.qty + 1)} />
                            <ActionButton variant="quiet" icon={outline(Trash)} onClick={() => setQty(i, 0)}>Remove</ActionButton>
                          </div>
                          {l.line.qty > left && <p role="alert" className={cn("text-sm", NEGATIVE_TEXT)}>{left === 0 ? "Sold out. Remove it to check out." : `Only ${left} left. Lower the quantity to check out.`}</p>}
                          {l.line.qty === left && <p className="text-sm text-muted-foreground">That is all we have in stock</p>}
                        </div>
                      </motion.li>
                    )
                  })}
                </ul>
              </Panel>
            </Shell>
            <Shell>
              <ShellHeader title="Summary" as="h2" />
              <Panel className="flex flex-col gap-4 p-4 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><Money value={sub} /></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{state.zones.length ? <>From <Money value={Math.min(...state.zones.map((z) => z.fee))} /></> : "Confirmed by the seller"}</span></div>
                {free && sub < free && <Inset className="flex gap-2 p-4"><Truck className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span>Add <Money value={free - sub} /> more for free delivery.</span></Inset>}
                {free && sub >= free && <Pill tone="positive" className="self-start">Free delivery</Pill>}
                <p className="text-muted-foreground">{state.zones.length ? "Exact delivery charge shows when you pick your district." : "The seller tells you the delivery charge when they call to confirm."}</p>
              </Panel>
              <div className="p-1.5 pt-2"><ActionButton variant="primary" size="md" className="h-12 w-full text-base" onClick={() => go("checkout-tuffui")}>Checkout</ActionButton></div>
            </Shell>
          </>
        )}
      </main>
    </StoreFrameTuffui>
  )
}
