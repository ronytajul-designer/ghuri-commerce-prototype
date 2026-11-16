import { useState } from "react"
import { TruckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ChoiceCardGroup } from "@/components/app/choice-card-group"
import { Money } from "@/components/app/money"
import { type Courier, type Order, codDue } from "@/data/orders"

const COURIERS: Courier[] = ["Pathao", "Steadfast", "RedX", "Other"]
export const CANCEL_REASONS = ["Fake order", "Changed mind", "Out of stock", "Unreachable"] as const

export function BookCourierDialog({ open, orders, onOpenChange, onSubmit }: {
  open: boolean; orders: Order[]; onOpenChange: (v: boolean) => void; onSubmit: (c: Courier, ids: number[], opts: { weightKg: number; note: string }) => void
}) {
  const [courier, setCourier] = useState<Courier>("Pathao")
  const [weight, setWeight] = useState("0.5")
  const [note, setNote] = useState("")
  const [tried, setTried] = useState(false)
  const w = Number(weight.replace(/[০-৯]/g, (c) => String("০১২৩৪৫৬৭৮৯".indexOf(c))).trim())
  const weightBad = weight.trim() === "" || !Number.isFinite(w) || w <= 0 || w > 50
  const change = (v: boolean) => { if (!v) { setTried(false); setWeight("0.5"); setNote("") } onOpenChange(v) }
  const due = orders.reduce((s, o) => s + codDue(o), 0)
  return (
    <Dialog open={open} onOpenChange={change}>
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
          <Field data-invalid={(tried && weightBad) || undefined}>
            <FieldLabel htmlFor="weight">Weight (kg)</FieldLabel>
            <Input id="weight" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} aria-invalid={(tried && weightBad) || undefined} aria-describedby={tried && weightBad ? "weight-error" : undefined} />
            {tried && weightBad && <FieldError id="weight-error">Enter the parcel weight in kg, between 0.1 and 50, like 0.5.</FieldError>}
          </Field>
          <Field>
            <FieldLabel htmlFor="courier-note">Note for courier</FieldLabel>
            <Input id="courier-note" placeholder="Call before delivery" value={note} onChange={(e) => setNote(e.target.value)} />
            <FieldDescription>The tracking number fills in when {courier} accepts the booking.</FieldDescription>
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => change(false)}>Not now</Button>
          <Button onClick={() => { setTried(true); if (weightBad) { document.getElementById("weight")?.focus(); return } onSubmit(courier, orders.map((o) => o.id), { weightKg: w, note: note.trim() }); setTried(false); setWeight("0.5"); setNote("") }}><TruckIcon />Book {courier}</Button>
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
