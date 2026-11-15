import { Badge } from "@/components/ui/badge"
import { type Order, type OrderStatus, riskOf, taka, codDue } from "@/data/orders"

type Variant = "success" | "warning" | "info" | "destructive" | "muted"

const ORDER_STATUS: Record<OrderStatus, { label: string; variant: Variant }> = {
  confirm: { label: "To confirm", variant: "warning" },
  ship: { label: "To ship", variant: "info" },
  transit: { label: "In transit", variant: "info" },
  delivered: { label: "Delivered", variant: "success" },
  returned: { label: "Returned", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "muted" },
}

export const orderStatusLabel = (s: OrderStatus) => ORDER_STATUS[s].label

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const s = ORDER_STATUS[status]
  return <Badge variant={s.variant}>{s.label}</Badge>
}

export function PaymentBadge({ order }: { order: Order }) {
  if (order.pay === "COD") return <Badge variant="muted">COD {taka(codDue(order))}</Badge>
  return <Badge variant="success">{order.pay}</Badge>
}

export function RiskBadge({ order }: { order: Order }) {
  const r = riskOf(order)
  if (!r) return null
  const variant: Variant = r.tone === "destructive" ? "destructive" : r.tone === "success" ? "success" : "muted"
  return <Badge variant={variant}>{r.text}</Badge>
}
