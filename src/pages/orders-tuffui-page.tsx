import { useMemo, useState } from "react"
import { toast } from "sonner"
import { motion } from "motion/react"
import { MagnifyingGlass, Printer, Truck } from "@phosphor-icons/react"
import { Button as ActionButton } from "@/components/ui/action-button"
import { DataTable, type DataColumn } from "@/components/ui/data-table"
import { EmptyState } from "@/components/ui/empty-state"
import { Segmented } from "@/components/ui/segmented-control"
import { SearchField } from "@/components/ui/text-field"
import { Shell, Panel } from "@/components/ui/surface"
import { PageTuffui as Page, PageHeaderTuffui as PageHeader } from "@/components/app/page-tuffui"
import { Money } from "@/components/app/money"
import { orderStatusLabel } from "@/components/app/status-badge"
import { BookCourierModal, PaymentPill, Pill, RiskPill } from "@/components/app/order-bits-tuffui"
import { type Order, type OrderStatus, STAGES, total } from "@/data/orders"
import { EASE_OUT } from "@/lib/motion-tokens"
import { outline } from "@/lib/phosphor"
import { timeAgo, useOrderActions, useOrders } from "@/store/store"

type Row = { id: string; order: string; customer: string; district: string; pay: null; signals: null; total: number }

export function OrdersTuffuiPage({ initialStage = "confirm" }: { initialStage?: OrderStatus }) {
  const orders = useOrders()
  const { book: onBook } = useOrderActions()
  const [stage, setStage] = useState<OrderStatus>(initialStage)
  const [query, setQuery] = useState("")
  const [checked, setChecked] = useState<string[]>([])
  const [booking, setBooking] = useState(false)

  const counts = useMemo(
    () => Object.fromEntries(STAGES.map((s) => [s, orders.filter((o) => o.status === s).length])) as Record<OrderStatus, number>,
    [orders],
  )
  const q = query.trim().toLowerCase().replace(/^#/, "")
  const list = orders.filter((o) => o.status === stage).filter((o) => !q || `${o.name} ${o.phone} ${o.id}`.toLowerCase().includes(q))
  const byId = new Map<string, Order>(list.map((o) => [String(o.id), o]))
  const rows: Row[] = list.map((o) => ({ id: String(o.id), order: `#${o.id}`, customer: o.name, district: o.district, pay: null, signals: null, total: total(o) }))
  const open = (id: string) => { window.location.hash = `order-tuffui-${id}` }

  const signals = (o: Order) => (
    <div className="flex flex-wrap gap-1">
      <RiskPill order={o} />
      {o.noAnswer > 0 && <Pill tone="warning">No answer ×{o.noAnswer}</Pill>}
      {o.consignment && <Pill tone="brand">{o.courier} {o.consignment}</Pill>}
    </div>
  )

  const columns: DataColumn<Row>[] = [
    {
      key: "order", label: "Order", width: "w-24", format: (_v, r) => (
        <div className="flex flex-col">
          <a href={`#order-tuffui-${r.id}`} className="font-medium hover:underline" onClick={(e) => e.stopPropagation()}>{r.order}</a>
          <span className="text-xs text-muted-foreground">{timeAgo(byId.get(r.id)!.createdAt)}</span>
        </div>
      ),
    },
    {
      key: "customer", label: "Customer", format: (_v, r) => {
        const o = byId.get(r.id)!
        return (
          <div className="flex min-w-0 flex-col whitespace-normal">
            <span className="font-medium">{o.name}</span>
            <span className="text-xs text-muted-foreground tabular-nums">{o.phone}<span className="@xl:hidden"> · {o.district}</span></span>
            <div className="mt-2 flex flex-wrap gap-1 @xl:hidden"><PaymentPill order={o} /><RiskPill order={o} />{o.noAnswer > 0 && <Pill tone="warning">No answer ×{o.noAnswer}</Pill>}</div>
          </div>
        )
      },
    },
    {
      key: "district", label: "Delivery", priority: 3, format: (_v, r) => {
        const o = byId.get(r.id)!
        return <div className="flex flex-col"><span>{o.district}</span><span className="text-xs text-muted-foreground">{o.thana || "No thana"}</span></div>
      },
    },
    { key: "pay", label: "Payment", priority: 3, format: (_v, r) => <PaymentPill order={byId.get(r.id)!} /> },
    { key: "signals", label: "Signals", priority: 3, format: (_v, r) => signals(byId.get(r.id)!) },
    { key: "total", label: "Total", align: "right", priority: 1, format: (v) => <Money value={Number(v)} className="font-sans text-sm font-medium" /> },
  ]

  return (
    <Page>
      <PageHeader
        title="Orders"
        description="Confirm cash on delivery orders by phone, then book a courier."
        badge={counts.confirm > 0 ? <Pill tone="warning">{counts.confirm} to confirm</Pill> : undefined}
      />

      <div className="flex flex-col gap-4">
        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0">
          <Segmented label="Order stage" size="md" className="w-max" value={stage}
            onValueChange={(v) => { setStage(v); setChecked([]); history.replaceState(null, "", `#orders-tuffui-${v}`) }}
            options={STAGES.map((s) => ({
              value: s,
              label: <span className="flex items-center gap-2">{orderStatusLabel(s)}<span className="text-xs text-muted-foreground tabular-nums">{counts[s]}</span></span>,
            }))} />
        </div>

        <SearchField className="w-full sm:max-w-80" label={<span className="sr-only">Search orders</span>} placeholder="Search name, phone or order #"
          value={query} onChange={(e) => setQuery(e.target.value)} onClear={() => setQuery("")} />

        <motion.div key={stage} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.2, ease: EASE_OUT } }}>
          {rows.length === 0 ? (
            <Shell>
              <Panel className="py-8">
                <EmptyState icon={outline(MagnifyingGlass)} title={`No orders in ${orderStatusLabel(stage)}`}
                  description={q ? "Try another name, phone number or order number." : "Orders move here as you work through them."} />
              </Panel>
            </Shell>
          ) : (
            <DataTable data={rows} columns={columns} title={orderStatusLabel(stage)} subtitle={`${rows.length} order${rows.length === 1 ? "" : "s"}`}
              pageSize={20} searchable={false} selectable selected={checked} onSelectedChange={setChecked}
              onRowClick={(r) => open(r.id)} className="max-w-none [&_tbody_td]:align-top [&_.text-brand]:text-info-foreground [&_[role=checkbox][aria-checked=false]]:bg-foreground/50"
              actions={() => (
                <span role="region" aria-label="Bulk actions" className="flex flex-wrap gap-2">
                  {stage === "ship" && <ActionButton variant="primary" size="sm" icon={outline(Truck)} onClick={() => setBooking(true)}>Book courier</ActionButton>}
                  <ActionButton variant="secondary" size="sm" icon={outline(Printer)} onClick={() => toast("Invoices ready to print (prototype)")}>Print invoices</ActionButton>
                </span>
              )} />
          )}
        </motion.div>
      </div>

      <BookCourierModal
        open={booking}
        orders={orders.filter((o) => checked.includes(String(o.id)))}
        onOpenChange={setBooking}
        onSubmit={(courier, ids) => { onBook(ids, courier); setBooking(false); setChecked([]) }}
      />
    </Page>
  )
}
