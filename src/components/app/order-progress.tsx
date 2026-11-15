import { cn } from "@/lib/utils"
import type { OrderStatus } from "@/data/orders"

const STEPS = ["Placed", "Confirmed", "Shipped", "Delivered"]

/** Four-step bar for a COD order. Cancelled and returned mark the step where it stopped. */
export function OrderProgress({ status }: { status: OrderStatus }) {
  const reached = { confirm: 0, ship: 1, transit: 2, delivered: 3, returned: 2, cancelled: 0 }[status]
  const failAt = status === "cancelled" ? 1 : status === "returned" ? 3 : -1
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Order progress">
      {STEPS.map((label, i) => {
        const failed = i === failAt
        const done = !failed && i <= reached
        return (
          <li key={label} className="flex flex-col gap-2">
            <span className={cn("h-1 rounded-full", failed ? "bg-destructive" : done ? "bg-primary" : "bg-muted")} />
            <span className={cn("text-xs font-medium", failed ? "text-destructive" : done ? "text-foreground" : "text-muted-foreground")}>
              {failed ? (status === "cancelled" ? "Cancelled" : "Returned") : label}
              <span className="sr-only">{done ? ", done" : failed ? "" : ", not yet"}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
