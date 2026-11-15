import { useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ArrowRightIcon, BanknoteIcon, ReceiptIcon, CheckCircle2Icon, CircleIcon, PackageCheckIcon, PackageIcon, PhoneCallIcon,
  ShoppingBagIcon, SparklesIcon, TruckIcon, Undo2Icon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Page, PageColumn, PageGrid, PageHeader } from "@/components/app/page"
import { StatCard } from "@/components/app/stat-card"
import { ShareStoreButton } from "@/components/app/share-store-button"
import { Money } from "@/components/app/money"
import { OrderStatusBadge } from "@/components/app/status-badge"
import { cn } from "@/lib/utils"
import { orderTotal, productStock, timeAgo, useApp, useOrders, useSetup } from "@/store/store"
import type { Order, Product } from "@/store/types"
import { COURIER_CASH, pctChange } from "@/data/home"

type Range = "7" | "30"

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

/* ---------- Store with orders ---------- */

const chartConfig = { orders: { label: "Orders", color: "var(--primary)" } } satisfies ChartConfig

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

    // Orders per day, zero days filled
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
  const recent = orders.slice(0, 5)
  const { cur, prev, toConfirm, toShip, returns } = data
  const nextStep = setup.steps.find((s) => !s.done)
  const finished = cur.delivered + cur.returned
  const deliveryRate = finished ? Math.round((cur.delivered / finished) * 100) : null
  const cashTotal = COURIER_CASH.reduce((s, c) => s + c.amount, 0)
  const cashParcels = COURIER_CASH.reduce((s, c) => s + c.parcels, 0)

  const tasks = [
    { key: "confirm", count: toConfirm.length, label: "To confirm", hint: data.oldest !== null ? waitingHint(timeAgo(data.oldest, data.now)) : "All confirmed", icon: PhoneCallIcon, href: "#orders", urgent: toConfirm.length > 0 },
    { key: "ship", count: toShip.length, label: "To ship", hint: toShip.length ? "Book a courier" : "Nothing to ship", icon: TruckIcon, href: "#orders", urgent: false },
    { key: "returns", count: returns.length, label: "Returns", hint: "Restock when it’s back", icon: Undo2Icon, href: "#orders", urgent: false },
    { key: "stock", count: lowStock.length, label: "Low stock", hint: "2 or fewer left", icon: PackageIcon, href: "#products", urgent: false },
  ]

  const delta = (now: number, before: number) => (before > 0 ? pctChange(now, before) : undefined)
  const deltaHint = prev.count > 0 ? "vs previous period" : "No orders in the previous period"

  return (
    <Page>
      <PageHeader
        title={greeting(state.account?.name)}
        description={toConfirm.length
          ? `${toConfirm.length} ${toConfirm.length === 1 ? "order is" : "orders are"} waiting for a call. Confirm them first.`
          : "Nothing waiting. Here’s how the store is doing."}
        actions={
          <>
            <Select value={range} onValueChange={(v) => setRange(v as Range)}>
              <SelectTrigger className="w-36" aria-label="Date range"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="7">Last 7 days</SelectItem><SelectItem value="30">Last 30 days</SelectItem></SelectContent>
            </Select>
            <ShareStoreButton />
          </>
        }
      />

      {/* Setup reminder: slim, only while steps remain */}
      {!setup.complete && nextStep && (
        <Card size="sm" className="flex-row flex-wrap items-center gap-4 px-4">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">Finish setup: {nextStep.title.charAt(0).toLowerCase() + nextStep.title.slice(1)}</span>
              <span className="text-muted-foreground">{setup.done} of {setup.steps.length} done</span>
            </div>
            <Progress value={(setup.done / setup.steps.length) * 100} className="max-w-xs" aria-label={`Setup ${setup.done} of ${setup.steps.length} done`} />
          </div>
          {nextStep.key === "share"
            ? <ShareStoreButton size="sm" />
            : <Button variant="outline" size="sm" asChild><a href={nextStep.href}>{nextStep.action}<ArrowRightIcon /></a></Button>}
        </Card>
      )}

      {/* Today's work, before metrics */}
      <section aria-labelledby="todo" className="flex flex-col gap-4">
        <h2 id="todo" className="text-base font-semibold">Needs your attention</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {tasks.map((t) => (
            <a key={t.key} href={t.href} className="group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
              <Card size="sm" className={cn("h-full gap-2 transition-colors group-hover:bg-muted/50", t.urgent && "ring-warning/60 ring-2")}>
                <CardHeader>
                  <CardDescription className="flex items-center gap-2"><t.icon className="size-4" aria-hidden="true" />{t.label}</CardDescription>
                  <div className="text-2xl font-semibold tabular-nums">{t.count}</div>
                  <CardAction><ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden="true" /></CardAction>
                </CardHeader>
                <CardFooter className="text-sm text-muted-foreground">{t.hint}</CardFooter>
              </Card>
            </a>
          ))}
        </div>
      </section>

      {/* Business health */}
      <section aria-labelledby="health" className="flex flex-col gap-4">
        <h2 id="health" className="text-base font-semibold">How the store is doing <span className="font-normal text-muted-foreground">· last {range} days</span></h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Sales" value={<Money value={cur.sales} />} delta={delta(cur.sales, prev.sales)} hint={deltaHint} icon={<BanknoteIcon />} />
          <StatCard label="Orders" value={cur.count} delta={delta(cur.count, prev.count)} hint={deltaHint} icon={<ShoppingBagIcon />} />
          <StatCard
            label="Delivery success"
            value={deliveryRate === null ? "–" : `${deliveryRate}%`}
            hint={deliveryRate === null ? "No deliveries yet" : `${cur.delivered} delivered, ${cur.returned} came back`}
            icon={<PackageCheckIcon />}
          />
          <StatCard label="Average order" value={<Money value={cur.count ? Math.round(cur.sales / cur.count) : 0} />} hint="Sales ÷ orders" icon={<ReceiptIcon />} />
        </div>
      </section>

      <PageGrid>
        <PageColumn>
          <Card>
            <CardHeader>
              <CardTitle>Orders per day</CardTitle>
              <CardDescription>
                {cur.count} {cur.count === 1 ? "order" : "orders"} in the last {range} days.{data.busiest ? ` ${data.busiest} are busiest.` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full">
                <BarChart data={data.days} margin={{ left: 0, right: 0, top: 8 }} accessibilityLayer>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
                  <YAxis tickLine={false} axisLine={false} width={24} allowDecimals={false} />
                  <ChartTooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent />} />
                  <Bar dataKey="orders" fill="var(--color-orders)" radius={[4, 4, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="pb-0">
            <CardHeader>
              <CardTitle>Recent orders</CardTitle>
              <CardAction><Button variant="ghost" size="sm" asChild><a href="#orders">All orders<ArrowRightIcon /></a></Button></CardAction>
            </CardHeader>
            <CardContent className="px-0">
              <Table className="[&_td:first-child]:pl-6 [&_td:last-child]:pr-6 [&_th:first-child]:pl-6 [&_th:last-child]:pr-6">
                <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Customer</TableHead><TableHead className="hidden sm:table-cell">Status</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                <TableBody>
                  {recent.map((o) => (
                    <TableRow key={o.id} className="cursor-pointer" onClick={() => { window.location.hash = `order-${o.id}` }}>
                      <TableCell><a href={`#order-${o.id}`} className="font-medium hover:underline" onClick={(e) => e.stopPropagation()}>#{o.id}</a></TableCell>
                      <TableCell><div className="font-medium">{o.name}</div><div className="text-xs text-muted-foreground tabular-nums">{o.phone} · {o.district}</div></TableCell>
                      <TableCell className="hidden sm:table-cell"><OrderStatusBadge status={o.status} /></TableCell>
                      <TableCell className="text-right"><Money value={orderTotal(o)} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </PageColumn>

        <PageColumn>
          <Card>
            <CardHeader>
              <CardTitle>Cash with couriers</CardTitle>
              <CardDescription className="flex flex-col items-start gap-2">
                <Badge variant="muted">Sample data</Badge>
                <span><Money value={cashTotal} className="font-medium text-foreground" /> from {cashParcels} parcels, not paid to you yet.</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-4">
                {COURIER_CASH.map((c) => (
                  <li key={c.courier} className="flex items-start justify-between gap-4 text-sm">
                    <div className="flex flex-col"><span className="font-medium">{c.courier}</span><span className="text-muted-foreground">{c.parcels} parcels · pays {c.settles}</span></div>
                    <Money value={c.amount} className="font-medium" />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Low stock</CardTitle><CardDescription>{lowStock.length ? "Restock before your next Facebook post." : "Every active product has enough stock."}</CardDescription></CardHeader>
            {lowStock.length > 0 && (
              <CardContent>
                <ul className="flex flex-col gap-4">
                  {lowStock.map((p) => (
                    <li key={p.key}>
                      <a href={`#product-${p.productId}`} className="flex items-center justify-between gap-4 rounded-md text-sm outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
                        <div className="flex min-w-0 flex-col"><span className="truncate font-medium">{p.title}</span>{p.variant && <span className="text-muted-foreground">{p.variant}</span>}</div>
                        <Badge variant={p.left <= 1 ? "destructive" : "warning"}>{p.left} left</Badge>
                      </a>
                    </li>
                  ))}
                </ul>
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader><CardTitle>Best sellers</CardTitle><CardDescription>All time, by units sold.</CardDescription></CardHeader>
            <CardContent>
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
              ) : <p className="text-sm text-muted-foreground">No sales yet.</p>}
            </CardContent>
          </Card>
        </PageColumn>
      </PageGrid>
    </Page>
  )
}

/* ---------- New store, no orders yet ---------- */

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
            <Card>
              <CardHeader>
                <CardTitle>Get ready to sell</CardTitle>
                <CardDescription>{done} of {steps.length} done</CardDescription>
                <CardAction><Badge variant="muted">{Math.round((done / steps.length) * 100)}%</Badge></CardAction>
              </CardHeader>
              <CardContent className="gap-6">
                <Progress value={(done / steps.length) * 100} aria-label={`Setup ${done} of ${steps.length} done`} />
                <ol className="flex flex-col divide-y rounded-lg border">
                  {steps.map((s) => {
                    const isNext = next?.key === s.key
                    return (
                      <li key={s.key} className={cn("flex flex-wrap items-start gap-4 p-4", isNext && "bg-muted/50")}>
                        {s.done ? <CheckCircle2Icon className="mt-0.5 size-5 text-success" aria-hidden="true" /> : <CircleIcon className="mt-0.5 size-5 text-muted-foreground" aria-hidden="true" />}
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <span className={cn("text-sm font-medium", s.done && "text-muted-foreground line-through")}>{s.title}<span className="sr-only">{s.done ? ", done" : ""}</span></span>
                          {!s.done && <span className="text-sm text-muted-foreground">{s.description}</span>}
                        </div>
                        {!s.done && (s.key === "share"
                          ? <ShareStoreButton size="sm" variant={isNext ? "default" : "outline"} />
                          : <Button size="sm" variant={isNext ? "default" : "outline"} asChild><a href={s.href}>{s.action}</a></Button>)}
                      </li>
                    )
                  })}
                </ol>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Orders</CardTitle></CardHeader>
            <CardContent>
              <Empty className="border border-dashed py-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon"><ShoppingBagIcon /></EmptyMedia>
                  <EmptyTitle>No orders yet</EmptyTitle>
                  <EmptyDescription>Your first order shows up here, and we send you an SMS. Share your store link to get it faster.</EmptyDescription>
                </EmptyHeader>
                <ShareStoreButton variant="default" />
              </Empty>
            </CardContent>
          </Card>
        </PageColumn>

        <PageColumn>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><SparklesIcon className="size-4" aria-hidden="true" />Set up with AI</CardTitle>
              <CardDescription>Send product photos to Claude or ChatGPT and let it create the listings for you.</CardDescription>
            </CardHeader>
            <CardFooter><Button variant="outline" size="sm" asChild><a href="#settings-ai">Connect an AI app</a></Button></CardFooter>
          </Card>
          <Card>
            <CardHeader><CardTitle>Your store link</CardTitle><CardDescription>Customers order from here.</CardDescription></CardHeader>
            <CardContent><p className="rounded-md bg-muted px-4 py-2 text-sm break-all">{state.store.handle}.ghuri.store</p></CardContent>
            <CardFooter className="gap-2"><Button variant="outline" size="sm" asChild><a href="#store">Preview store</a></Button></CardFooter>
          </Card>
        </PageColumn>
      </PageGrid>
    </Page>
  )
}
