import { useRef, useState } from "react"
import { toast } from "sonner"
import { motion } from "motion/react"
import {
  ArrowLeft, ChatCircle, ClockCounterClockwise, Copy, CreditCard, MapPin, Package, Phone, Printer, Truck, User, Warning, ListChecks,
} from "@phosphor-icons/react"
import { Button as ActionButton, IconButton } from "@/components/ui/action-button"
import { EmptyState } from "@/components/ui/empty-state"
import { Inset, Panel, Shell, ShellHeader } from "@/components/ui/surface"
import { TextArea } from "@/components/ui/text-field"
import { Page, PageColumn, PageGrid } from "@/components/app/page"
import { DescriptionList } from "@/components/app/description-list"
import { Money } from "@/components/app/money"
import {
  BookCourierModal, CancelOrderModal, NEGATIVE_TEXT, OrderProgressTuffui, OrderStatusPill, PaymentPill, Pill,
} from "@/components/app/order-bits-tuffui"
import { codDue, isValidBdPhone, riskOf, subtotal, total } from "@/data/orders"
import { EASE_OUT } from "@/lib/motion-tokens"
import { outline } from "@/lib/phosphor"
import { cn } from "@/lib/utils"
import { timeAgo, useApp, useOrderActions, useOrders } from "@/store/store"

/** ShellHeader truncates subtitles; let them wrap instead. */
const WRAP = "[&_p]:whitespace-normal [&_p]:overflow-visible [&_p]:text-clip"
const rise = (i: number) => ({ initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0, transition: { duration: 0.24, ease: EASE_OUT, delay: i * 0.04 } } })

export function OrderDetailTuffuiPage({ id }: { id: number }) {
  const o = useOrders().find((x) => x.id === id)
  const actions = useOrderActions()
  const [dialog, setDialogState] = useState<null | "cancel" | "book">(null)
  const { state } = useApp()
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
        <Shell><Panel className="py-8">
          <EmptyState title="Order not found" description={<a href="#orders-tuffui" className="underline">Back to orders</a>} />
        </Panel></Shell>
      </Page>
    )
  }
  const risk = riskOf(o)
  const first = o.name.split(" ")[0]
  const canCancel = o.status === "confirm" || o.status === "ship"
  const customerNote = state.customerNotes[o.phone]?.trim()

  const nextTitle = o.status === "confirm" ? `Call ${first} to confirm` : o.status === "ship" ? "Book a courier" : o.status === "transit" ? "On the way" : "Progress"
  const nextText =
    o.status === "confirm" ? (o.noAnswer > 0 ? `${o.noAnswer} call${o.noAnswer > 1 ? "s" : ""} not answered. Try again before cancelling.` : "Confirm by phone before you ship. It cuts fake orders and returns.")
    : o.status === "ship" ? "Confirmed by phone. Pick a courier to send it."
    : o.status === "transit" ? `With ${o.courier}, tracking ${o.consignment}.`
    : o.status === "delivered" ? "Delivered. Cash is settled by the courier."
    : o.status === "returned" ? "The customer refused or the courier could not deliver."
    : `Cancelled: ${o.cancelReason ?? "no reason given"}.`

  return (
    <Page>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-2">
          <IconButton size="md" icon={outline(ArrowLeft)} label="Back to orders" onClick={() => { window.location.hash = "orders-tuffui" }} />
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">#{o.id}</h1>
              <OrderStatusPill status={o.status} />
              <PaymentPill order={o} />
            </div>
            <p className="text-sm text-muted-foreground">{timeAgo(o.createdAt)} · {o.name}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionButton variant="secondary" size="md" icon={outline(Printer)} onClick={() => toast("Invoice ready to print (prototype)")}>Print invoice</ActionButton>
          {canCancel && <ActionButton variant="danger" size="md" className={NEGATIVE_TEXT} onClick={() => setDialog("cancel")}>Cancel order</ActionButton>}
        </div>
      </div>

      <PageGrid>
        <PageColumn>
          <motion.div {...rise(0)}>
            <Shell aria-label="Next step">
              <ShellHeader as="h2" className={WRAP} icon={outline(ListChecks)} title={nextTitle} subtitle={nextText} />
              <Panel className="flex flex-col gap-6 p-4">
                <OrderProgressTuffui status={o.status} />

                {o.status === "confirm" && risk?.high && (
                  <Inset className="flex items-start gap-2 bg-negative/10 p-4 text-sm">
                    <Warning className={cn("mt-0.5 size-4 shrink-0", NEGATIVE_TEXT)} aria-hidden="true" />
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className={cn("font-medium", NEGATIVE_TEXT)}>High return risk: {risk.text}</span>
                      <span>Ask for the delivery charge (<Money value={o.fee} />) in advance by bKash before confirming.</span>
                    </div>
                  </Inset>
                )}

                {o.status === "confirm" && (
                  <div className="flex flex-wrap gap-2">
                    <ActionButton variant="secondary" size="md" icon={outline(Phone)} onClick={() => { window.location.href = `tel:${o.phone}` }}>Call {o.phone}</ActionButton>
                    <ActionButton variant="secondary" size="md" icon={outline(ChatCircle)} aria-label={`Message ${first} on WhatsApp (opens in a new tab)`}
                      onClick={() => window.open(`https://wa.me/88${o.phone}`, "_blank", "noopener,noreferrer")}>WhatsApp</ActionButton>
                    <IconButton size="md" icon={outline(Copy)} label="Copy phone number" onClick={() => { navigator.clipboard?.writeText(o.phone).catch(() => {}); toast("Phone number copied") }} />
                  </div>
                )}

                {o.status === "confirm" && (
                  <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
                    <span className="w-full text-sm text-muted-foreground sm:w-auto sm:flex-1">After the call:</span>
                    <ActionButton variant="secondary" size="md" onClick={() => { actions.noAnswer(o.id); toast("Saved. Try again later") }}>No answer</ActionButton>
                    <ActionButton variant="primary" size="md" onClick={() => { actions.confirm(o.id); toast.success(`#${o.id} confirmed, moved to To ship`) }}>Confirmed</ActionButton>
                  </div>
                )}
                {o.status === "ship" && (
                  <div className="flex justify-end border-t border-border pt-4">
                    <ActionButton variant="primary" size="md" icon={outline(Truck)} onClick={() => setDialog("book")}>Book courier</ActionButton>
                  </div>
                )}
                {o.status === "transit" && (
                  <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
                    <ActionButton variant="secondary" size="md" onClick={() => { actions.returned(o.id); toast(`#${o.id} marked returned`) }}>Mark returned</ActionButton>
                    <ActionButton variant="primary" size="md" onClick={() => { actions.delivered(o.id); toast.success(`#${o.id} delivered`) }}>Mark delivered</ActionButton>
                  </div>
                )}
              </Panel>
            </Shell>
          </motion.div>

          <motion.div {...rise(1)}>
            <Shell>
              <ShellHeader as="h2" icon={outline(Package)} title="Items" />
              <Panel className="p-2">
                <table className="w-full border-separate border-spacing-0 text-[0.8125rem]">
                  <caption className="sr-only">Items</caption>
                  <thead>
                    <tr className="text-muted-foreground">
                      <th scope="col" className="px-2 py-2 text-left font-medium">Product</th>
                      <th scope="col" className="px-2 py-2 text-right font-medium">Qty</th>
                      <th scope="col" className="px-2 py-2 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {o.items.map((i, n) => (
                      <tr key={n} className={cn("[&>td:first-child]:rounded-l-xl [&>td:last-child]:rounded-r-xl", n % 2 === 1 && "bg-foreground/[0.025]")}>
                        <td className="px-2 py-2.5">{i.title}{i.variant && <div className="text-xs text-muted-foreground">{i.variant}</div>}</td>
                        <td className="px-2 py-2.5 text-right tabular-nums">{i.qty}</td>
                        <td className="px-2 py-2.5 text-right"><Money value={i.qty * i.price} /></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="[&_td]:border-t [&_td]:border-border">
                    <tr><td colSpan={2} className="px-2 py-2.5">Subtotal</td><td className="px-2 py-2.5 text-right"><Money value={subtotal(o)} /></td></tr>
                    <tr><td colSpan={2} className="px-2 py-2.5">Delivery ({o.district === "Dhaka" ? "Inside Dhaka" : "Outside Dhaka"})</td><td className="px-2 py-2.5 text-right"><Money value={o.fee} /></td></tr>
                    <tr><td colSpan={2} className="px-2 py-2.5 font-semibold">Total</td><td className="px-2 py-2.5 text-right font-semibold"><Money value={total(o)} /></td></tr>
                  </tfoot>
                </table>
              </Panel>
            </Shell>
          </motion.div>

          <motion.div {...rise(2)}>
            <Shell>
              <ShellHeader as="h2" className={WRAP} icon={outline(ClockCounterClockwise)} title="Activity" subtitle="Who did what, newest first." />
              <Panel className="flex flex-col gap-6 p-4">
                <ol className="flex flex-col gap-4">
                  {o.log.map((l, i) => (
                    <motion.li key={`${l.at}-${o.log.length - i}`} layout="position" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.2, ease: EASE_OUT } }}
                      className="grid grid-cols-[8px_minmax(0,1fr)] gap-4 text-sm">
                      <span className="mt-2 size-2 rounded-full bg-muted-foreground" aria-hidden="true" />
                      <div className="flex flex-col"><span>{l.text}</span><span className="text-xs text-muted-foreground">{timeAgo(l.at)}</span></div>
                    </motion.li>
                  ))}
                </ol>
                <div className="flex flex-col gap-4 border-t border-border pt-4">
                  <TextArea label="Internal note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} description="Only staff see this." />
                  <div className="flex justify-end">
                    <ActionButton variant="secondary" size="md" disabled={!note.trim()} onClick={() => { actions.note(o.id, note.trim()); setNote(""); toast("Note added") }}>Add note</ActionButton>
                  </div>
                </div>
              </Panel>
            </Shell>
          </motion.div>
        </PageColumn>

        <PageColumn>
          <motion.div {...rise(1)}>
            <Shell>
              <ShellHeader as="h2" icon={outline(User)} title="Customer"
                aside={<ActionButton variant="quiet" size="sm" className="text-foreground" onClick={() => { window.location.hash = `customer-${o.phone}` }}>View customer</ActionButton>} />
              <Panel className="flex flex-col gap-6 p-4">
                {customerNote && (
                  <Inset className="flex flex-col gap-1 p-4 text-sm">
                    <span className="font-medium">Your note</span>
                    <span className="whitespace-pre-line text-muted-foreground">{state.customerNotes[o.phone]}</span>
                  </Inset>
                )}
                <DescriptionList items={[
                  { term: "Name", detail: o.name },
                  { term: "Phone", detail: isValidBdPhone(o.phone) ? <span className="tabular-nums">{o.phone}</span> : <Pill tone="negative">Invalid: “{o.phone}”</Pill> },
                ]} />
                <dl className="grid grid-cols-3 gap-2">
                  {[
                    { label: "orders", value: o.history.orders, emphasis: false },
                    { label: "delivered", value: o.history.delivered, emphasis: false },
                    { label: "returned", value: o.history.returned, emphasis: o.history.returned > 0 },
                  ].map((s) => (
                    <Inset key={s.label} className="flex flex-col gap-1 px-2 py-2 text-center">
                      <dd className={cn("text-lg font-semibold tabular-nums", s.emphasis && NEGATIVE_TEXT)}>{s.value}</dd>
                      <dt className="order-last text-xs text-muted-foreground">{s.label}</dt>
                    </Inset>
                  ))}
                </dl>
              </Panel>
            </Shell>
          </motion.div>

          <motion.div {...rise(2)}>
            <Shell>
              <ShellHeader as="h2" icon={outline(MapPin)} title="Delivery" aside={o.consignment ? <Pill tone="brand">{o.courier}</Pill> : undefined} />
              <Panel className="p-4">
                <DescriptionList items={[
                  { term: "Address", detail: o.address },
                  { term: "Area", detail: [o.thana, o.district].filter(Boolean).join(", ") },
                  { term: "Zone", detail: o.district === "Dhaka" ? "Inside Dhaka" : "Outside Dhaka" },
                  ...(o.consignment ? [{ term: "Tracking", detail: <span className="tabular-nums">{o.consignment}</span> }] : []),
                ]} />
              </Panel>
            </Shell>
          </motion.div>

          <motion.div {...rise(3)}>
            <Shell>
              <ShellHeader as="h2" icon={outline(CreditCard)} title="Payment" />
              <Panel className="p-4">
                <DescriptionList items={[
                  { term: "Method", detail: o.pay },
                  ...(o.advancePaid ? [{ term: "Paid in advance", detail: <Money value={o.advancePaid} /> }] : []),
                  { term: o.pay === "COD" ? "To collect" : "Paid", detail: <Money value={o.pay === "COD" ? codDue(o) : total(o)} className="font-medium" /> },
                ]} />
              </Panel>
            </Shell>
          </motion.div>
        </PageColumn>
      </PageGrid>

      <CancelOrderModal open={dialog === "cancel"} orderId={o.id} onOpenChange={(v) => !v && setDialog(null)}
        onSubmit={(r) => { actions.cancel(o.id, r); setDialog(null); toast(`#${o.id} cancelled`) }} />
      <BookCourierModal open={dialog === "book"} orders={[o]} onOpenChange={(v) => !v && setDialog(null)}
        onSubmit={(c, ids) => { actions.book(ids, c); setDialog(null); toast.success(`#${o.id} booked with ${c}`) }} />
    </Page>
  )
}
