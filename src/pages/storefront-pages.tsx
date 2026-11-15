import { useState } from "react"
import { toast } from "sonner"
import {
  ArrowLeftIcon, BanknoteIcon, LayoutDashboardIcon, MessageCircleIcon, MinusIcon, PhoneIcon, PlusIcon, RotateCcwIcon,
  ShoppingBagIcon, TrashIcon, TruckIcon,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Money } from "@/components/app/money"
import { ModeToggle } from "@/components/mode-toggle"
import { cn } from "@/lib/utils"
import { productStock, useApp } from "@/store/store"
import type { AppState, Product, ThemeSettings } from "@/store/types"

/* ---------- Shared frame ---------- */

export function StoreHeader({ back }: { back?: { href: string; label: string } }) {
  const { state } = useApp()
  const count = state.cart.reduce((n, l) => n + l.qty, 0)
  return (
    <header className="sticky top-0 z-10 border-b bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
        <div className="flex min-w-0 items-center gap-2">
          {back && <Button variant="ghost" size="icon-sm" asChild><a href={back.href} aria-label={back.label}><ArrowLeftIcon /></a></Button>}
          <a href="#store" className="truncate font-semibold tracking-wide uppercase">{state.store.name}</a>
        </div>
        <div className="flex items-center gap-2">
          {state.store.phone && <Button variant="ghost" size="icon" asChild><a href={`tel:${state.store.phone}`} aria-label={`Call ${state.store.name}`}><PhoneIcon /></a></Button>}
          {state.store.whatsapp && <Button variant="ghost" size="icon" asChild><a href={`https://wa.me/88${state.store.whatsapp}`} target="_blank" rel="noreferrer" aria-label="Message on WhatsApp"><MessageCircleIcon /></a></Button>}
          <Button variant="outline" asChild>
            <a href="#cart" aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}><ShoppingBagIcon />{count > 0 && <span className="tabular-nums">{count}</span>}</a>
          </Button>
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}

function StoreFooter() {
  const { state } = useApp()
  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm md:grid-cols-3 md:px-8">
        <div className="flex flex-col gap-2"><span className="font-semibold uppercase">{state.store.name}</span>{state.store.address && <span className="text-muted-foreground">{state.store.address}</span>}</div>
        <div className="flex flex-col gap-2">
          <span className="font-medium">Contact</span>
          {state.store.phone ? <a href={`tel:${state.store.phone}`} className="text-muted-foreground hover:text-foreground">Call {state.store.phone}</a> : <span className="text-muted-foreground">Contact details coming soon</span>}
          {state.store.facebook && <span className="text-muted-foreground">{state.store.facebook}</span>}
        </div>
        <div className="flex flex-col gap-2"><span className="font-medium">Returns</span><span className="text-muted-foreground">{state.store.returnPolicy || "Ask the seller before ordering."}</span></div>
      </div>
      <div className="flex items-center justify-center gap-4 pb-8 text-xs text-muted-foreground">
        <span>Powered by Ghuri Commerce</span>
        <a href="#home" className="inline-flex items-center gap-1 underline underline-offset-4"><LayoutDashboardIcon className="size-3" />Back to admin (prototype)</a>
      </div>
    </footer>
  )
}

export function StoreFrame({ back, children }: { back?: { href: string; label: string }; children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <StoreHeader back={back} />
      {children}
      <StoreFooter />
    </div>
  )
}

const effectivePrice = (p: Product, variantKey?: string) => p.variants.find((v) => v.key === variantKey)?.price ?? p.price

function ProductCard({ p }: { p: Product }) {
  const off = p.compareAt ? Math.round((1 - p.price / p.compareAt) * 100) : 0
  const out = productStock(p) === 0
  return (
    <a href={`#store-p-${p.id}`} className="group flex flex-col gap-2 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
        {p.photos[0] && <img src={p.photos[0]} alt="" className="size-full object-cover transition-transform group-hover:scale-105" />}
        {off > 0 && !out && <Badge variant="destructive" className="absolute top-2 left-2">{off}% off</Badge>}
        {out && <Badge variant="muted" className="absolute top-2 left-2">Sold out</Badge>}
      </div>
      <span className="text-sm font-medium">{p.title}</span>
      <span className="flex items-baseline gap-2 text-sm"><Money value={p.price} className="font-semibold" />{p.compareAt && <Money value={p.compareAt} className="text-muted-foreground line-through" />}</span>
    </a>
  )
}

/* ---------- Store home (also used as the theme preview) ---------- */

export function StoreHomeContent({ state, theme, preview }: { state: AppState; theme: ThemeSettings; preview?: boolean }) {
  const [col, setCol] = useState("all")
  const live = state.products.filter((p) => p.status === "active")
  const collections = state.collections.filter((c) => c.visible && live.some((p) => p.collectionIds.includes(c.id)))
  const shown = col === "all" ? live : live.filter((p) => p.collectionIds.includes(col))
  const minFee = state.zones.length ? Math.min(...state.zones.map((z) => z.fee)) : 0
  return (
    <main className="flex flex-col">
      {theme.announcement && <div className="bg-primary px-4 py-2 text-center text-sm text-primary-foreground">{theme.announcement}</div>}
      <section className="border-b bg-muted/40">
        <div className={cn("mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 md:px-8", preview ? "py-8" : "py-12 md:py-16")}>
          <h1 className={cn("max-w-2xl font-semibold tracking-tight text-balance", preview ? "text-2xl" : "text-3xl md:text-4xl")}>{theme.heroTitle}</h1>
          <p className="max-w-xl text-muted-foreground">{theme.heroSubtitle}</p>
          <Button asChild><a href="#products-grid">{theme.heroCta}</a></Button>
        </div>
      </section>
      <section aria-label="Why order here" className="border-b">
        <ul className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-4 text-sm sm:grid-cols-3 md:px-8">
          <li className="flex items-center gap-2"><BanknoteIcon className="size-4 text-muted-foreground" aria-hidden="true" />Cash on delivery</li>
          <li className="flex items-center gap-2"><TruckIcon className="size-4 text-muted-foreground" aria-hidden="true" />{state.zones.length ? <>Delivery from <Money value={minFee} />, all over Bangladesh</> : "Delivery all over Bangladesh"}</li>
          <li className="flex items-center gap-2"><RotateCcwIcon className="size-4 text-muted-foreground" aria-hidden="true" />{state.store.returnPolicy ? "Easy exchange" : "Ask about exchange"}</li>
        </ul>
      </section>
      <section id="products-grid" className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8">
        {theme.showCollections && collections.length > 0 && (
          <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none]">
            <ToggleGroup type="single" variant="outline" spacing={2} value={col} onValueChange={(v) => v && setCol(v)} aria-label="Collections" className="w-max">
              <ToggleGroupItem value="all" className="px-4">All</ToggleGroupItem>
              {collections.map((c) => <ToggleGroupItem key={c.id} value={c.id} className="px-4">{c.title}</ToggleGroupItem>)}
            </ToggleGroup>
          </div>
        )}
        {shown.length === 0 ? (
          <Empty className="border border-dashed py-12"><EmptyHeader><EmptyTitle>No products yet</EmptyTitle><EmptyDescription>New products are coming soon.</EmptyDescription></EmptyHeader></Empty>
        ) : (
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{shown.map((p) => <li key={p.id}><ProductCard p={p} /></li>)}</ul>
        )}
      </section>
    </main>
  )
}

export function StoreHomePage() {
  const { state } = useApp()
  return <StoreFrame><StoreHomeContent state={state} theme={state.theme} /></StoreFrame>
}

/* ---------- Product page ---------- */

export function StoreProductPage({ id }: { id: string }) {
  const { state, set } = useApp()
  const p = state.products.find((x) => x.id === id && x.status === "active")
  const [size, setSize] = useState("")
  const [colour, setColour] = useState("")
  const [qty, setQty] = useState(1)
  const [photo, setPhoto] = useState(0)
  const [tried, setTried] = useState(false)
  if (!p) return <StoreFrame back={{ href: "#store", label: "Back to store" }}><Empty className="py-16"><EmptyHeader><EmptyTitle>This product is not available</EmptyTitle></EmptyHeader><EmptyContent><Button asChild><a href="#store">See other products</a></Button></EmptyContent></Empty></StoreFrame>

  const key = [p.sizes.length ? size : "", p.colours.length ? colour : ""].filter(Boolean).join(" / ")
  const needsChoice = (p.sizes.length > 0 && !size) || (p.colours.length > 0 && !colour)
  const variant = p.variants.find((v) => v.key === key)
  const inStock = p.variants.length ? (variant ? variant.stock : 1) : p.stock
  const price = effectivePrice(p, variant?.key)
  const off = p.compareAt ? Math.round((1 - price / p.compareAt) * 100) : 0
  const variantStock = (s: string, c: string) => p.variants.find((v) => v.key === [s, c].filter(Boolean).join(" / "))?.stock ?? 0
  const sizeOut = (s: string) => p.colours.length ? (colour ? variantStock(s, colour) === 0 : p.colours.every((c) => variantStock(s, c) === 0)) : variantStock(s, "") === 0
  const colourOut = (c: string) => p.sizes.length ? (size ? variantStock(size, c) === 0 : p.sizes.every((s) => variantStock(s, c) === 0)) : variantStock("", c) === 0

  const add = (go: boolean) => {
    setTried(true)
    if (needsChoice || inStock === 0) return
    set((s) => {
      const existing = s.cart.find((l) => l.productId === p.id && l.variantKey === (variant?.key ?? undefined))
      const cart = existing ? s.cart.map((l) => (l === existing ? { ...l, qty: l.qty + qty } : l)) : [...s.cart, { productId: p.id, variantKey: variant?.key, qty }]
      return { ...s, cart }
    })
    if (go) window.location.hash = "checkout"
    else toast.success("Added to cart", { action: { label: "View cart", onClick: () => { window.location.hash = "cart" } } })
  }

  return (
    <StoreFrame back={{ href: "#store", label: "Back to store" }}>
      <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-6 md:grid-cols-2 md:px-8 md:py-8">
        <div className="flex flex-col gap-4">
          <div className="aspect-square overflow-hidden rounded-lg border bg-muted">{p.photos[photo] && <img src={p.photos[photo]} alt={p.title} className="size-full object-cover" />}</div>
          {p.photos.length > 1 && (
            <div className="flex gap-2">{p.photos.map((src, i) => <button key={i} type="button" onClick={() => setPhoto(i)} aria-label={`Photo ${i + 1}`} className={cn("size-16 overflow-hidden rounded-md border", i === photo && "ring-2 ring-primary")}><img src={src} alt="" className="size-full object-cover" /></button>)}</div>
          )}
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{p.title}</h1>
            <div className="flex flex-wrap items-baseline gap-2">
              <Money value={price} className="text-2xl font-semibold" />
              {p.compareAt && <><Money value={p.compareAt} className="text-muted-foreground line-through" /><Badge variant="destructive">{off}% off</Badge></>}
            </div>
          </div>
          {p.sizes.length > 0 && (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium">Size{size && <span className="font-normal text-muted-foreground">: {size}</span>}</legend>
              <ToggleGroup type="single" variant="outline" spacing={2} value={size} onValueChange={setSize} className="flex-wrap">
                {p.sizes.map((s) => <ToggleGroupItem key={s} value={s} disabled={sizeOut(s)} className="min-w-12 px-4 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{s}</ToggleGroupItem>)}
              </ToggleGroup>
            </fieldset>
          )}
          {p.colours.length > 0 && (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium">Colour{colour && <span className="font-normal text-muted-foreground">: {colour}</span>}</legend>
              <ToggleGroup type="single" variant="outline" spacing={2} value={colour} onValueChange={setColour} className="flex-wrap">
                {p.colours.map((c) => <ToggleGroupItem key={c} value={c} disabled={colourOut(c)} className="px-4 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{c}</ToggleGroupItem>)}
              </ToggleGroup>
            </fieldset>
          )}
          {tried && needsChoice && <p role="alert" className="text-sm text-destructive">Choose {[p.sizes.length && !size ? "a size" : "", p.colours.length && !colour ? "a colour" : ""].filter(Boolean).join(" and ")}.</p>}
          {variant && variant.stock > 0 && variant.stock <= 3 && <p className="text-sm text-warning-foreground">Only {variant.stock} left</p>}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium" id="qty-label">Quantity</span>
            <div className="flex items-center rounded-md border" role="group" aria-labelledby="qty-label">
              <Button variant="ghost" size="icon" aria-label="Less" disabled={qty <= 1} onClick={() => setQty(qty - 1)}><MinusIcon /></Button>
              <span className="w-8 text-center tabular-nums" aria-live="polite">{qty}</span>
              <Button variant="ghost" size="icon" aria-label="More" onClick={() => setQty(qty + 1)}><PlusIcon /></Button>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button size="lg" onClick={() => add(true)} disabled={inStock === 0}>{inStock === 0 ? "Sold out" : "Order now"}</Button>
            <Button size="lg" variant="outline" onClick={() => add(false)} disabled={inStock === 0}>Add to cart</Button>
          </div>
          <Card size="sm">
            <CardContent className="flex flex-col gap-4 text-sm">
              <div className="flex gap-2"><BanknoteIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><span>Cash on delivery. Check the parcel before you pay.</span></div>
              <div className="flex gap-2"><TruckIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                {state.zones.length ? <span className="flex flex-col gap-1">{state.zones.map((z) => <span key={z.id}>{z.name}: <Money value={z.fee} />, {z.eta}</span>)}</span> : <span>Delivery charge shown at checkout</span>}
              </div>
              {state.store.returnPolicy && <div className="flex gap-2"><RotateCcwIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><span>{state.store.returnPolicy}</span></div>}
            </CardContent>
          </Card>
          {p.description && <div className="flex flex-col gap-2"><h2 className="text-sm font-medium">Details</h2><p className="text-sm text-muted-foreground">{p.description}</p></div>}
          {state.store.phone && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              Questions before ordering?
              <Button variant="link" className="h-auto p-0" asChild><a href={`tel:${state.store.phone}`}>Call {state.store.phone}</a></Button>
            </div>
          )}
        </div>
      </main>
    </StoreFrame>
  )
}

/* ---------- Cart ---------- */

export function cartLines(state: AppState) {
  return state.cart.flatMap((l) => {
    const p = state.products.find((x) => x.id === l.productId)
    if (!p) return []
    const v = p.variants.find((x) => x.key === l.variantKey)
    return [{ line: l, product: p, variant: v, price: effectivePrice(p, v?.key) }]
  })
}

export function CartPage() {
  const { state, set } = useApp()
  const lines = cartLines(state)
  const sub = lines.reduce((s, l) => s + l.price * l.line.qty, 0)
  const free = state.freeDeliveryOver
  const setQty = (i: number, q: number) => set((s) => ({ ...s, cart: q <= 0 ? s.cart.filter((_, n) => n !== i) : s.cart.map((l, n) => (n === i ? { ...l, qty: q } : l)) }))
  return (
    <StoreFrame back={{ href: "#store", label: "Continue shopping" }}>
      <main className="mx-auto grid w-full max-w-5xl items-start gap-6 px-4 py-6 md:px-8 md:py-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <h1 className="text-2xl font-semibold tracking-tight lg:col-span-2">Your cart</h1>
        {lines.length === 0 ? (
          <Card className="lg:col-span-2"><Empty className="py-12"><EmptyHeader><EmptyMedia variant="icon"><ShoppingBagIcon /></EmptyMedia><EmptyTitle>Your cart is empty</EmptyTitle></EmptyHeader><EmptyContent><Button asChild><a href="#store">Shop now</a></Button></EmptyContent></Empty></Card>
        ) : (
          <>
            <Card className="gap-0 py-0">
              <ul className="divide-y">
                {lines.map((l, i) => (
                  <li key={i} className="flex gap-4 p-4">
                    <img src={l.product.photos[0]} alt="" className="size-20 shrink-0 rounded-md border object-cover" />
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex items-start justify-between gap-2"><div className="flex flex-col"><span className="font-medium">{l.product.title}</span>{l.variant && <span className="text-sm text-muted-foreground">{l.variant.label}</span>}</div><Money value={l.price * l.line.qty} className="font-medium" /></div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center rounded-md border" role="group" aria-label={`Quantity of ${l.product.title}`}>
                          <Button variant="ghost" size="icon-sm" aria-label="Less" onClick={() => setQty(i, l.line.qty - 1)}><MinusIcon /></Button>
                          <span className="w-8 text-center text-sm tabular-nums">{l.line.qty}</span>
                          <Button variant="ghost" size="icon-sm" aria-label="More" onClick={() => setQty(i, l.line.qty + 1)}><PlusIcon /></Button>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setQty(i, 0)}><TrashIcon />Remove</Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
              <CardContent className="gap-4 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><Money value={sub} /></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{state.zones.length ? <>From <Money value={Math.min(...state.zones.map((z) => z.fee))} /></> : "Free"}</span></div>
                {free && sub < free && <Alert><TruckIcon /><AlertDescription className="text-foreground">Add <Money value={free - sub} /> more for free delivery.</AlertDescription></Alert>}
                {free && sub >= free && <Badge variant="success">Free delivery</Badge>}
                <Separator />
                <p className="text-muted-foreground">Exact delivery charge shows when you pick your district.</p>
              </CardContent>
              <CardFooter><Button size="lg" className="w-full" asChild><a href="#checkout">Checkout</a></Button></CardFooter>
            </Card>
          </>
        )}
      </main>
    </StoreFrame>
  )
}
