import { useMemo, useState } from "react"
import { toast as sonnerToast } from "sonner"
import {
  BanknoteIcon, ImageUpIcon, PackageOpenIcon, ReceiptIcon, SearchIcon, ShoppingBagIcon, TruckIcon, Undo2Icon, CheckIcon, XIcon,
} from "lucide-react"
import { Check, Package, Truck, X } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Page, PageHeader } from "@/components/app/page"
import { StatCard } from "@/components/app/stat-card"
import { Money } from "@/components/app/money"
import { OrderStatusBadge, orderStatusLabel } from "@/components/app/status-badge"
import { ShareStoreButton } from "@/components/app/share-store-button"
import { StatGrid, type Stat } from "@/components/ui/stat-grid"
import { StatusPill, type StatusTone } from "@/components/ui/status-pill"
import { DataTable, type DataColumn } from "@/components/ui/data-table"
import { Segmented } from "@/components/ui/segmented-control"
import { Button as ActionButton } from "@/components/ui/action-button"
import { SearchField, TextField } from "@/components/ui/text-field"
import { EmptyState } from "@/components/ui/empty-state"
import { DropZone } from "@/components/ui/drop-zone"
import { ProgressBar } from "@/components/ui/progress-bar"
import { Toaster as TuffToaster, toast as tuffToast } from "@/components/ui/toast-stack"
import { STAGES, type OrderStatus } from "@/data/orders"
import { orderTotal, taka, useApp, useOrders, useSetup } from "@/store/store"

const TONE: Record<OrderStatus, StatusTone> = {
  confirm: "warning", ship: "brand", transit: "brand", delivered: "positive", returned: "negative", cancelled: "neutral",
}

function Compare({ n, title, note, left, right }: { n: number | string; title: string; note?: string; left: React.ReactNode; right: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4" aria-labelledby={`cmp-${n}`}>
      <div className="flex flex-col gap-1">
        <h2 id={`cmp-${String(n)}`} className="text-lg font-semibold">{n}. {title}</h2>
        {note && <p className="text-sm text-muted-foreground">{note}</p>}
      </div>
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-2">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Current (shadcn)</p>
          {left}
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">TuffUI</p>
          {right}
        </div>
      </div>
    </section>
  )
}

/** Preview-page override: TuffUI's default pill text fails 4.5:1 in light mode, so the table uses our darker foreground tokens. */
const READABLE: Partial<Record<StatusTone, string>> = {
  warning: "text-warning-foreground", brand: "text-info-foreground", positive: "text-success-foreground",
}

type Row = { id: string; order: string; customer: string; phone: string; status: OrderStatus; total: number }

export function TuffuiPreviewPage() {
  const { state } = useApp()
  const orders = useOrders()
  const setup = useSetup()

  // KPIs: all non-cancelled orders.
  const live = orders.filter((o) => o.status !== "cancelled")
  const sales = live.reduce((s, o) => s + orderTotal(o), 0)
  const delivered = live.filter((o) => o.status === "delivered").length
  const returned = live.filter((o) => o.status === "returned").length
  const returnRate = delivered + returned ? Math.round((returned / (delivered + returned)) * 100) : 0
  const avg = live.length ? Math.round(sales / live.length) : 0
  const toConfirm = orders.filter((o) => o.status === "confirm").length

  const stats: Stat[] = [
    { id: "sales", label: "Sales", value: taka(sales), delta: 12.4, trend: [4, 6, 5, 8, 7, 9, 11] },
    { id: "orders", label: "Orders", value: String(live.length), delta: 8.0, trend: [3, 4, 4, 6, 5, 7, 8] },
    { id: "returns", label: "Return rate", value: `${returnRate}%`, delta: -2.1, higherIsBetter: false, trend: [9, 8, 8, 7, 7, 6, 6] },
    { id: "avg", label: "Average order", value: taka(avg), hint: "Sales ÷ orders" },
  ]

  const rows: Row[] = orders.slice(0, 5).map((o) => ({ id: String(o.id), order: `#${o.id}`, customer: o.name, phone: o.phone, status: o.status, total: orderTotal(o) }))
  const columns: DataColumn<Row>[] = [
    { key: "order", label: "Order", sortable: true },
    { key: "customer", label: "Customer", format: (_v, r) => <div className="flex flex-col"><span>{r.customer}</span><span className="text-xs text-muted-foreground">{r.phone}</span></div> },
    { key: "status", label: "Status", priority: 1, format: (_v, r) => <StatusPill tone={TONE[r.status]} className={READABLE[TONE[r.status]]}>{orderStatusLabel(r.status)}</StatusPill> },
    { key: "total", label: "Total", align: "right", sortable: true, priority: 1, format: (v) => taka(Number(v)) },
  ]

  const counts = useMemo(() => Object.fromEntries(STAGES.map((s) => [s, orders.filter((o) => o.status === s).length])) as Record<OrderStatus, number>, [orders])
  const [stageA, setStageA] = useState<OrderStatus>("confirm")
  const [stageB, setStageB] = useState<OrderStatus>("confirm")

  const [qA, setQA] = useState("")
  const [qB, setQB] = useState("")
  const [nameB, setNameB] = useState("")
  const [nameA, setNameA] = useState("")
  const matches = (q: string) => (q ? orders.filter((o) => `${o.name} ${o.phone} ${o.id}`.toLowerCase().includes(q.toLowerCase())).length : orders.length)

  const [filesA, setFilesA] = useState<string[]>([])
  const [filesB, setFilesB] = useState<string[]>([])
  const [rejectB, setRejectB] = useState<string>("")

  const [busy, setBusy] = useState<string | null>(null)
  const fakeAction = (key: string, done: string) => {
    setBusy(key)
    setTimeout(() => { setBusy(null); tuffToast.success(done, { description: "Preview only. No order was changed." }) }, 900)
  }
  const sample = orders.find((o) => o.status === "confirm") ?? orders[0]

  return (
    <Page>
      <PageHeader title="TuffUI trial" description="Our real screens rebuilt with TuffUI components, next to the current shadcn version." />

      <Compare n={1} title="Home KPIs" note="Same numbers from the store. Deltas on the TuffUI side are sample values."
        left={
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard label="Sales" value={<Money value={sales} />} delta={12.4} hint="vs last 30 days" icon={<BanknoteIcon />} />
            <StatCard label="Orders" value={live.length} delta={8} hint="vs last 30 days" icon={<ShoppingBagIcon />} />
            <StatCard label="Return rate" value={`${returnRate}%`} delta={-2.1} deltaUnit=" pts" goodWhen="down" hint="Of finished orders" icon={<Undo2Icon />} />
            <StatCard label="Average order" value={<Money value={avg} />} hint="Sales ÷ orders" icon={<ReceiptIcon />} />
          </div>
        }
        right={<StatGrid data={stats} title="Last 30 days" subtitle={`${toConfirm} orders waiting for a call`} sparklines onSelect={(s) => tuffToast(`${s.label} selected`)} />}
      />

      <Compare n={2} title="Orders list" note="First 5 orders."
        left={
          <Card>
            <CardHeader><CardTitle>Recent orders</CardTitle><CardDescription>{orders.length} orders in total</CardDescription></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Customer</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                <TableBody>
                  {orders.slice(0, 5).map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium"><a href={`#order-${o.id}`} className="hover:underline">#{o.id}</a></TableCell>
                      <TableCell><div className="flex flex-col"><span>{o.name}</span><span className="text-muted-foreground">{o.phone}</span></div></TableCell>
                      <TableCell><OrderStatusBadge status={o.status} /></TableCell>
                      <TableCell className="text-right tabular-nums"><Money value={orderTotal(o)} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        }
        right={<DataTable data={rows} columns={columns} title="Recent orders" subtitle={`${orders.length} orders in total`} searchable selectable pageSize={5}
          actions={(ids) => <ActionButton size="sm" variant="primary" icon={Check} onClick={() => tuffToast.success(`${ids.length} orders selected`)}>Confirm</ActionButton>}
          onRowClick={(r) => { window.location.hash = `order-${r.id}` }} />}
      />

      <Compare n={"2b"} title="Status pills, all stages" note="TuffUI row 1 is the stock pill. Row 2 uses our foreground tokens via className, as in the table above."
        left={<div className="flex flex-wrap gap-2">{STAGES.map((s) => <OrderStatusBadge key={s} status={s} />)}</div>}
        right={
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2" data-pills="stock">{STAGES.map((s) => <StatusPill key={s} tone={TONE[s]}>{orderStatusLabel(s)}</StatusPill>)}</div>
            <div className="flex flex-wrap gap-2" data-pills="fixed">{STAGES.map((s) => <StatusPill key={s} tone={TONE[s]} className={READABLE[TONE[s]]}>{orderStatusLabel(s)}</StatusPill>)}</div>
          </div>
        }
      />

      <Compare n={3} title="Order stage filter"
        left={
          <div className="flex flex-col gap-2">
            <div className="overflow-x-auto">
              <Tabs value={stageA} onValueChange={(v) => setStageA(v as OrderStatus)}>
                <TabsList className="w-max">
                  {STAGES.map((s) => <TabsTrigger key={s} value={s} className="flex-none">{orderStatusLabel(s)}{counts[s] > 0 && <Badge variant="muted">{counts[s]}</Badge>}</TabsTrigger>)}
                </TabsList>
              </Tabs>
            </div>
            <p className="text-sm text-muted-foreground">Showing {counts[stageA]} {orderStatusLabel(stageA).toLowerCase()} orders</p>
          </div>
        }
        right={
          <div className="flex flex-col gap-2">
            <div className="overflow-x-auto">
              <Segmented label="Order stage" value={stageB} onValueChange={setStageB} className="w-max"
                options={STAGES.map((s) => ({ value: s, label: `${orderStatusLabel(s)} ${counts[s]}` }))} />
            </div>
            <p className="text-sm text-muted-foreground">Showing {counts[stageB]} {orderStatusLabel(stageB).toLowerCase()} orders</p>
          </div>
        }
      />

      <Compare n={4} title="Buttons" note={sample ? `Actions for order #${sample.id}. Preview only, nothing changes.` : undefined}
        left={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => sonnerToast.success("Order confirmed", { description: "Preview only. No order was changed." })}><CheckIcon />Confirm order</Button>
            <Button variant="outline" onClick={() => sonnerToast("Courier booked with Pathao", { description: "Preview only. No order was changed." })}><TruckIcon />Book courier</Button>
            <Button variant="destructive" onClick={() => sonnerToast("Order cancelled", { description: "Preview only. No order was changed." })}><XIcon />Cancel order</Button>
          </div>
        }
        right={
          <div className="flex flex-wrap gap-2">
            <ActionButton variant="primary" icon={Check} loading={busy === "confirm"} onClick={() => fakeAction("confirm", "Order confirmed")}>Confirm order</ActionButton>
            <ActionButton variant="secondary" icon={Truck} loading={busy === "courier"} onClick={() => fakeAction("courier", "Courier booked with Pathao")}>Book courier</ActionButton>
            <ActionButton variant="danger" icon={X} loading={busy === "cancel"} onClick={() => fakeAction("cancel", "Order cancelled")}>Cancel order</ActionButton>
            <ActionButton variant="quiet">Not now</ActionButton>
          </div>
        }
      />

      <Compare n={5} title="Search and text input"
        left={
          <div className="flex flex-col gap-4">
            <InputGroup className="w-full bg-card sm:max-w-80">
              <InputGroupAddon><SearchIcon /></InputGroupAddon>
              <InputGroupInput aria-label="Search orders" placeholder="Search name, phone or order #" value={qA} onChange={(e) => setQA(e.target.value)} />
            </InputGroup>
            <p className="text-sm text-muted-foreground">{matches(qA)} orders match</p>
            <Field>
              <FieldLabel htmlFor="cmp-name-a">Customer name</FieldLabel>
              <Input id="cmp-name-a" value={nameA} onChange={(e) => setNameA(e.target.value)} placeholder="Rahima Akter" />
            </Field>
          </div>
        }
        right={
          <div className="flex flex-col gap-4">
            <SearchField label="Search orders" placeholder="Search name, phone or order #" value={qB} onChange={(e) => setQB(e.target.value)} onClear={() => setQB("")} className="sm:max-w-80" />
            <p className="text-sm text-muted-foreground">{matches(qB)} orders match</p>
            <TextField label="Customer name" value={nameB} onChange={(e) => setNameB(e.target.value)} placeholder="Rahima Akter"
              error={nameB.length === 1 ? "Name is too short. Enter at least 2 letters." : undefined} description="As written on the delivery label." />
          </div>
        }
      />

      <Compare n={6} title="Empty state"
        left={
          <Card>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><PackageOpenIcon /></EmptyMedia>
                <EmptyTitle>No orders yet</EmptyTitle>
                <EmptyDescription>Share your store link on Facebook and WhatsApp to get your first order.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent><ShareStoreButton variant="default" /></EmptyContent>
            </Empty>
          </Card>
        }
        right={
          <EmptyState icon={Package} title="No orders yet" description="Share your store link on Facebook and WhatsApp to get your first order."
            action={{ label: "Share store", onClick: () => { navigator.clipboard?.writeText(`https://${state.store.handle}.ghuri.store`).catch(() => {}); tuffToast.success("Store link copied") } }}
            secondaryAction={{ label: "Add a product", onClick: () => { window.location.hash = "product-new" } }} />
        }
      />

      <Compare n={7} title="Product photo upload"
        left={
          <div className="flex flex-col gap-2">
            <input id="cmp-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only"
              onChange={(e) => setFilesA(Array.from(e.target.files ?? []).map((f) => f.name))} />
            <label htmlFor="cmp-photos" className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center transition-colors hover:bg-muted/50">
              <ImageUpIcon className="size-6 text-muted-foreground" aria-hidden="true" />
              <span className="text-sm font-medium">Add photos</span>
              <span className="text-sm text-muted-foreground">Choose from your phone or drop files here. JPEG, PNG or WebP, up to 8.</span>
            </label>
            {filesA.length > 0 && <p className="text-sm text-muted-foreground">Added: {filesA.join(", ")}</p>}
          </div>
        }
        right={
          <div className="flex flex-col gap-2">
            <DropZone title="Add photos" hint="Choose from your phone or drop files here. JPEG, PNG or WebP, up to 8."
              accept="image/jpeg,image/png,image/webp" maxSize={5 * 1024 * 1024} multiple maxFiles={8}
              onFiles={(fs) => { setFilesB(fs.map((f) => f.name)); setRejectB("") }}
              onReject={(r) => setRejectB(r.map((x) => `${x.file.name}: ${x.reason}`).join("; "))} />
            {filesB.length > 0 && <p className="text-sm text-muted-foreground">Added: {filesB.join(", ")}</p>}
            {rejectB && <p className="sr-only">{rejectB}</p>}
          </div>
        }
      />

      <Compare n={8} title="Progress" note={`Store setup, ${setup.done} of ${setup.steps.length} done (live from the store).`}
        left={
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Setup {setup.done} of {setup.steps.length} done</p>
            <Progress value={(setup.done / setup.steps.length) * 100} className="max-w-xs" aria-label={`Setup ${setup.done} of ${setup.steps.length} done`} />
          </div>
        }
        right={
          <div className="flex max-w-xs flex-col gap-2">
            <div className="flex justify-between text-sm"><span className="font-medium">Store setup</span><span className="text-muted-foreground tabular-nums">{setup.done} of {setup.steps.length}</span></div>
            <ProgressBar value={setup.done} max={setup.steps.length} label="Store setup" valueText={`${setup.done} of ${setup.steps.length} steps done`} tone={setup.complete ? "positive" : "brand"} />
          </div>
        }
      />

      <Compare n={9} title="Toast"
        left={<div><Button variant="outline" onClick={() => sonnerToast.success("Order #1011 confirmed", { description: "Rahima will get an SMS.", action: { label: "Undo", onClick: () => sonnerToast("Undone") } })}>Show shadcn toast</Button></div>}
        right={
          <div className="flex flex-wrap gap-2">
            <ActionButton onClick={() => tuffToast.success("Order #1011 confirmed", { description: "Rahima will get an SMS.", action: { label: "Undo", onClick: () => tuffToast("Undone") } })}>Show TuffUI toast</ActionButton>
            <ActionButton variant="quiet" onClick={() => tuffToast.promise(new Promise((r) => setTimeout(r, 1500)), { loading: "Booking Pathao", success: "Courier booked", error: "Booking failed. Try again." })}>Loading toast</ActionButton>
          </div>
        }
      />

      <TuffToaster position="bottom-center" className="bottom-20 md:bottom-4" />
    </Page>
  )
}
