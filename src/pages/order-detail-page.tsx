import { useRef, useState } from "react"
import { toast } from "sonner"
import { CopyIcon, MessageCircleIcon, PhoneIcon, PrinterIcon, TriangleAlertIcon, TruckIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Page, PageColumn, PageGrid, PageHeader } from "@/components/app/page"
import { DescriptionList, StatGroup } from "@/components/app/description-list"
import { Money } from "@/components/app/money"
import { OrderProgress } from "@/components/app/order-progress"
import { OrderStatusBadge, PaymentBadge } from "@/components/app/status-badge"
import { BookCourierDialog, CancelOrderDialog } from "@/components/app/order-dialogs"
import { codDue, isValidBdPhone, riskOf, subtotal, total } from "@/data/orders"
import { timeAgo, useApp, useOrderActions, useOrders } from "@/store/store"

export function OrderDetailPage({ id }: { id: number }) {
  const o = useOrders().find((x) => x.id === id)
  const actions = useOrderActions()
  const [dialog, setDialogState] = useState<null | "cancel" | "book">(null)
  const { state } = useApp()
  // Dialogs are opened from state, so remember the trigger and return focus to it on close.
  const returnFocus = useRef<HTMLElement | null>(null)
  const setDialog = (d: null | "cancel" | "book") => {
    if (d) returnFocus.current = document.activeElement as HTMLElement | null
    else requestAnimationFrame(() => { const el = returnFocus.current; if (el?.isConnected) el.focus() })
    setDialogState(d)
  }
  const [note, setNote] = useState("")

  if (!o) {
    return (
      <Page>
        <Empty><EmptyHeader><EmptyTitle>Order not found</EmptyTitle><EmptyDescription><a href="#orders" className="underline">Back to orders</a></EmptyDescription></EmptyHeader></Empty>
      </Page>
    )
  }
  const risk = riskOf(o)
  const first = o.name.split(" ")[0]
  const canCancel = o.status === "confirm" || o.status === "ship"

  return (
    <Page>
      <PageHeader
        backHref="#orders"
        backLabel="Back to orders"
        title={`#${o.id}`}
        badge={<><OrderStatusBadge status={o.status} /><PaymentBadge order={o} /></>}
        description={`${timeAgo(o.createdAt)} · ${o.name}`}
        actions={
          <>
            <Button variant="outline" onClick={() => toast("Invoice ready to print (prototype)")}><PrinterIcon />Print invoice</Button>
            {canCancel && <Button variant="destructive" onClick={() => setDialog("cancel")}>Cancel order</Button>}
          </>
        }
      />

      <PageGrid>
        <PageColumn>
          {/* Next step */}
          <Card>
            <CardHeader>
              <CardTitle>{o.status === "confirm" ? `Call ${first} to confirm` : o.status === "ship" ? "Book a courier" : o.status === "transit" ? "On the way" : "Progress"}</CardTitle>
              <CardDescription>
                {o.status === "confirm" && (o.noAnswer > 0 ? `${o.noAnswer} call${o.noAnswer > 1 ? "s" : ""} not answered. Try again before cancelling.` : "Confirm by phone before you ship. It cuts fake orders and returns.")}
                {o.status === "ship" && "Confirmed by phone. Pick a courier to send it."}
                {o.status === "transit" && `With ${o.courier}, tracking ${o.consignment}.`}
                {o.status === "delivered" && "Delivered. Cash is settled by the courier."}
                {o.status === "returned" && "The customer refused or the courier could not deliver."}
                {o.status === "cancelled" && `Cancelled: ${o.cancelReason ?? "no reason given"}.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="gap-6">
              <OrderProgress status={o.status} />

              {o.status === "confirm" && risk?.high && (
                <Alert variant="destructive">
                  <TriangleAlertIcon />
                  <AlertTitle>High return risk: {risk.text}</AlertTitle>
                  <AlertDescription>Ask for the delivery charge (<Money value={o.fee} />) in advance by bKash before confirming.</AlertDescription>
                </Alert>
              )}

              {o.status === "confirm" && (
                <div className="flex flex-wrap gap-2">
                  <Button asChild><a href={`tel:${o.phone}`}><PhoneIcon />Call {o.phone}</a></Button>
                  <Button variant="outline" asChild><a href={`https://wa.me/88${o.phone}`} target="_blank" rel="noopener noreferrer" aria-label={`Message ${first} on WhatsApp (opens in a new tab)`}><MessageCircleIcon />WhatsApp</a></Button>
                  <Button variant="outline" size="icon" aria-label="Copy phone number" onClick={() => { navigator.clipboard?.writeText(o.phone).catch(() => {}); toast("Phone number copied") }}><CopyIcon /></Button>
                </div>
              )}
            </CardContent>
            {o.status === "confirm" && (
              <CardFooter className="flex-wrap gap-2 border-t">
                <span className="w-full text-sm text-muted-foreground sm:w-auto sm:flex-1">After the call:</span>
                <Button variant="outline" onClick={() => { actions.noAnswer(o.id); toast("Saved. Try again later") }}>No answer</Button>
                <Button onClick={() => { actions.confirm(o.id); toast.success(`#${o.id} confirmed, moved to To ship`) }}>Confirmed</Button>
              </CardFooter>
            )}
            {o.status === "ship" && (
              <CardFooter className="justify-end border-t">
                <Button onClick={() => setDialog("book")}><TruckIcon />Book courier</Button>
              </CardFooter>
            )}
            {o.status === "transit" && (
              <CardFooter className="justify-end gap-2 border-t">
                <Button variant="outline" onClick={() => { actions.returned(o.id); toast(`#${o.id} marked returned`) }}>Mark returned</Button>
                <Button onClick={() => { actions.delivered(o.id); toast.success(`#${o.id} delivered`) }}>Mark delivered</Button>
              </CardFooter>
            )}
          </Card>

          {/* Items */}
          <Card className="pb-0">
            <CardHeader><CardTitle>Items</CardTitle></CardHeader>
            <CardContent className="px-0">
              <Table className="[&_td:first-child]:pl-6 [&_td:last-child]:pr-6 [&_th:first-child]:pl-6 [&_th:last-child]:pr-6">
                <TableHeader>
                  <TableRow><TableHead>Product</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Amount</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {o.items.map((i, n) => (
                    <TableRow key={n}><TableCell className="whitespace-normal">{i.title}{i.variant && <div className="text-xs text-muted-foreground">{i.variant}</div>}</TableCell><TableCell className="text-right tabular-nums">{i.qty}</TableCell><TableCell className="text-right"><Money value={i.qty * i.price} /></TableCell></TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow><TableCell colSpan={2}>Subtotal</TableCell><TableCell className="text-right"><Money value={subtotal(o)} /></TableCell></TableRow>
                  <TableRow><TableCell colSpan={2}>Delivery ({o.district === "Dhaka" ? "Inside Dhaka" : "Outside Dhaka"})</TableCell><TableCell className="text-right"><Money value={o.fee} /></TableCell></TableRow>
                  <TableRow><TableCell colSpan={2} className="font-semibold">Total</TableCell><TableCell className="text-right font-semibold"><Money value={total(o)} /></TableCell></TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>

          {/* Activity */}
          <Card>
            <CardHeader><CardTitle>Activity</CardTitle><CardDescription>Who did what, newest first.</CardDescription></CardHeader>
            <CardContent className="gap-6">
              <ol className="flex flex-col gap-4">
                {o.log.map((l, i) => (
                  <li key={i} className="grid grid-cols-[8px_minmax(0,1fr)] gap-4 text-sm">
                    <span className="mt-2 size-2 rounded-full bg-muted-foreground/50" aria-hidden="true" />
                    <div className="flex flex-col"><span>{l.text}</span><span className="text-xs text-muted-foreground">{timeAgo(l.at)}</span></div>
                  </li>
                ))}
              </ol>
              <Separator />
              <Field>
                <FieldLabel htmlFor="note">Internal note</FieldLabel>
                <Textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
                <FieldDescription>Only staff see this.</FieldDescription>
              </Field>
            </CardContent>
            <CardFooter className="justify-end">
              <Button variant="outline" disabled={!note.trim()} onClick={() => { actions.note(o.id, note.trim()); setNote(""); toast("Note added") }}>Add note</Button>
            </CardFooter>
          </Card>
        </PageColumn>

        <PageColumn>
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
              <CardAction><Button variant="ghost" size="sm" asChild><a href={`#customer-${o.phone}`}>View customer</a></Button></CardAction>
            </CardHeader>
            <CardContent className="gap-6">
              {state.customerNotes[o.phone]?.trim() && (
                <Alert>
                  <AlertTitle>Your note</AlertTitle>
                  <AlertDescription className="whitespace-pre-line">{state.customerNotes[o.phone]}</AlertDescription>
                </Alert>
              )}
              <DescriptionList items={[
                { term: "Name", detail: o.name },
                { term: "Phone", detail: isValidBdPhone(o.phone) ? <span className="tabular-nums">{o.phone}</span> : <Badge variant="destructive">Invalid: “{o.phone}”</Badge> },
              ]} />
              <StatGroup stats={[
                { label: "orders", value: o.history.orders },
                { label: "delivered", value: o.history.delivered },
                { label: "returned", value: o.history.returned, emphasis: o.history.returned > 0 },
              ]} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery</CardTitle>
              {o.consignment && <CardAction><Badge variant="info">{o.courier}</Badge></CardAction>}
            </CardHeader>
            <CardContent>
              <DescriptionList items={[
                { term: "Address", detail: o.address },
                { term: "Area", detail: [o.thana, o.district].filter(Boolean).join(", ") },
                { term: "Zone", detail: o.district === "Dhaka" ? "Inside Dhaka" : "Outside Dhaka" },
                ...(o.consignment ? [{ term: "Tracking", detail: <span className="tabular-nums">{o.consignment}</span> }] : []),
                ...(o.weightKg ? [{ term: "Weight", detail: `${o.weightKg} kg` }] : []),
                ...(o.courierNote ? [{ term: "Courier note", detail: o.courierNote }] : []),
              ]} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
            <CardContent>
              <DescriptionList items={[
                { term: "Method", detail: o.pay },
                ...(o.advancePaid ? [{ term: "Paid in advance", detail: <Money value={o.advancePaid} /> }] : []),
                { term: o.pay === "COD" ? "To collect" : "Paid", detail: <Money value={o.pay === "COD" ? codDue(o) : total(o)} className="font-medium" /> },
              ]} />
            </CardContent>
          </Card>
        </PageColumn>
      </PageGrid>

      <CancelOrderDialog open={dialog === "cancel"} orderId={o.id} onOpenChange={(v) => !v && setDialog(null)}
        onSubmit={(r) => { actions.cancel(o.id, r); setDialog(null); toast(`#${o.id} cancelled`) }} />
      <BookCourierDialog open={dialog === "book"} orders={[o]} onOpenChange={(v) => !v && setDialog(null)}
        onSubmit={(c, ids, opts) => { actions.book(ids, c, opts); setDialog(null); toast.success(`#${o.id} booked with ${c}`) }} />
    </Page>
  )
}
