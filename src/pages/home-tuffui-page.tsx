import { useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ArrowRight, Bag, CheckCircle, Circle, Package, Phone, Sparkle, Truck, ArrowUUpLeft, Storefront, ListBullets, Coins, Warning, Trophy, ChartBar, CalendarBlank,
} from "@phosphor-icons/react"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PageTuffui as Page, PageColumnTuffui as PageColumn, PageGridTuffui as PageGrid, PageHeaderTuffui as PageHeader } from "@/components/app/page-tuffui"
import { ShareStoreButtonTuffui as ShareStoreButton } from "@/components/app/share-store-button-tuffui"
import { outline } from "@/lib/phosphor"
import { motion } from "motion/react"
import { EASE_OUT } from "@/lib/motion-tokens"
import { Money } from "@/components/app/money"
import { orderStatusLabel } from "@/components/app/status-badge"
import { StatGrid, type Stat } from "@/components/ui/stat-grid"
import { StatusPill, type StatusTone } from "@/components/ui/status-pill"
import { DataTable, type DataColumn } from "@/components/ui/data-table"
import { Select as TuffSelect } from "@/components/ui/select-field"
import { Button as ActionButton } from "@/components/ui/action-button"
import { EmptyState } from "@/components/ui/empty-state"
import { ProgressBar } from "@/components/ui/progress-bar"
import { RollingNumber } from "@/components/ui/rolling-number"
import { Inset, Panel, Shell, ShellHeader } from "@/components/ui/surface"
import { cn } from "@/lib/utils"
import { orderTotal, productStock, taka, timeAgo, useApp, useOrders, useSetup } from "@/store/store"
import type { Order, Product } from "@/store/types"
import type { OrderStatus } from "@/data/orders"
import { COURIER_CASH, pctChange } from "@/data/home"

type Range = "7" | "30" | "90"

const DAY = 86_400_000
const WEEKDAYS = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"]

export function HomePage() {
  const { state } = useApp()
  return state.orders.length === 0 ? <NewStoreHome /> : <ActiveHome />
}

/* ---------- Derived data ---------- */

const startOfDay = (t: number) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime() }

function greeting(name?: string) {
  const h = new Date().getHours()
  const part = h < 12 ? "morning" : h < 17 ? "afternoon" : "evening"
  return name ? `Good ${part}, ${name}` : `Good ${part}`
}

/** When an order came back: the latest "returned" entry in its log. */
function returnedAt(o: Order) {
  return o.log.find((l) => /returned/i.test(l.text))?.at
}

function waitingHint(ago: string) {
  return ago.endsWith(" ago") ? `Oldest waiting ${ago.slice(0, -4)}` : `Oldest from ${ago.toLowerCase()}`
}

type LowStockRow = { key: string; productId: string; title: string; variant?: string; left: number }

function lowStockRows(products: Product[]): LowStockRow[] {
  const rows: LowStockRow[] = []
  for (const p of products) {
    if (p.status !== "active") continue
    const total = productStock(p)
    const lowVariants = p.variants.filter((v) => v.stock <= 2)
    if (lowVariants.length) {
      for (const v of lowVariants) rows.push({ key: `${p.id}-${v.key}`, productId: p.id, title: p.title, variant: v.label, left: v.stock })
    } else if (total <= 5) {
      rows.push({ key: p.id, productId: p.id, title: p.title, variant: p.variants.length ? "All variants" : undefined, left: total })
    }
  }
  return rows.sort((a, b) => a.left - b.left)
}

function periodStats(orders: Order[], from: number, to: number) {
  const inRange = orders.filter((o) => o.createdAt >= from && o.createdAt < to && o.status !== "cancelled")
  const delivered = inRange.filter((o) => o.status === "delivered").length
  const returned = inRange.filter((o) => o.status === "returned").length
  return { orders: inRange, count: inRange.length, sales: inRange.reduce((s, o) => s + orderTotal(o), 0), delivered, returned }
}


const TONE: Record<OrderStatus, StatusTone> = {
  confirm: "warning", ship: "brand", transit: "brand", delivered: "positive", returned: "negative", cancelled: "neutral",
}
/**
 * Page-scoped contrast overrides. TuffUI's stock pill text fails 4.5:1 in light mode.
 * Negative uses a darker red than text-destructive, which also measured under 4.5:1 on the pale tint.
 */
const READABLE: Record<StatusTone, string> = {
  warning: "text-warning-foreground",
  brand: "text-info-foreground",
  positive: "text-success-foreground",
  negative: "text-[oklch(0.45_0.2_27)] dark:text-destructive",
  neutral: "",
}
/** Same fix for the delta pills StatGrid renders internally (it does not take a pill className). */
const STAT_FIX = "[&_.truncate]:whitespace-normal [&_.truncate]:overflow-visible [&_.text-positive]:text-success-foreground [&_.text-negative]:text-[oklch(0.45_0.2_27)] dark:[&_.text-negative]:text-destructive"

function Pill({ tone, children }: { tone: StatusTone; children: React.ReactNode }) {
  return <StatusPill tone={tone} className={READABLE[tone]}>{children}</StatusPill>
}

/** ShellHeader truncates subtitles; let them wrap instead. */
const WRAP = "[&_p]:whitespace-normal [&_p]:overflow-visible [&_p]:text-clip"

function go(href: string) { window.location.hash = href.replace(/^#/, "") }

export function HomeTuffuiPage() {
  const { state } = useApp()
  return state.orders.length === 0 ? <NewStoreHome /> : <ActiveHome />
}

const chartConfig = { orders: { label: "Orders", color: "var(--brand)" } } satisfies ChartConfig

type RecentRow = { id: string; order: string; customer: string; phone: string; district: string; status: OrderStatus; total: number }

function ActiveHome() {
  const { state } = useApp()
  const orders = useOrders()
  const setup = useSetup()
  const [range, setRange] = useState<Range>("30")
  const n = Number(range)

  const data = useMemo(() => {
    const now = Date.now()
    const todayStart = startOfDay(now)
    const from = todayStart - (n - 1) * DAY
    const prevFrom = from - n * DAY
    const cur = periodStats(orders, from, now + 1)
    const prev = periodStats(orders, prevFrom, from)
    const days = Array.from({ length: n }, (_, i) => {
      const t = from + i * DAY
      return { date: t, label: new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short" }), orders: 0 }
    })
    const byWeekday = Array(7).fill(0) as number[]
    for (const o of cur.orders) {
      const idx = Math.floor((startOfDay(o.createdAt) - from) / DAY)
      if (days[idx]) days[idx].orders++
      byWeekday[new Date(o.createdAt).getDay()]++
    }
    const max = Math.max(...byWeekday)
    const busiest = max > 0 ? WEEKDAYS[byWeekday.indexOf(max)] : null
    const toConfirm = orders.filter((o) => o.status === "confirm")
    const oldest = toConfirm.reduce<number | null>((m, o) => (m === null || o.createdAt < m ? o.createdAt : m), null)
    const toShip = orders.filter((o) => o.status === "ship")
    const returns = orders.filter((o) => {
      if (o.status !== "returned") return false
      const at = returnedAt(o)
      return at !== undefined && at >= now - 30 * DAY
    })
    return { cur, prev, days, busiest, toConfirm, oldest, toShip, returns, now }
  }, [orders, n])

  const lowStock = useMemo(() => lowStockRows(state.products), [state.products])
  const bestSellers = useMemo(
    () => state.products.filter((p) => p.status === "active" && p.sold > 0).sort((a, b) => b.sold - a.sold).slice(0, 3),
    [state.products],
  )
  const { cur, prev, toConfirm, toShip, returns } = data
  const nextStep = setup.steps.find((s) => !s.done)
  const finished = cur.delivered + cur.returned
  const deliveryRate = finished ? Math.round((cur.delivered / finished) * 100) : null
  const cashTotal = COURIER_CASH.reduce((s, c) => s + c.amount, 0)
  const cashParcels = COURIER_CASH.reduce((s, c) => s + c.parcels, 0)

  const tasks = [
    { key: "confirm", count: toConfirm.length, label: "To confirm", hint: data.oldest !== null ? waitingHint(timeAgo(data.oldest, data.now)) : "All confirmed", icon: Phone, href: "#orders-tuffui", urgent: toConfirm.length > 0 },
    { key: "ship", count: toShip.length, label: "To ship", hint: toShip.length ? "Book a courier" : "Nothing to ship", icon: Truck, href: "#orders-tuffui-ship", urgent: false },
    { key: "returns", count: returns.length, label: "Returns", hint: "Restock when it’s back", icon: ArrowUUpLeft, href: "#orders-tuffui-returned", urgent: false },
    { key: "stock", count: lowStock.length, label: "Low stock", hint: "2 or fewer left", icon: Package, href: "#products", urgent: false },
  ]

  const delta = (now: number, before: number) => (before > 0 ? pctChange(now, before) : undefined)
  const deltaHint = prev.count > 0 ? "vs previous period" : "No orders in the previous period"
  const stats: Stat[] = [
    { id: "sales", label: "Sales", value: taka(cur.sales), delta: delta(cur.sales, prev.sales), hint: deltaHint },
    { id: "orders", label: "Orders", value: String(cur.count), delta: delta(cur.count, prev.count), hint: deltaHint },
    { id: "delivery", label: "Delivery success", value: deliveryRate === null ? "Not yet" : `${deliveryRate}%`, hint: deliveryRate === null ? "No deliveries yet" : `${cur.delivered} delivered, ${cur.returned} came back` },
    { id: "avg", label: "Average order", value: taka(cur.count ? Math.round(cur.sales / cur.count) : 0), hint: "Sales ÷ orders" },
  ]

  const rows: RecentRow[] = orders.slice(0, 5).map((o) => ({ id: String(o.id), order: `#${o.id}`, customer: o.name, phone: o.phone, district: o.district, status: o.status, total: orderTotal(o) }))
  const columns: DataColumn<RecentRow>[] = [
    { key: "order", label: "Order", width: "15%", format: (_v, r) => <a href={`#order-tuffui-${r.id}`} className="font-medium hover:underline" onClick={(e) => e.stopPropagation()}>{r.order}</a> },
    {
      key: "customer", label: "Customer", format: (_v, r) => (
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{r.customer}</span>
          <span className="truncate text-xs text-muted-foreground tabular-nums">{r.phone} · {r.district}</span>
          <span className="mt-2 @md:hidden"><Pill tone={TONE[r.status]}>{orderStatusLabel(r.status)}</Pill></span>
        </div>
      ),
    },
    { key: "status", label: "Status", priority: 2, format: (_v, r) => <Pill tone={TONE[r.status]}>{orderStatusLabel(r.status)}</Pill> },
    { key: "total", label: "Total", align: "right", priority: 1, format: (v) => <Money value={Number(v)} className="font-sans text-sm" /> },
  ]

  return (
    <Page>
      <PageHeader
        title={greeting(state.account?.name)}
        description={toConfirm.length
          ? `${toConfirm.length} ${toConfirm.length === 1 ? "order is" : "orders are"} waiting for a call. Confirm them first.`
          : "Nothing waiting. Here’s how the store is doing."}
        actions={
          <>
            <div className="w-44">
              <TuffSelect label={<span className="sr-only">Date range</span>} value={range} onValueChange={(v) => setRange(v as Range)}
                options={[{ value: "7", label: "Last 7 days" }, { value: "30", label: "Last 30 days" }, { value: "90", label: "Last 90 days" }]} />
            </div>
            <ShareStoreButton />
          </>
        }
      />

      {!setup.complete && nextStep && (
        <Shell aria-label="Finish setup">
          <Panel className="flex flex-wrap items-center gap-4 p-4">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">Finish setup: {nextStep.title.charAt(0).toLowerCase() + nextStep.title.slice(1)}</span>
                <span className="text-muted-foreground">{setup.done} of {setup.steps.length} done</span>
              </div>
              <ProgressBar value={setup.done} max={setup.steps.length} className="max-w-xs" label="Store setup" valueText={`Setup ${setup.done} of ${setup.steps.length} done`} />
            </div>
            {nextStep.key === "share"
              ? <ShareStoreButton variant="primary" />
              : <ActionButton variant="primary" size="md" onClick={() => go(nextStep.href)}>{nextStep.action}<ArrowRight className="size-4" aria-hidden="true" /></ActionButton>}
          </Panel>
        </Shell>
      )}

      <section aria-labelledby="todo" className="flex flex-col gap-4">
        <h2 id="todo" className="text-base font-semibold">Needs your attention</h2>
        <Shell>
          <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-4">
            {tasks.map((t, i) => (
              <motion.a key={t.key} href={t.href} className="group rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.24, ease: EASE_OUT, delay: i * 0.04 } }}
                whileHover={{ y: -2, transition: { duration: 0.15, ease: EASE_OUT } }} whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}>
                <Panel className={cn("flex h-full flex-col gap-2 p-4 transition-colors group-hover:bg-foreground/[0.04]", t.urgent && "ring-2 ring-warning ring-inset")}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2 text-[0.8125rem] font-medium text-foreground"><t.icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><span className="truncate">{t.label}</span></span>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-[translate,color] group-hover:translate-x-1 group-hover:text-foreground" aria-hidden="true" />
                  </div>
                  <RollingNumber value={t.count} className="text-[1.625rem] leading-none font-medium tracking-tight" />
                  <span className="text-xs text-muted-foreground">{t.hint}</span>
                </Panel>
              </motion.a>
            ))}
          </div>
        </Shell>
      </section>

      <section aria-labelledby="health" className="flex flex-col gap-4">
        <h2 id="health" className="text-base font-semibold">How the store is doing <span className="font-normal text-muted-foreground">· last {range} days</span></h2>
        <StatGrid data={stats} sparklines={false} className={cn("max-w-none @4xl:[&>div]:grid-cols-4", STAT_FIX)} />
      </section>

      <PageGrid>
        <PageColumn>
          <Shell>
            <ShellHeader className={WRAP} icon={outline(ChartBar)} title="Orders per day"
              subtitle={<>
                <span className="block">{cur.count} {cur.count === 1 ? "order" : "orders"} in the last {range} days</span>
                {data.busiest && <span className="mt-1 flex items-center gap-1 text-foreground"><CalendarBlank className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />{data.busiest} are busiest</span>}
              </>} />
            <Panel className="p-4">
              <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full">
                <BarChart data={data.days} margin={{ left: 0, right: 0, top: 8 }} accessibilityLayer>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
                  <YAxis tick={{ fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={24} allowDecimals={false} />
                  <ChartTooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent />} />
                  <Bar dataKey="orders" fill="var(--color-orders)" radius={[4, 4, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ChartContainer>
            </Panel>
          </Shell>

          <div className="flex flex-col gap-2">
            <DataTable data={rows} columns={columns} title="Recent orders" pageSize={5} searchable={false} onRowClick={(r) => go(`order-tuffui-${r.id}`)} className="max-w-none" />
            <div className="flex justify-end"><ActionButton variant="quiet" size="sm" onClick={() => go("orders-tuffui")}>All orders<ArrowRight className="size-4" aria-hidden="true" /></ActionButton></div>
          </div>
        </PageColumn>

        <PageColumn>
          <Shell>
            <ShellHeader className={WRAP} icon={outline(Coins)} title="Cash with couriers" aside={<StatusPill tone="neutral">Sample data</StatusPill>} />
            <Panel className="flex flex-col gap-4 p-4">
              <p className="text-sm text-muted-foreground"><Money value={cashTotal} className="font-medium text-foreground" /> from {cashParcels} parcels, not paid to you yet.</p>
              <ul className="flex flex-col gap-2">
                {COURIER_CASH.map((c) => (
                  <li key={c.courier}>
                    <Inset className="flex items-start justify-between gap-4 px-4 py-2 text-sm">
                      <div className="flex min-w-0 flex-col"><span className="font-medium">{c.courier}</span><span className="text-muted-foreground">{c.parcels} parcels</span><span className="text-muted-foreground">Pays {c.settles}</span></div>
                      <Money value={c.amount} className="font-medium" />
                    </Inset>
                  </li>
                ))}
              </ul>
            </Panel>
          </Shell>

          <Shell>
            <ShellHeader className={WRAP} icon={outline(Warning)} title="Low stock" subtitle={lowStock.length ? "Restock before your next Facebook post." : undefined} />
            <Panel className="p-4">
              {lowStock.length > 0 ? (
                <ul className="flex flex-col gap-4">
                  {lowStock.map((p) => (
                    <li key={p.key}>
                      <a href={`#product-${p.productId}`} className="flex items-center justify-between gap-4 rounded-md text-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-surface-inset">
                        <div className="flex min-w-0 flex-col"><span className="truncate font-medium">{p.title}</span>{p.variant && <span className="text-muted-foreground">{p.variant}</span>}</div>
                        <Pill tone={p.left <= 1 ? "negative" : "warning"}>{p.left} left</Pill>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : <EmptyState compact icon={outline(CheckCircle)} title="Stock looks good" description="Every active product has enough stock." />}
            </Panel>
          </Shell>

          <Shell>
            <ShellHeader className={WRAP} icon={outline(Trophy)} title="Best sellers" subtitle="All time, by units sold." />
            <Panel className="p-4">
              {bestSellers.length ? (
                <ol className="flex flex-col gap-4">
                  {bestSellers.map((p, i) => (
                    <li key={p.id} className="flex items-center gap-4 text-sm">
                      <span className="w-4 text-muted-foreground tabular-nums">{i + 1}</span>
                      <div className="flex min-w-0 flex-1 flex-col"><a href={`#product-${p.id}`} className="truncate font-medium hover:underline">{p.title}</a><span className="text-muted-foreground">{p.sold} sold</span></div>
                      <Money value={p.sold * p.price} />
                    </li>
                  ))}
                </ol>
              ) : <EmptyState compact icon={outline(Bag)} title="No sales yet" />}
            </Panel>
          </Shell>
        </PageColumn>
      </PageGrid>
    </Page>
  )
}

function NewStoreHome() {
  const { state } = useApp()
  const { steps, done, complete } = useSetup()
  const next = steps.find((s) => !s.done)
  const name = state.account?.name
  return (
    <Page>
      <PageHeader
        title={name ? `Welcome, ${name}` : "Welcome"}
        description={complete ? "Your store is ready. Share the link to get your first order." : "Five steps and your store is ready for its first order."}
        actions={<ShareStoreButton />}
      />
      <PageGrid>
        <PageColumn>
          {!complete && (
            <Shell>
              <ShellHeader className={WRAP} icon={outline(ListBullets)} title="Get ready to sell" subtitle={`${done} of ${steps.length} done`}
                aside={<StatusPill tone="neutral">{Math.round((done / steps.length) * 100)}%</StatusPill>} />
              <Panel className="flex flex-col gap-4 p-4">
                <ProgressBar value={done} max={steps.length} label="Store setup" valueText={`Setup ${done} of ${steps.length} done`} />
                <ol className="flex flex-col gap-2">
                  {steps.map((s) => {
                    const isNext = next?.key === s.key
                    return (
                      <li key={s.key}>
                        <Inset className={cn("flex flex-wrap items-start gap-4 p-4", isNext && "ring-2 ring-brand/40 ring-inset")}>
                          {s.done ? <CheckCircle className="size-4 text-success-foreground dark:text-success" aria-hidden="true" /> : <Circle className="size-4 text-muted-foreground" aria-hidden="true" />}
                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className={cn("text-sm font-medium", s.done && "text-muted-foreground line-through")}>{s.title}<span className="sr-only">{s.done ? ", done" : ""}</span></span>
                            {!s.done && <span className="text-sm text-muted-foreground">{s.description}</span>}
                          </div>
                          {!s.done && (s.key === "share"
                            ? <ShareStoreButton size="sm" variant={isNext ? "primary" : "secondary"} />
                            : <ActionButton size="sm" variant={isNext ? "primary" : "secondary"} onClick={() => go(s.href)}>{s.action}</ActionButton>)}
                        </Inset>
                      </li>
                    )
                  })}
                </ol>
              </Panel>
            </Shell>
          )}
          <Shell>
            <ShellHeader className={WRAP} icon={outline(Bag)} title="Orders" />
            <Panel className="flex flex-col items-center gap-4 pb-6">
              <EmptyState icon={outline(Package)} title="No orders yet"
                description="Your first order shows up here, and we send you an SMS. Share your store link to get it faster." />
              <ShareStoreButton variant="primary" />
            </Panel>
          </Shell>
        </PageColumn>
        <PageColumn>
          <Shell>
            <ShellHeader className={WRAP} icon={outline(Sparkle)} title="Set up with AI" subtitle="Let Claude or ChatGPT create listings from photos." />
            <Panel className="flex flex-col gap-4 p-4">
              <p className="text-sm text-muted-foreground">Send product photos to Claude or ChatGPT and let it create the listings for you.</p>
              <div><ActionButton variant="secondary" size="sm" onClick={() => go("settings-ai")}>Connect an AI app</ActionButton></div>
            </Panel>
          </Shell>
          <Shell>
            <ShellHeader className={WRAP} icon={outline(Storefront)} title="Your store link" subtitle="Customers order from here." />
            <Panel className="flex flex-col gap-4 p-4">
              <Inset className="px-4 py-2 text-sm break-all">{state.store.handle}.ghuri.store</Inset>
              <div><ActionButton variant="secondary" size="sm" onClick={() => go("store")}>Preview store</ActionButton></div>
            </Panel>
          </Shell>
        </PageColumn>
      </PageGrid>
    </Page>
  )
}
