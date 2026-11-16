import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { emptyState, sampleState } from "./seed"
import type { AppState, Courier, Order, OrderItem, Product, Zone } from "./types"

const KEY = "ghuri-prototype-v3"

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw) as AppState
      if (s.version === 3) return s
    }
  } catch { /* storage blocked or corrupt */ }
  return sampleState()
}

type Ctx = {
  state: AppState
  set: (fn: (s: AppState) => AppState) => void
  reset: (kind: "sample" | "empty") => void
}
const AppCtx = createContext<Ctx | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(load)
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* storage blocked */ }
  }, [state])
  const value = useMemo<Ctx>(() => ({
    state,
    set: (fn) => setState((s) => fn(s)),
    reset: (kind) => setState(kind === "sample" ? sampleState() : emptyState({ name: "Tajul", phone: "01700000000", email: "" }, "Tajul 1", "tajul-1")),
  }), [state])
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

export function useApp() {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error("useApp outside AppProvider")
  return ctx
}

/* ---------- Derived data ---------- */

/** Orders newest first, each with its customer's history from the other orders. */
export function useOrders(): Order[] {
  const { state } = useApp()
  return useMemo(() => {
    const byPhone = new Map<string, Order[]>()
    for (const o of state.orders) byPhone.set(o.phone, [...(byPhone.get(o.phone) ?? []), o])
    return [...state.orders]
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((o) => {
        const others = (byPhone.get(o.phone) ?? []).filter((x) => x.id !== o.id && x.createdAt < o.createdAt)
        return { ...o, history: { orders: others.length, delivered: others.filter((x) => x.status === "delivered").length, returned: others.filter((x) => x.status === "returned").length } }
      })
  }, [state.orders])
}

export type Customer = {
  phone: string; name: string; district: string; thana: string; address: string
  orders: Order[]; delivered: number; returned: number; spent: number; lastAt: number
}

/** Every buyer becomes a customer, keyed by phone. Guest checkouts included. */
export function useCustomers(): Customer[] {
  const { state } = useApp()
  return useMemo(() => {
    const map = new Map<string, Customer>()
    for (const o of [...state.orders].sort((a, b) => b.createdAt - a.createdAt)) {
      const c = map.get(o.phone) ?? { phone: o.phone, name: o.name, district: o.district, thana: o.thana, address: o.address, orders: [], delivered: 0, returned: 0, spent: 0, lastAt: o.createdAt }
      c.orders.push(o)
      if (o.status === "delivered") { c.delivered++; c.spent += orderTotal(o) }
      if (o.status === "returned") c.returned++
      map.set(o.phone, c)
    }
    return [...map.values()].sort((a, b) => b.lastAt - a.lastAt)
  }, [state.orders])
}

export type SetupStep = { key: string; title: string; description: string; action: string; href: string; done: boolean }

export function useSetup(): { steps: SetupStep[]; done: number; complete: boolean } {
  const { state } = useApp()
  const steps: SetupStep[] = [
    { key: "product", title: "Add your first product", description: "Photos, price and stock. Takes about 2 minutes.", action: "Add product", href: "#product-new", done: state.products.some((p) => p.status === "active") },
    { key: "delivery", title: "Set delivery charges", description: "Inside and outside Dhaka. Without this, every order ships free.", action: "Set charges", href: "#settings-shipping", done: state.zones.length > 0 },
    { key: "payment", title: "Add bKash or Nagad", description: "Take the delivery charge in advance to cut fake orders.", action: "Add payment", href: "#settings-payments", done: state.payments.bkash.enabled || state.payments.nagad.enabled },
    { key: "homepage", title: "Edit your homepage", description: "Replace the sample banner text with your own.", action: "Edit homepage", href: "#theme", done: state.theme.edited },
    { key: "share", title: "Share your store link", description: "Post it on your Facebook page and WhatsApp.", action: "Share link", href: "#home", done: state.shared },
  ]
  const done = steps.filter((s) => s.done).length
  return { steps, done, complete: done === steps.length }
}

/* ---------- Pure helpers ---------- */

export const subtotal = (o: Pick<Order, "items">) => o.items.reduce((s, i) => s + i.qty * i.price, 0)
export const orderTotal = (o: Order) => subtotal(o) + o.fee
export const codDue = (o: Order) => (o.pay === "COD" ? orderTotal(o) - (o.advancePaid ?? 0) : 0)
export const nextOrderId = (s: AppState) => Math.max(1000, ...s.orders.map((o) => o.id)) + 1
export const productStock = (p: Product) => (p.variants.length ? p.variants.reduce((s, v) => s + v.stock, 0) : p.stock)
/** Units available for a product, or for one variant of it (by variant key). */
export const stockFor = (p: Product, variantKey?: string) => (p.variants.length ? (p.variants.find((v) => v.key === variantKey)?.stock ?? 0) : p.stock)
export const zoneFor = (zones: Zone[], district: string) => zones.find((z) => z.districts === (district === "Dhaka" ? "dhaka" : "rest"))
export const taka = (n: number) => "৳" + Math.round(n).toLocaleString("en-IN")
export const uid = () => Math.random().toString(36).slice(2, 9)

export function timeAgo(at: number, now = Date.now()) {
  const m = Math.round((now - at) / 60_000)
  if (m < 1) return "Just now"
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} hr ago`
  const d = Math.round(h / 24)
  if (d === 1) return "Yesterday"
  if (d < 7) return `${d} days ago`
  return new Date(at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

export type Risk = { tone: "destructive" | "success" | "muted"; text: string; high: boolean } | null
export function riskOf(o: Order): Risk {
  const h = o.history
  if (!/^01[3-9]\d{8}$/.test(o.phone)) return { tone: "destructive", text: "Invalid phone", high: true }
  if (h.orders >= 2 && h.returned / h.orders >= 0.5) return { tone: "destructive", text: `${h.returned} of ${h.orders} returned`, high: true }
  if (h.orders === 0) return { tone: "muted", text: "New customer", high: false }
  if (h.delivered >= 2) return { tone: "success", text: `${h.delivered} delivered before`, high: false }
  return null
}

/* ---------- Order actions ---------- */

export function useOrderActions() {
  const { set } = useApp()
  const patch = (id: number, fn: (o: Order) => Order, text: string) =>
    set((s) => ({ ...s, orders: s.orders.map((o) => (o.id === id ? { ...fn(o), log: [{ at: Date.now(), text }, ...o.log] } : o)) }))
  return {
    confirm: (id: number) => patch(id, (o) => ({ ...o, status: "ship" }), "Confirmed by phone (by Tajul)"),
    noAnswer: (id: number) => set((s) => ({ ...s, orders: s.orders.map((o) => o.id === id ? { ...o, noAnswer: o.noAnswer + 1, log: [{ at: Date.now(), text: `Call attempt ${o.noAnswer + 1}: no answer (by Tajul)` }, ...o.log] } : o) })),
    cancel: (id: number, reason: string) => set((s) => {
      const order = s.orders.find((o) => o.id === id)
      if (!order || order.status === "cancelled") return s
      const products = s.products.map((p) => {
        const lines = order.items.filter((i) => i.productId === p.id)
        if (!lines.length) return p
        const qty = lines.reduce((n, l) => n + l.qty, 0)
        const hasVariant = p.variants.length > 0
        return {
          ...p,
          sold: Math.max(0, p.sold - qty),
          stock: hasVariant ? p.stock : p.stock + qty,
          variants: p.variants.map((v) => { const back = lines.filter((x) => x.variant === v.label).reduce((n, l) => n + l.qty, 0); return back ? { ...v, stock: v.stock + back } : v }),
        }
      })
      return { ...s, products, orders: s.orders.map((o) => (o.id === id ? { ...o, status: "cancelled", cancelReason: reason, log: [{ at: Date.now(), text: `Cancelled: ${reason}. Items returned to stock (by Tajul)` }, ...o.log] } : o)) }
    }),
    book: (ids: number[], courier: Courier) => set((s) => ({
      ...s,
      orders: s.orders.map((o) => {
        if (!ids.includes(o.id)) return o
        const cid = `${courier.slice(0, 2).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`
        return { ...o, status: "transit", courier, consignment: cid, log: [{ at: Date.now(), text: `Booked with ${courier}, ${cid} (by Tajul)` }, ...o.log] }
      }),
    })),
    delivered: (id: number) => patch(id, (o) => ({ ...o, status: "delivered" }), "Marked delivered (by Tajul)"),
    returned: (id: number) => patch(id, (o) => ({ ...o, status: "returned" }), "Marked returned (by Tajul)"),
    note: (id: number, text: string) => patch(id, (o) => o, `Note: ${text}`),
  }
}

export function placeOrder(s: AppState, input: { name: string; phone: string; district: string; thana: string; address: string; items: OrderItem[]; fee: number; pay: Order["pay"]; advancePaid?: number; note?: string }): { state: AppState; id: number } {
  const id = nextOrderId(s)
  const now = Date.now()
  const order: Order = { ...input, id, createdAt: now, status: "confirm", noAnswer: 0, history: { orders: 0, delivered: 0, returned: 0 }, log: [{ at: now, text: "Order placed from storefront" }] }
  const products = s.products.map((p) => {
    const lines = input.items.filter((i) => i.productId === p.id)
    if (!lines.length) return p
    const qty = lines.reduce((n, l) => n + l.qty, 0)
    return {
      ...p,
      sold: p.sold + qty,
      stock: p.variants.length ? p.stock : Math.max(0, p.stock - qty),
      variants: p.variants.map((v) => { const l = lines.find((x) => x.variant === v.label); return l ? { ...v, stock: Math.max(0, v.stock - l.qty) } : v }),
    }
  })
  return { state: { ...s, orders: [order, ...s.orders], products, cart: [] }, id }
}
