import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  ArrowLeftIcon, CopyIcon, MessageCircleIcon, PhoneIcon, PrinterIcon, SearchIcon, TriangleAlertIcon, TruckIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ToneBadge } from "@/components/tone-badge"
import { cn } from "@/lib/utils"
import {
  type Courier, type Order, type OrderStatus, STAGES, STATUS, codDue, isValidBdPhone, riskOf, taka, total,
} from "@/data/orders"

const COURIERS: Courier[] = ["Pathao", "Steadfast", "RedX", "Other"]
const CANCEL_REASONS = ["Fake order", "Customer changed mind", "Out of stock", "Unreachable"]

type Props = { orders: Order[]; setOrders: (fn: (o: Order[]) => Order[]) => void }

export function OrdersPage({ orders, setOrders }: Props) {
  const [stage, setStage] = useState<OrderStatus>("confirm")
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<number | null>(() => (window.innerWidth >= 1024 ? 1011 : null))
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [dialog, setDialog] = useState<null | "cancel" | "book" | "bulk-book">(null)

  const counts = useMemo(
    () => Object.fromEntries(STAGES.map((s) => [s, orders.filter((o) => o.status === s).length])) as Record<OrderStatus, number>,
    [orders],
  )
  const q = query.trim().toLowerCase().replace(/^#/, "")
  const visible = orders.filter((o) => o.status === stage).filter((o) => !q || `${o.name} ${o.phone} ${o.id}`.toLowerCase().includes(q))
  const selected = orders.find((o) => o.id === selectedId) ?? null

  const update = (id: number, fn: (o: Order) => Order) => setOrders((all) => all.map((o) => (o.id === id ? fn(o) : o)))
  const log = (o: Order, text: string): Order => ({ ...o, log: [{ when: "Just now", text }, ...o.log] })

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
        <h1 className="text-base font-semibold">Orders</h1>
        {counts.confirm > 0 && <ToneBadge tone="warning" className="ml-auto">{counts.confirm} to confirm</ToneBadge>}
      </header>

      <div className="grid flex-1 lg:grid-cols-[minmax(360px,420px)_1fr]">
        {/* List */}
        <section aria-label="Orders list" className={cn("flex-col border-r bg-muted/30", selected ? "hidden lg:flex" : "flex")}>
          <div className="sticky top-14 z-[5] flex flex-col gap-3 border-b bg-background p-4">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                aria-label="Search orders"
                placeholder="Search name, phone or order #"
                className="h-10 pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Tabs value={stage} onValueChange={(v) => { setStage(v as OrderStatus); setChecked(new Set()) }}>
              <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none]">
                <TabsList className="w-max">
                  {STAGES.map((s) => (
                    <TabsTrigger key={s} value={s} className="gap-1.5">
                      {STATUS[s].label}
                      <span className="text-xs text-muted-foreground tabular-nums">{counts[s]}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Tabs>
          </div>

          {checked.size > 0 && (
            <div role="region" aria-label="Bulk actions" className="flex flex-wrap items-center gap-2 border-b bg-background px-4 py-2 text-sm">
              <span className="font-medium">{checked.size} selected</span>
              <div className="ml-auto flex gap-2">
                {stage === "ship" && (
                  <Button size="sm" onClick={() => setDialog("bulk-book")}><TruckIcon /> Book courier</Button>
                )}
                <Button size="sm" variant="outline" onClick={() => toast("Invoice PDF ready (prototype)")}><PrinterIcon /> Print</Button>
                <Button size="sm" variant="ghost" onClick={() => setChecked(new Set())}>Clear</Button>
              </div>
            </div>
          )}

          <ul className="flex flex-col gap-2 p-4">
            {visible.length === 0 && (
              <li className="py-10 text-center text-sm text-muted-foreground">No orders in “{STATUS[stage].label}”.</li>
            )}
            {visible.map((o) => {
              const risk = riskOf(o)
              const isSel = o.id === selectedId
              return (
                <li key={o.id}>
                  <Card className={cn("gap-0 py-0 transition-colors", isSel && "ring-2 ring-primary")}>
                    <div className="flex items-start gap-3 p-3">
                      <Checkbox
                        className="mt-1"
                        aria-label={`Select order #${o.id}`}
                        checked={checked.has(o.id)}
                        onCheckedChange={(v) =>
                          setChecked((prev) => { const n = new Set(prev); if (v) n.add(o.id); else n.delete(o.id); return n })
                        }
                      />
                      <button
                        type="button"
                        onClick={() => { setSelectedId(o.id); window.scrollTo(0, 0) }}
                        className="flex min-w-0 flex-1 flex-col gap-1 rounded-sm text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate font-medium">#{o.id} · {o.name}</span>
                          <span className="font-semibold tabular-nums">{taka(total(o))}</span>
                        </span>
                        <span className="flex flex-wrap gap-x-3 text-sm text-muted-foreground">
                          <span>{o.phone}</span>
                          <span>{o.district}{o.thana && `, ${o.thana}`}</span>
                          <span>{o.age}</span>
                        </span>
                        <span className="mt-1 flex flex-wrap gap-1.5">
                          <ToneBadge tone={o.pay === "COD" ? "muted" : "success"}>{o.pay === "COD" ? `COD ${taka(codDue(o))}` : o.pay}</ToneBadge>
                          {risk && <ToneBadge tone={risk.tone}>{risk.text}</ToneBadge>}
                          {o.noAnswer > 0 && <ToneBadge tone="warning">No answer ×{o.noAnswer}</ToneBadge>}
                          {o.consignment && <ToneBadge tone="info">{o.courier} {o.consignment}</ToneBadge>}
                        </span>
                      </button>
                    </div>
                  </Card>
                </li>
              )
            })}
          </ul>
        </section>

        {/* Detail */}
        <section aria-label={selected ? `Order #${selected.id}` : "Order detail"} className={cn("min-w-0 p-4 lg:p-6", selected ? "block" : "hidden lg:block")}>
          {!selected ? (
            <p className="py-20 text-center text-sm text-muted-foreground">Select an order to see details.</p>
          ) : (
            <OrderDetail
              order={selected}
              onBack={() => setSelectedId(null)}
              onConfirmed={() => { update(selected.id, (o) => log({ ...o, status: "ship" }, "Confirmed by phone (by Tajul)")); toast.success(`#${selected.id} confirmed. Moved to To ship`) }}
              onNoAnswer={() => { update(selected.id, (o) => log({ ...o, noAnswer: o.noAnswer + 1 }, `Call attempt ${o.noAnswer + 1}: no answer (by Tajul)`)); toast("Saved. Try again later") }}
              onCancel={() => setDialog("cancel")}
              onBook={() => setDialog("book")}
              onDelivered={() => { update(selected.id, (o) => log({ ...o, status: "delivered" }, `Delivered, ${taka(codDue(o))} to be settled by ${o.courier}`)); toast.success(`#${selected.id} delivered`) }}
              onReturned={() => { update(selected.id, (o) => log({ ...o, status: "returned", history: { ...o.history, returned: o.history.returned + 1 } }, "Marked returned (by Tajul)")); toast(`#${selected.id} returned`) }}
              onNote={(text) => { update(selected.id, (o) => log(o, `Note: ${text}`)); toast("Note added") }}
            />
          )}
        </section>
      </div>

      <CancelDialog
        open={dialog === "cancel"}
        order={selected}
        onOpenChange={(v) => !v && setDialog(null)}
        onSubmit={(reason) => {
          if (!selected) return
          update(selected.id, (o) => log({ ...o, status: "cancelled", cancelReason: reason }, `Cancelled: ${reason} (by Tajul)`))
          setDialog(null)
          toast(`#${selected.id} cancelled`)
        }}
      />
      <BookDialog
        open={dialog === "book" || dialog === "bulk-book"}
        orders={dialog === "bulk-book" ? orders.filter((o) => checked.has(o.id)) : selected ? [selected] : []}
        onOpenChange={(v) => !v && setDialog(null)}
        onSubmit={(courier, ids) => {
          setOrders((all) => all.map((o) => {
            if (!ids.includes(o.id)) return o
            const cid = `${courier.slice(0, 2).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`
            return log({ ...o, status: "transit", courier, consignment: cid }, `Booked with ${courier}, ${cid} (by Tajul)`)
          }))
          setDialog(null)
          setChecked(new Set())
          toast.success(`${ids.length} order${ids.length > 1 ? "s" : ""} booked with ${courier}`)
        }}
      />
    </div>
  )
}

function Stepper({ o }: { o: Order }) {
  const labels = ["Placed", "Confirmed", "Shipped", "Delivered"]
  const reached = { confirm: 0, ship: 1, transit: 2, delivered: 3, returned: 2, cancelled: 0 }[o.status]
  const failAt = o.status === "cancelled" ? 1 : o.status === "returned" ? 3 : -1
  return (
    <ol className="grid grid-cols-4 gap-1.5" aria-label="Order progress">
      {labels.map((l, i) => {
        const failed = i === failAt
        const done = i <= reached && !failed
        return (
          <li key={l} className="flex flex-col gap-1.5">
            <span className={cn("h-1.5 rounded-full", failed ? "bg-destructive" : done ? "bg-primary" : "bg-muted")} />
            <span className={cn("text-xs font-medium", failed ? "text-destructive" : done ? "text-foreground" : "text-muted-foreground")}>
              {failed ? (o.status === "cancelled" ? "Cancelled" : "Returned") : l}
              <span className="sr-only">{done ? " (done)" : failed ? "" : " (not yet)"}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

type DetailProps = {
  order: Order
  onBack: () => void
  onConfirmed: () => void
  onNoAnswer: () => void
  onCancel: () => void
  onBook: () => void
  onDelivered: () => void
  onReturned: () => void
  onNote: (text: string) => void
}

function OrderDetail({ order: o, onBack, onConfirmed, onNoAnswer, onCancel, onBook, onDelivered, onReturned, onNote }: DetailProps) {
  const [note, setNote] = useState("")
  const risk = riskOf(o)
  const firstName = o.name.split(" ")[0]
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Button variant="outline" size="sm" className="self-start lg:hidden" onClick={onBack}><ArrowLeftIcon /> Orders</Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">Order #{o.id}</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{o.age}</span>
            <ToneBadge tone={STATUS[o.status].tone}>{STATUS[o.status].label}</ToneBadge>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">{o.pay === "COD" ? "Courier collects" : "Paid"}</div>
          <div className="text-2xl font-semibold tabular-nums">{taka(o.pay === "COD" ? codDue(o) : total(o))}</div>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <Stepper o={o} />

          {o.status === "confirm" && (
            <div className="flex flex-col gap-3 rounded-lg border border-warning/40 bg-warning/10 p-4">
              <p className="font-medium">
                Call {firstName} to confirm before shipping
                {o.noAnswer > 0 && <span className="text-muted-foreground"> · {o.noAnswer} call{o.noAnswer > 1 && "s"} not answered</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="lg" asChild><a href={`tel:${o.phone}`}><PhoneIcon /> Call {o.phone}</a></Button>
                <Button size="lg" variant="outline" asChild><a href="#" aria-label={`Message ${firstName} on WhatsApp`}><MessageCircleIcon /> WhatsApp</a></Button>
                <Button size="lg" variant="outline" onClick={() => { navigator.clipboard?.writeText(o.phone); toast("Phone number copied") }}><CopyIcon /> Copy</Button>
              </div>
              {risk?.high && (
                <div role="note" className="flex gap-2 rounded-md border border-destructive/30 bg-background p-3 text-sm">
                  <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
                  <span><span className="font-medium text-destructive">High return risk: {risk.text}.</span> Ask for the delivery charge ({taka(o.fee)}) in advance by bKash before confirming.</span>
                </div>
              )}
              <Separator />
              <p className="text-sm text-muted-foreground">After the call, record what happened:</p>
              <div className="flex flex-wrap gap-2">
                <Button size="lg" onClick={onConfirmed}>Confirmed</Button>
                <Button size="lg" variant="outline" onClick={onNoAnswer}>No answer</Button>
                <Button size="lg" variant="outline" className="text-destructive" onClick={onCancel}>Cancel order</Button>
              </div>
            </div>
          )}
          {o.status === "ship" && (
            <div className="flex flex-wrap gap-2">
              <Button size="lg" onClick={onBook}><TruckIcon /> Book courier</Button>
              <Button size="lg" variant="outline" onClick={() => toast("Invoice PDF ready (prototype)")}><PrinterIcon /> Print invoice</Button>
              <Button size="lg" variant="outline" className="text-destructive" onClick={onCancel}>Cancel order</Button>
            </div>
          )}
          {o.status === "transit" && (
            <div className="flex flex-wrap gap-2">
              <Button size="lg" onClick={onDelivered}>Mark delivered</Button>
              <Button size="lg" variant="outline" onClick={onReturned}>Mark returned</Button>
              <Button size="lg" variant="ghost" asChild><a href="#">Track on {o.courier}</a></Button>
            </div>
          )}
          {o.cancelReason && <p className="text-sm text-muted-foreground">Cancel reason: <span className="font-medium text-foreground">{o.cancelReason}</span></p>}
          {o.consignment && o.status !== "confirm" && (
            <dl className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Courier</dt><dd>{o.courier}</dd>
              <dt className="text-muted-foreground">Consignment</dt><dd className="tabular-nums">{o.consignment}</dd>
            </dl>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <dl className="grid grid-cols-[88px_1fr] gap-x-3 gap-y-1.5 text-sm">
              <dt className="text-muted-foreground">Name</dt><dd>{o.name}</dd>
              <dt className="text-muted-foreground">Phone</dt>
              <dd>{isValidBdPhone(o.phone) ? o.phone : <ToneBadge tone="destructive">Invalid: “{o.phone}”</ToneBadge>}</dd>
              <dt className="text-muted-foreground">Address</dt>
              <dd>{o.address}<br />{o.thana && `${o.thana}, `}{o.district}</dd>
            </dl>
            <div className="grid grid-cols-3 gap-2 text-center" aria-label="History with this store">
              {([["orders", o.history.orders], ["delivered", o.history.delivered], ["returned", o.history.returned]] as const).map(([k, v]) => (
                <div key={k} className="rounded-md bg-muted px-2 py-2">
                  <div className={cn("text-lg font-semibold tabular-nums", k === "returned" && v > 0 && "text-destructive")}>{v}</div>
                  <div className="text-xs text-muted-foreground">{k}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Items</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {o.items.map((i) => (
              <div key={i.title} className="flex justify-between gap-2"><span>{i.title} × {i.qty}</span><span className="tabular-nums">{taka(i.qty * i.price)}</span></div>
            ))}
            <div className="flex justify-between gap-2 text-muted-foreground">
              <span>Delivery ({o.district === "Dhaka" ? "Inside Dhaka" : "Outside Dhaka"})</span><span className="tabular-nums">{taka(o.fee)}</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between text-base font-semibold"><span>Total</span><span className="tabular-nums">{taka(total(o))}</span></div>
            <span className="text-muted-foreground">Payment: {o.pay}</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Activity</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ol className="flex flex-col gap-3">
            {o.log.map((l, i) => (
              <li key={i} className="grid grid-cols-[12px_1fr] gap-3 text-sm">
                <span className="mt-1.5 size-2 rounded-full bg-muted-foreground/60" aria-hidden="true" />
                <span>{l.text}<span className="block text-xs text-muted-foreground">{l.when}</span></span>
              </li>
            ))}
          </ol>
          <Field>
            <FieldLabel htmlFor="note">Internal note</FieldLabel>
            <Textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            <FieldDescription>Only staff see this. Example: customer wants delivery after 5 pm.</FieldDescription>
          </Field>
          <Button variant="outline" className="self-start" disabled={!note.trim()} onClick={() => { onNote(note.trim()); setNote("") }}>Add note</Button>
        </CardContent>
      </Card>
    </div>
  )
}

function CancelDialog({ open, order, onOpenChange, onSubmit }: { open: boolean; order: Order | null; onOpenChange: (v: boolean) => void; onSubmit: (reason: string) => void }) {
  const [reason, setReason] = useState(CANCEL_REASONS[0])
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel order #{order?.id}?</DialogTitle>
          <DialogDescription>The reason is saved on the order and in the customer’s history.</DialogDescription>
        </DialogHeader>
        <FieldSet>
          <FieldLegend variant="label" className="sr-only">Reason</FieldLegend>
          <RadioGroup value={reason} onValueChange={setReason} className="grid grid-cols-2 gap-2">
            {CANCEL_REASONS.map((r) => (
              <FieldLabel key={r} htmlFor={`cr-${r}`} className="min-h-11 cursor-pointer rounded-md border px-3 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-muted">
                <Field orientation="horizontal"><RadioGroupItem id={`cr-${r}`} value={r} /><span>{r}</span></Field>
              </FieldLabel>
            ))}
          </RadioGroup>
        </FieldSet>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Keep order</Button>
          <Button variant="destructive" onClick={() => onSubmit(reason)}>Cancel order</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function BookDialog({ open, orders, onOpenChange, onSubmit }: { open: boolean; orders: Order[]; onOpenChange: (v: boolean) => void; onSubmit: (c: Courier, ids: number[]) => void }) {
  const [courier, setCourier] = useState<Courier>("Pathao")
  const due = orders.reduce((s, o) => s + codDue(o), 0)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book courier{orders.length > 1 ? ` for ${orders.length} orders` : orders[0] ? ` · #${orders[0].id}` : ""}</DialogTitle>
          <DialogDescription>COD to collect: <span className="font-semibold text-foreground">{taka(due)}</span> · {orders.map((o) => o.district).join(", ")}</DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <FieldSet>
            <FieldLegend variant="label">Courier</FieldLegend>
            <RadioGroup value={courier} onValueChange={(v) => setCourier(v as Courier)} className="grid grid-cols-2 gap-2">
              {COURIERS.map((c) => (
                <FieldLabel key={c} htmlFor={`cou-${c}`} className="min-h-11 cursor-pointer rounded-md border px-3 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-muted">
                  <Field orientation="horizontal"><RadioGroupItem id={`cou-${c}`} value={c} /><span>{c}</span></Field>
                </FieldLabel>
              ))}
            </RadioGroup>
          </FieldSet>
          <Field>
            <FieldLabel htmlFor="weight">Weight (kg)</FieldLabel>
            <Input id="weight" inputMode="decimal" defaultValue="0.5" />
          </Field>
          <Field>
            <FieldLabel htmlFor="cnote">Note for courier (optional)</FieldLabel>
            <Input id="cnote" placeholder="Call before delivery" />
            <FieldDescription>The consignment ID fills in when {courier} accepts. Not connected yet? Paste it later.</FieldDescription>
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Not now</Button>
          <Button onClick={() => onSubmit(courier, orders.map((o) => o.id))}><TruckIcon /> Book {courier}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
