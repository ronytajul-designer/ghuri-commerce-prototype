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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Page, PageColumn, PageGrid, PageHeader } from "@/components/app/page"
import { StatCard } from "@/components/app/stat-card"
import { ShareStoreButton } from "@/components/app/share-store-button"
import { Money } from "@/components/app/money"
import { OrderStatusBadge } from "@/components/app/status-badge"
import { cn } from "@/lib/utils"
import { type Order, total } from "@/data/orders"
import { COURIER_CASH, DAILY, KPIS, LOW_STOCK, SETUP_STEPS, TOP_PRODUCTS, pctChange } from "@/data/home"

type View = "active" | "new"
type Range = "7" | "30"

export function HomePage({ orders }: { orders: Order[] }) {
  const [view, setView] = useState<View>("active")
  return (
    <>
      <div className="border-b bg-muted/50">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-2 px-4 py-2 text-sm md:px-8">
          <span className="text-muted-foreground">Prototype preview:</span>
          <ToggleGroup type="single" size="sm" variant="outline" value={view} onValueChange={(v) => v && setView(v as View)} aria-label="Preview state">
            <ToggleGroupItem value="active" className="px-3">Store with orders</ToggleGroupItem>
            <ToggleGroupItem value="new" className="px-3">New store</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
      {view === "active" ? <ActiveHome orders={orders} /> : <NewStoreHome />}
    </>
  )
}

/* ---------- Store with orders ---------- */

const chartConfig = { orders: { label: "Orders", color: "var(--primary)" } } satisfies ChartConfig

function ActiveHome({ orders }: { orders: Order[] }) {
  const [range, setRange] = useState<Range>("30")
  const days = range === "7" ? DAILY.slice(-7) : DAILY
  const ordersNow = days.reduce((s, d) => s + d.orders, 0)
  const salesNow = days.reduce((s, d) => s + d.sales, 0)
  const prevFactor = range === "7" ? 0.91 : KPIS.orders.prev / KPIS.orders.value
  const toConfirm = orders.filter((o) => o.status === "confirm")
  const toShip = orders.filter((o) => o.status === "ship")
  const returned = orders.filter((o) => o.status === "returned")
  const recent = useMemo(() => [...orders].sort((a, b) => b.id - a.id).slice(0, 5), [orders])
  const setupDone = 4

  const tasks = [
    { key: "confirm", count: toConfirm.length, label: "To confirm", hint: toConfirm.length ? "Oldest waiting 1 hr" : "All confirmed", icon: PhoneCallIcon, href: "#orders", urgent: toConfirm.length > 0 },
    { key: "ship", count: toShip.length, label: "To ship", hint: "Book a courier", icon: TruckIcon, href: "#orders", urgent: false },
    { key: "returns", count: returned.length, label: "Returns", hint: "Restock when it’s back", icon: Undo2Icon, href: "#orders", urgent: false },
    { key: "stock", count: LOW_STOCK.length, label: "Low stock", hint: "2 or fewer left", icon: PackageIcon, href: "#product-new", urgent: false },
  ]

  return (
    <Page>
      <PageHeader
        title="Good morning, Tajul"
        description={toConfirm.length ? `${toConfirm.length} orders are waiting for a call. Confirm them first.` : "Nothing waiting. Here’s how the store is doing."}
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

      {/* Setup reminder: one remaining step, slim */}
      <Card size="sm" className="flex-row flex-wrap items-center gap-4 px-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">Finish setup: add bKash or Nagad</span>
            <span className="text-muted-foreground">{setupDone} of {SETUP_STEPS.length} done</span>
          </div>
          <Progress value={(setupDone / SETUP_STEPS.length) * 100} className="max-w-xs" aria-label={`Setup ${setupDone} of ${SETUP_STEPS.length} done`} />
        </div>
        <Button variant="outline" size="sm" asChild><a href="#home">Add payment<ArrowRightIcon /></a></Button>
      </Card>

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
          <StatCard label="Sales" value={<Money value={salesNow} />} delta={pctChange(salesNow, Math.round(salesNow * prevFactor))} hint="vs previous period" icon={<BanknoteIcon />} />
          <StatCard label="Orders" value={ordersNow} delta={pctChange(ordersNow, Math.round(ordersNow * prevFactor))} hint="vs previous period" icon={<ShoppingBagIcon />} />
          <StatCard label="Delivery success" value={`${KPIS.deliveryRate.value}%`} delta={KPIS.deliveryRate.value - KPIS.deliveryRate.prev} deltaUnit=" pts" hint={`${100 - KPIS.deliveryRate.value}% came back`} icon={<PackageCheckIcon />} />
          <StatCard label="Average order" value={<Money value={Math.round(salesNow / ordersNow)} />} hint="Sales ÷ orders" icon={<ReceiptIcon />} />
        </div>
      </section>

      <PageGrid>
        <PageColumn>
          <Card>
            <CardHeader>
              <CardTitle>Orders per day</CardTitle>
              <CardDescription>{ordersNow} orders in the last {range} days. Fridays are busiest.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full">
                <BarChart data={days} margin={{ left: 0, right: 0, top: 8 }} accessibilityLayer>
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
                      <TableCell className="text-right"><Money value={total(o)} /></TableCell>
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
              <CardDescription><Money value={KPIS.codWithCouriers.value} className="font-medium text-foreground" /> from {KPIS.codWithCouriers.parcels} parcels, not paid to you yet.</CardDescription>
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
            <CardHeader><CardTitle>Low stock</CardTitle><CardDescription>Restock before your next Facebook post.</CardDescription></CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-4">
                {LOW_STOCK.map((p) => (
                  <li key={p.title + p.variant} className="flex items-center justify-between gap-4 text-sm">
                    <div className="flex min-w-0 flex-col"><span className="truncate font-medium">{p.title}</span><span className="text-muted-foreground">{p.variant}</span></div>
                    <Badge variant={p.left <= 1 ? "destructive" : "warning"}>{p.left} left</Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Best sellers</CardTitle><CardDescription>Last {range} days.</CardDescription></CardHeader>
            <CardContent>
              <ol className="flex flex-col gap-4">
                {TOP_PRODUCTS.map((p, i) => (
                  <li key={p.title} className="flex items-center gap-4 text-sm">
                    <span className="w-4 text-muted-foreground tabular-nums">{i + 1}</span>
                    <div className="flex min-w-0 flex-1 flex-col"><span className="truncate font-medium">{p.title}</span><span className="text-muted-foreground">{p.sold} sold</span></div>
                    <Money value={p.revenue} />
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </PageColumn>
      </PageGrid>
    </Page>
  )
}

/* ---------- New store, no orders yet ---------- */

function NewStoreHome() {
  const [done, setDone] = useState<string[]>(["product"])
  const next = SETUP_STEPS.find((s) => !done.includes(s.key))
  return (
    <Page>
      <PageHeader title="Welcome, Tajul" description="Five steps and your store is ready for its first order." actions={<ShareStoreButton />} />

      <PageGrid>
        <PageColumn>
          <Card>
            <CardHeader>
              <CardTitle>Get ready to sell</CardTitle>
              <CardDescription>{done.length} of {SETUP_STEPS.length} done</CardDescription>
              <CardAction><Badge variant={done.length === SETUP_STEPS.length ? "success" : "muted"}>{Math.round((done.length / SETUP_STEPS.length) * 100)}%</Badge></CardAction>
            </CardHeader>
            <CardContent className="gap-6">
              <Progress value={(done.length / SETUP_STEPS.length) * 100} aria-label={`Setup ${done.length} of ${SETUP_STEPS.length} done`} />
              <ol className="flex flex-col divide-y rounded-lg border">
                {SETUP_STEPS.map((s) => {
                  const isDone = done.includes(s.key)
                  const isNext = next?.key === s.key
                  return (
                    <li key={s.key} className={cn("flex flex-wrap items-start gap-4 p-4", isNext && "bg-muted/50")}>
                      {isDone ? <CheckCircle2Icon className="mt-0.5 size-5 text-success" aria-hidden="true" /> : <CircleIcon className="mt-0.5 size-5 text-muted-foreground" aria-hidden="true" />}
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className={cn("text-sm font-medium", isDone && "text-muted-foreground line-through")}>{s.title}<span className="sr-only">{isDone ? ", done" : ""}</span></span>
                        {!isDone && <span className="text-sm text-muted-foreground">{s.description}</span>}
                      </div>
                      {!isDone && (
                        <Button size="sm" variant={isNext ? "default" : "outline"} onClick={() => s.href === "#home" ? setDone([...done, s.key]) : (window.location.hash = s.href.slice(1))}>
                          {s.action}
                        </Button>
                      )}
                    </li>
                  )
                })}
              </ol>
            </CardContent>
          </Card>

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
            <CardFooter><Button variant="outline" size="sm" asChild><a href="#home">Connect an AI app</a></Button></CardFooter>
          </Card>
          <Card>
            <CardHeader><CardTitle>Your store link</CardTitle><CardDescription>Customers order from here.</CardDescription></CardHeader>
            <CardContent><p className="rounded-md bg-muted px-4 py-2 text-sm break-all">tajul-1.ghuri.store</p></CardContent>
            <CardFooter className="gap-2"><Button variant="outline" size="sm" asChild><a href="#checkout">Preview store</a></Button></CardFooter>
          </Card>
        </PageColumn>
      </PageGrid>
    </Page>
  )
}
