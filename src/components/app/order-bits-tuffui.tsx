import { useEffect, useState } from "react"
import { Truck } from "@phosphor-icons/react"
import { Button as ActionButton } from "@/components/ui/action-button"
import { Dialog } from "@/components/ui/modal-sheet"
import { Radio, RadioGroup } from "@/components/ui/choice-controls"
import { Segmented } from "@/components/ui/segmented-control"
import { StatusPill, type StatusTone } from "@/components/ui/status-pill"
import { TextField } from "@/components/ui/text-field"
import { Money } from "@/components/app/money"
import { orderStatusLabel } from "@/components/app/status-badge"
import { CANCEL_REASONS } from "@/components/app/order-dialogs"
import { type Courier, type Order, type OrderStatus, codDue, riskOf, taka } from "@/data/orders"
import { outline } from "@/lib/phosphor"
import { cn } from "@/lib/utils"

export const ORDER_TONE: Record<OrderStatus, StatusTone> = {
  confirm: "warning", ship: "brand", transit: "brand", delivered: "positive", returned: "negative", cancelled: "neutral",
}

/** Same contrast overrides as #home-tuffui: TuffUI's stock pill text fails 4.5:1 in light mode. */
export const READABLE: Record<StatusTone, string> = {
  warning: "text-warning-foreground",
  brand: "text-info-foreground",
  positive: "text-success-foreground",
  negative: "text-[oklch(0.45_0.2_27)] dark:text-destructive",
  neutral: "",
}
/** Readable red for text on the pale negative tint (danger buttons, errors, alerts). */
export const NEGATIVE_TEXT = "text-[oklch(0.45_0.2_27)] dark:text-[oklch(0.8_0.13_25)]"

export function Pill({ tone, className, children }: { tone: StatusTone; className?: string; children: React.ReactNode }) {
  return <StatusPill tone={tone} className={cn(READABLE[tone], className)}>{children}</StatusPill>
}

export function OrderStatusPill({ status }: { status: OrderStatus }) {
  return <Pill tone={ORDER_TONE[status]}>{orderStatusLabel(status)}</Pill>
}

export function PaymentPill({ order }: { order: Order }) {
  if (order.pay === "COD") return <Pill tone="neutral">COD {taka(codDue(order))}</Pill>
  return <Pill tone="positive">{order.pay}</Pill>
}

export function RiskPill({ order }: { order: Order }) {
  const r = riskOf(order)
  if (!r) return null
  const tone: StatusTone = r.tone === "destructive" ? "negative" : r.tone === "success" ? "positive" : "neutral"
  return <Pill tone={tone}>{r.text}</Pill>
}

const STEPS = ["Placed", "Confirmed", "Shipped", "Delivered"]

/** Four-step bar for a COD order. Cancelled and returned mark the step where it stopped. */
export function OrderProgressTuffui({ status }: { status: OrderStatus }) {
  const reached = { confirm: 0, ship: 1, transit: 2, delivered: 3, returned: 2, cancelled: 0 }[status]
  const failAt = status === "cancelled" ? 1 : status === "returned" ? 3 : -1
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Order progress">
      {STEPS.map((label, i) => {
        const failed = i === failAt
        const done = !failed && i <= reached
        return (
          <li key={label} className="flex flex-col gap-2">
            <span className={cn("h-1.5 rounded-full transition-colors duration-300", failed ? "bg-destructive" : done ? "bg-foreground" : "bg-foreground/25")} />
            <span className={cn("text-xs font-medium", failed ? NEGATIVE_TEXT : done ? "text-foreground" : "text-muted-foreground")}>
              {failed ? (status === "cancelled" ? "Cancelled" : "Returned") : label}
              <span className="sr-only">{done ? ", done" : failed ? "" : ", not yet"}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

const COURIERS: Courier[] = ["Pathao", "Steadfast", "RedX", "Other"]

export function BookCourierModal({ open, orders, onOpenChange, onSubmit }: {
  open: boolean; orders: Order[]; onOpenChange: (v: boolean) => void; onSubmit: (c: Courier, ids: number[]) => void
}) {
  const [courier, setCourier] = useState<Courier>("Pathao")
  const [weight, setWeight] = useState("0.5")
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { if (open) { setWeight("0.5"); setNote(""); setError(null) } }, [open])
  const due = orders.reduce((s, o) => s + codDue(o), 0)

  const validate = (v: string) => {
    const n = Number(v.trim())
    if (!v.trim()) return "Enter the parcel weight in kg, for example 0.5."
    if (!Number.isFinite(n) || n <= 0) return "Weight must be a number above 0, for example 0.5."
    if (n > 30) return "Couriers take parcels up to 30 kg. Split it into smaller parcels."
    return null
  }
  const submit = () => {
    const e = validate(weight)
    setError(e)
    if (e) { document.querySelector<HTMLInputElement>('input[name="weight"]')?.focus(); return }
    onSubmit(courier, orders.map((o) => o.id))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}
      title={`Book courier${orders.length > 1 ? ` for ${orders.length} orders` : orders[0] ? ` for #${orders[0].id}` : ""}`}
      description={<>Courier collects <Money value={due} className="font-medium text-foreground" /> cash on delivery.</>}
      footer={<>
        <ActionButton variant="secondary" size="md" onClick={() => onOpenChange(false)}>Not now</ActionButton>
        <ActionButton variant="primary" size="md" icon={outline(Truck)} onClick={submit}>Book {courier}</ActionButton>
      </>}>
      <form className="flex flex-col gap-4 px-2.5 pb-2" onSubmit={(e) => { e.preventDefault(); submit() }} noValidate>
        <div className="flex flex-col gap-1.5">
          <span aria-hidden="true" className="px-1 text-[0.8125rem] font-medium">Courier</span>
          <Segmented label="Courier" size="md" className="w-full [&>button]:flex-1" value={courier} onValueChange={setCourier}
            options={COURIERS.map((c) => ({ value: c, label: c }))} />
        </div>
        <TextField name="weight" label="Weight (kg)" inputMode="decimal" value={weight} error={error}
          onChange={(e) => { setWeight(e.target.value); if (error) setError(validate(e.target.value)) }}
          onBlur={() => setError(validate(weight))} />
        <TextField label="Note for courier" placeholder="Call before delivery" value={note} onChange={(e) => setNote(e.target.value)}
          description={`The tracking number fills in when ${courier} accepts the booking.`} />
      </form>
    </Dialog>
  )
}

export function CancelOrderModal({ open, orderId, onOpenChange, onSubmit }: {
  open: boolean; orderId?: number; onOpenChange: (v: boolean) => void; onSubmit: (reason: string) => void
}) {
  const [reason, setReason] = useState<string>(CANCEL_REASONS[0])
  useEffect(() => { if (open) setReason(CANCEL_REASONS[0]) }, [open])
  return (
    <Dialog open={open} onOpenChange={onOpenChange} size="sm"
      title={`Cancel order #${orderId}?`}
      description="The reason is saved on the order and in the customer’s history."
      footer={<>
        <ActionButton variant="secondary" size="md" onClick={() => onOpenChange(false)}>Keep order</ActionButton>
        <ActionButton variant="danger" size="md" className={NEGATIVE_TEXT} onClick={() => onSubmit(reason)}>Cancel order</ActionButton>
      </>}>
      <RadioGroup label="Reason" value={reason} onValueChange={setReason} className="px-3.5 pb-2">
        {CANCEL_REASONS.map((r) => <Radio key={r} value={r} label={r} />)}
      </RadioGroup>
    </Dialog>
  )
}
