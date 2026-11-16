import { useState } from "react"
import { TruckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ChoiceCardGroup } from "@/components/app/choice-card-group"
import { Money } from "@/components/app/money"
import { type Courier, type Order, codDue } from "@/data/orders"

const COURIERS: Courier[] = ["Pathao", "Steadfast", "RedX", "Other"]
export const CANCEL_REASONS = ["Fake order", "Changed mind", "Out of stock", "Unreachable"] as const

export function BookCourierDialog({ open, orders, onOpenChange, onSubmit }: {
  open: boolean; orders: Order[]; onOpenChange: (v: boolean) => void; onSubmit: (c: Courier, ids: number[]) => void
}) {
  const [courier, setCourier] = useState<Courier>("Pathao")
  const due = orders.reduce((s, o) => s + codDue(o), 0)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book courier{orders.length > 1 ? ` for ${orders.length} orders` : orders[0] ? ` for #${orders[0].id}` : ""}</DialogTitle>
          <DialogDescription>Courier collects <Money value={due} className="font-medium text-foreground" /> cash on delivery.</DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <FieldSet>
            <FieldLegend variant="label">Courier</FieldLegend>
            <ChoiceCardGroup name="courier" columns={2} value={courier} onValueChange={setCourier}
              choices={COURIERS.map((c) => ({ value: c, title: c }))} />
          </FieldSet>
          <Field>
            <FieldLabel htmlFor="weight">Weight (kg)</FieldLabel>
            <Input id="weight" inputMode="decimal" defaultValue="0.5" />
          </Field>
          <Field>
            <FieldLabel htmlFor="courier-note">Note for courier</FieldLabel>
            <Input id="courier-note" placeholder="Call before delivery" />
            <FieldDescription>The tracking number fills in when {courier} accepts the booking.</FieldDescription>
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Not now</Button>
          <Button onClick={() => onSubmit(courier, orders.map((o) => o.id))}><TruckIcon />Book {courier}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function CancelOrderDialog({ open, orderId, onOpenChange, onSubmit }: {
  open: boolean; orderId?: number; onOpenChange: (v: boolean) => void; onSubmit: (reason: string) => void
}) {
  const [reason, setReason] = useState<(typeof CANCEL_REASONS)[number]>("Fake order")
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel order #{orderId}?</DialogTitle>
          <DialogDescription>The reason is saved on the order and in the customer’s history.</DialogDescription>
        </DialogHeader>
        <FieldSet>
          <FieldLegend variant="label" className="sr-only">Reason</FieldLegend>
          <ChoiceCardGroup name="cancel" columns={2} value={reason} onValueChange={setReason}
            choices={CANCEL_REASONS.map((r) => ({ value: r, title: r }))} />
        </FieldSet>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Keep order</Button>
          <Button variant="destructive" onClick={() => onSubmit(reason)}>Cancel order</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
