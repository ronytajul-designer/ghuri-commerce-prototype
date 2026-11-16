import { useMemo, useState } from "react"
import { toast } from "sonner"
import { PackageSearchIcon, PrinterIcon, SearchIcon, TruckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Page, PageHeader } from "@/components/app/page"
import { PaymentBadge, RiskBadge, orderStatusLabel } from "@/components/app/status-badge"
import { Money } from "@/components/app/money"
import { BookCourierDialog } from "@/components/app/order-dialogs"
import { type OrderStatus, STAGES, total } from "@/data/orders"
import { timeAgo, useOrderActions, useOrders } from "@/store/store"

export function OrdersListPage({ initialStage = "confirm" }: { initialStage?: OrderStatus }) {
  const orders = useOrders()
  const { book: onBook } = useOrderActions()
  const [stage, setStage] = useState<OrderStatus>(initialStage)
  const [query, setQuery] = useState("")
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [booking, setBooking] = useState(false)

  const counts = useMemo(
    () => Object.fromEntries(STAGES.map((s) => [s, orders.filter((o) => o.status === s).length])) as Record<OrderStatus, number>,
    [orders],
  )
  const q = query.trim().toLowerCase().replace(/^#/, "")
  const rows = orders.filter((o) => o.status === stage).filter((o) => !q || `${o.name} ${o.phone} ${o.id}`.toLowerCase().includes(q))
  const allChecked = rows.length > 0 && rows.every((r) => checked.has(r.id))
  const toggle = (id: number, on: boolean) => setChecked((prev) => { const n = new Set(prev); if (on) n.add(id); else n.delete(id); return n })
  const open = (id: number) => { window.location.hash = `order-${id}` }

  return (
    <Page>
      <PageHeader
        title="Orders"
        description="Confirm cash on delivery orders by phone, then book a courier."
        badge={counts.confirm > 0 ? <Badge variant="warning">{counts.confirm} to confirm</Badge> : undefined}
      />

      <div className="flex flex-col gap-4">
        <Tabs value={stage} onValueChange={(v) => { setStage(v as OrderStatus); setChecked(new Set()) }} className="min-w-0">
          <div className="overflow-x-auto [scrollbar-width:none]">
            <TabsList className="w-max min-w-full justify-start">
              {STAGES.map((s) => (
                <TabsTrigger key={s} value={s} className="flex-none">
                  {orderStatusLabel(s)}
                  <span className="text-xs text-muted-foreground tabular-nums">{counts[s]}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>

        <div className="flex flex-wrap items-center gap-2">
          <InputGroup className="w-full sm:max-w-80">
            <InputGroupAddon><SearchIcon /></InputGroupAddon>
            <InputGroupInput aria-label="Search orders" placeholder="Search name, phone or order #" value={query} onChange={(e) => setQuery(e.target.value)} />
          </InputGroup>
          {checked.size > 0 && (
            <div role="region" aria-label="Bulk actions" className="flex flex-wrap items-center gap-2 sm:ml-auto">
              <span className="text-sm text-muted-foreground">{checked.size} selected</span>
              {stage === "ship" && <Button size="sm" onClick={() => setBooking(true)}><TruckIcon />Book courier</Button>}
              <Button size="sm" variant="outline" onClick={() => toast("Invoices ready to print (prototype)")}><PrinterIcon />Print invoices</Button>
              <Button size="sm" variant="ghost" onClick={() => setChecked(new Set())}>Clear</Button>
            </div>
          )}
        </div>

        <Card className="gap-0 py-0">
          {rows.length === 0 ? (
            <Empty className="py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon"><PackageSearchIcon /></EmptyMedia>
                <EmptyTitle>No orders in {orderStatusLabel(stage)}</EmptyTitle>
                <EmptyDescription>{q ? "Try another name, phone number or order number." : "Orders move here as you work through them."}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              {/* Desktop: table */}
              <div className="hidden md:block"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"><Checkbox aria-label="Select all orders" checked={allChecked} onCheckedChange={(v) => setChecked(v ? new Set(rows.map((r) => r.id)) : new Set())} /></TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Signals</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((o) => (
                    <TableRow key={o.id} className="cursor-pointer" onClick={() => open(o.id)} data-state={checked.has(o.id) ? "selected" : undefined}>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox aria-label={`Select order #${o.id}`} checked={checked.has(o.id)} onCheckedChange={(v) => toggle(o.id, !!v)} />
                      </TableCell>
                      <TableCell>
                        <a href={`#order-${o.id}`} className="font-medium hover:underline" onClick={(e) => e.stopPropagation()}>#{o.id}</a>
                        <div className="text-xs text-muted-foreground">{timeAgo(o.createdAt)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{o.name}</div>
                        <div className="text-xs text-muted-foreground tabular-nums">{o.phone}</div>
                      </TableCell>
                      <TableCell>
                        <div>{o.district}</div>
                        <div className="text-xs text-muted-foreground">{o.thana || "No thana"}</div>
                      </TableCell>
                      <TableCell><PaymentBadge order={o} /></TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <RiskBadge order={o} />
                          {o.noAnswer > 0 && <Badge variant="warning">No answer ×{o.noAnswer}</Badge>}
                          {o.consignment && <Badge variant="info">{o.courier} {o.consignment}</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium"><Money value={total(o)} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>

              {/* Phone: stacked rows */}
              <ul className="divide-y md:hidden">
                {rows.map((o) => (
                  <li key={o.id} className="flex items-start gap-4 px-4 py-4">
                    <Checkbox className="mt-1" aria-label={`Select order #${o.id}`} checked={checked.has(o.id)} onCheckedChange={(v) => toggle(o.id, !!v)} />
                    <a href={`#order-${o.id}`} className="flex min-w-0 flex-1 flex-col gap-2 rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate font-medium">#{o.id} · {o.name}</span>
                        <Money value={total(o)} className="font-medium" />
                      </div>
                      <div className="flex flex-wrap gap-x-4 text-sm text-muted-foreground">
                        <span className="tabular-nums">{o.phone}</span>
                        <span>{o.district}</span>
                        <span>{timeAgo(o.createdAt)}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <PaymentBadge order={o} />
                        <RiskBadge order={o} />
                        {o.noAnswer > 0 && <Badge variant="warning">No answer ×{o.noAnswer}</Badge>}
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
        <p className="text-sm text-muted-foreground">{rows.length} order{rows.length === 1 ? "" : "s"}</p>
      </div>

      <BookCourierDialog
        open={booking}
        orders={orders.filter((o) => checked.has(o.id))}
        onOpenChange={setBooking}
        onSubmit={(courier, ids, opts) => { onBook(ids, courier, opts); setBooking(false); setChecked(new Set()) }}
      />
    </Page>
  )
}

