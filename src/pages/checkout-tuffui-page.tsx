import { useRef, useState } from "react"
import { TUFF } from "@/components/app/page-tuffui"
import { motion, AnimatePresence } from "motion/react"
import { ArrowCounterClockwise, Check, Lock, ShoppingBag, Truck, Wallet as WalletIcon, WarningCircle } from "@phosphor-icons/react"
import { Button as ActionButton } from "@/components/ui/action-button"
import { RadioGroup, Radio } from "@/components/ui/choice-controls"
import { EmptyState } from "@/components/ui/empty-state"
import { Sheet } from "@/components/ui/modal-sheet"
import { SegmentedTabsTuffui } from "@/components/app/tabs-tuffui"
import { Select } from "@/components/ui/select-field"
import { Inset, Panel, Shell, ShellHeader } from "@/components/ui/surface"
import { TextArea, TextField } from "@/components/ui/text-field"
import { NEGATIVE_TEXT, Pill } from "@/components/app/order-bits-tuffui"
import { Money } from "@/components/app/money"
import { ProductThumb } from "@/components/app/product-thumb"
import { DISTRICTS, cleanPhone, isValidBdPhone, thanasOf, toLatinDigits } from "@/lib/bd"
import { enter } from "@/lib/motion-tokens"
import { cn } from "@/lib/utils"
import { nextOrderId, placeOrder, stockFor, taka, useApp, zoneFor } from "@/store/store"
import type { AppState, Zone } from "@/store/types"
import { cartLines } from "@/pages/storefront-pages"
import { StoreFrameTuffui, go } from "@/pages/storefront-tuffui-pages"

type Pay = "cod" | "bkash" | "nagad"
type Wallet = "bkash" | "nagad"
type FieldKey = "phone" | "email" | "name" | "district" | "thana" | "address" | "trx"
type Line = ReturnType<typeof cartLines>[number]
type Placed = { id: number; phone: string; district: string; eta?: string; total: number; paid: number; fee: number; pay: Pay }

const WALLET_NAME: Record<Wallet, string> = { bkash: "bKash", nagad: "Nagad" }
const FIELD_ORDER: FieldKey[] = ["phone", "email", "name", "district", "thana", "address", "trx"]
const FIELD_LABEL: Record<FieldKey, string> = {
  phone: "Mobile number", email: "Email", name: "Full name", district: "District", thana: "Thana", address: "Full address", trx: "Transaction ID",
}

type Quote = { known: boolean; fee: number; zone?: Zone; free: "none" | "no-zones" | "threshold"; uncovered: boolean }

function quoteFor(state: AppState, district: string, sub: number): Quote {
  if (state.zones.length === 0) return { known: true, fee: 0, free: "no-zones", uncovered: false }
  if (!district) return { known: false, fee: 0, free: "none", uncovered: false }
  const zone = zoneFor(state.zones, district)
  const overFree = state.freeDeliveryOver != null && sub >= state.freeDeliveryOver
  if (overFree) return { known: true, fee: 0, zone, free: "threshold", uncovered: false }
  if (!zone) return { known: true, fee: 0, free: "none", uncovered: true }
  return { known: true, fee: zone.fee, zone, free: "none", uncovered: false }
}

function walletLine(state: AppState, w: Wallet, amount: number) {
  const acc = state.payments[w]
  return <>Send <Money value={amount} className="font-medium" /> to {WALLET_NAME[w]} <span className="font-medium tabular-nums">{acc.number}</span> ({acc.type === "merchant" ? "Merchant: Payment" : "Personal: Send Money"}) then enter the transaction ID.</>
}

function ErrorBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={enter} className="flex gap-2 rounded-2xl bg-negative/10 p-4 text-sm">
      <WarningCircle className={cn("mt-0.5 size-4 shrink-0", NEGATIVE_TEXT)} aria-hidden="true" />
      <div className="flex flex-col gap-1"><span className={cn("font-medium", NEGATIVE_TEXT)}>{title}</span>{children}</div>
    </motion.div>
  )
}

/* ---------- Order summary ---------- */

function SummaryBody({ lines, sub, quote, advance, total }: { lines: Line[]; sub: number; quote: Quote; advance: number; total: number }) {
  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-4">
        {lines.map((l, i) => (
          <li key={i} className="flex items-center gap-4">
            <div className="relative">
              <ProductThumb product={l.product} className="size-16 rounded-xl border-0" />
              <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-foreground text-xs font-medium text-background tabular-nums" aria-hidden="true">{l.line.qty}</span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">{l.product.title}</span>
              <span className="text-sm text-muted-foreground">{[l.variant?.label, `Qty ${l.line.qty}`].filter(Boolean).join(" · ")}</span>
            </div>
            <Money value={l.price * l.line.qty} className="text-sm" />
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2 border-t border-foreground/[0.08] pt-4 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><Money value={sub} /></div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Delivery{quote.free === "no-zones" ? ": to be confirmed" : ""}{quote.zone && quote.free === "none" ? ` (${quote.zone.name})` : ""}</span>
          {!quote.known ? <span className="text-muted-foreground">Pick district</span>
            : quote.free === "no-zones" ? <span className="text-muted-foreground">To be confirmed</span>
            : quote.free === "threshold" ? <Pill tone="positive">Free delivery</Pill>
            : quote.uncovered ? <span className="text-muted-foreground">Seller confirms</span>
            : <Money value={quote.fee} />}
        </div>
        {advance > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Delivery charge paid now</span><span className="tabular-nums">−{taka(advance)}</span></div>}
      </div>
      <div className="flex items-baseline justify-between border-t border-foreground/[0.08] pt-4">
        <span className="font-semibold">{advance > 0 ? "Pay on delivery" : "Total"}</span>
        <Money value={total - advance} className="text-xl font-semibold" />
      </div>
      {advance > 0 && <p className="-mt-2 text-right text-xs text-muted-foreground">Order total <Money value={total} /></p>}
    </div>
  )
}

/* ---------- Page ---------- */

export function CheckoutTuffuiPage() {
  const { state, set } = useApp()
  const lines = cartLines(state)
  const [placed, setPlaced] = useState<Placed | null>(null)

  if (placed) return <Confirmation {...placed} />
  if (lines.length === 0) {
    return (
      <StoreFrameTuffui back={{ href: "store-tuffui", label: "Back to store" }}>
        <main className={cn(TUFF.frame, TUFF.block)}>
          <h1 className="sr-only">Checkout</h1><Shell className={TUFF.narrow}><Panel><EmptyState icon={ShoppingBag} title="Your cart is empty" action={{ label: "Shop now", onClick: () => go("store-tuffui") }} /></Panel></Shell>
        </main>
      </StoreFrameTuffui>
    )
  }
  return <CheckoutForm state={state} lines={lines} onPlace={(input, done) => {
    let id = 0
    set((s) => { const r = placeOrder(s, input); id = r.id; return r.state })
    done(id || nextOrderId(state))
    window.scrollTo(0, 0)
  }} onPlaced={setPlaced} />
}

type PlaceInput = Parameters<typeof placeOrder>[1]

function CheckoutForm({ state, lines, onPlace, onPlaced }: {
  state: AppState
  lines: Line[]
  onPlace: (input: PlaceInput, done: (id: number) => void) => void
  onPlaced: (p: Placed) => void
}) {
  const pm = state.payments
  const wallets = (["bkash", "nagad"] as Wallet[]).filter((w) => pm[w].enabled && pm[w].number)
  const payOptions: Pay[] = [...(pm.cod || wallets.length === 0 ? ["cod" as Pay] : []), ...wallets]

  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [district, setDistrict] = useState("")
  const [thana, setThana] = useState("")
  const [address, setAddress] = useState("")
  const [trx, setTrx] = useState("")
  const [note, setNote] = useState("")
  const [noteOpen, setNoteOpen] = useState(false)
  const [pay, setPay] = useState<Pay>(payOptions[0])
  const [advWallet, setAdvWallet] = useState<Wallet>(wallets[0] ?? "bkash")
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({})
  const [tried, setTried] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [stockIssue, setStockIssue] = useState<{ title: string; left: number }[] | null>(null)
  const touch = (k: FieldKey) => setTouched((t) => (t[k] ? t : { ...t, [k]: true }))
  const boxes = useRef<Partial<Record<FieldKey, HTMLDivElement | null>>>({})
  const box = (k: FieldKey) => (el: HTMLDivElement | null) => { boxes.current[k] = el }
  const focusField = (k: FieldKey) => {
    const el = boxes.current[k]?.querySelector<HTMLElement>("input, textarea, button")
    el?.focus(); el?.scrollIntoView({ block: "center", behavior: "smooth" })
  }

  const sub = lines.reduce((s, l) => s + l.price * l.line.qty, 0)
  const quote = quoteFor(state, district, sub)
  const total = sub + quote.fee
  const advanceMode = pay === "cod" && pm.cod && pm.advanceDelivery && wallets.length > 0 && quote.fee > 0
  const advanceOffered = pm.cod && pm.advanceDelivery && wallets.length > 0 && (!quote.known || quote.fee > 0)
  const advance = advanceMode ? quote.fee : 0
  const needsTrx = pay !== "cod" || advanceMode
  const payWallet: Wallet = pay === "cod" ? advWallet : pay

  const clean = cleanPhone(phone)
  const cleanTrx = toLatinDigits(trx).trim().replace(/\s+/g, "").toUpperCase()

  const errors: Partial<Record<FieldKey, string>> = {}
  if (!phone.trim()) errors.phone = "Enter your mobile number."
  else if (!isValidBdPhone(clean)) errors.phone = "Enter an 11-digit number starting with 01, for example 01711223344."
  if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = "Enter an email like name@example.com, or leave it empty."
  if (!name.trim()) errors.name = "Enter the name of the person receiving the parcel."
  if (!district) errors.district = "Select your district."
  if (!thana) errors.thana = district ? "Select your thana." : "Select your district first, then your thana."
  if (address.trim().length < 5) errors.address = address.trim() ? "Add more detail: house, road and area." : "Enter your house, road and area."
  if (needsTrx) {
    if (!cleanTrx) errors.trx = `Enter the transaction ID from your ${WALLET_NAME[payWallet]} SMS.`
    else if (!/^[A-Z0-9]{8,10}$/.test(cleanTrx)) errors.trx = "The transaction ID is 8 to 10 letters or digits, for example 8N7A6D5K3P."
  }
  const show = (k: FieldKey) => (tried || touched[k]) && errors[k] ? errors[k] : undefined
  const invalidKeys = FIELD_ORDER.filter((k) => errors[k])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setTried(true)
    const short = lines.filter((l) => l.line.qty > stockFor(l.product, l.variant?.key))
    if (short.length) { setStockIssue(short.map((l) => ({ title: [l.product.title, l.variant?.label].filter(Boolean).join(", "), left: stockFor(l.product, l.variant?.key) }))); return }
    setStockIssue(null)
    if (invalidKeys.length) { focusField(invalidKeys[0]); return }
    const payLabel = pay === "cod" ? "COD" : pay === "bkash" ? "bKash paid" : "Nagad paid"
    const noteParts = [
      needsTrx ? `${WALLET_NAME[payWallet]} ${advanceMode ? `advance ${taka(advance)}` : `payment ${taka(total)}`}, TrxID ${cleanTrx}` : "",
      email.trim() ? `Email: ${email.trim()}` : "",
      note.trim(),
    ].filter(Boolean)
    const input: PlaceInput = {
      name: name.trim(), phone: clean, district, thana, address: address.trim(), fee: quote.fee,
      pay: payLabel, advancePaid: advanceMode ? advance : undefined, note: noteParts.join(" · ") || undefined,
      items: lines.map((l) => ({ productId: l.product.id, title: l.product.title, variant: l.variant?.label, qty: l.line.qty, price: l.price })),
    }
    const snapshot = { phone: clean, district, eta: quote.zone?.eta, total, fee: quote.fee, pay, paid: pay === "cod" ? advance : total }
    onPlace(input, (id) => onPlaced({ ...snapshot, id }))
  }

  const codDescription = advanceOffered
    ? quote.known
      ? <>Pay <Money value={quote.fee} /> delivery charge now by {wallets.map((w) => WALLET_NAME[w]).join(" or ")}, the rest on delivery.</>
      : <>Pay the delivery charge now by {wallets.map((w) => WALLET_NAME[w]).join(" or ")}, the rest on delivery.</>
    : quote.known ? <>Pay <Money value={total} /> when it arrives.</> : <>Pay in cash when it arrives.</>

  const placeLabel = quote.known ? <>Place order · <Money value={advanceMode ? advance : total} />{advanceMode ? " now" : ""}</> : <>Place order</>
  const alerts = (
    <>
      {stockIssue && (
        <ErrorBox title="Not enough stock to place your order">
          <ul className="list-disc pl-4">{stockIssue.map((x) => <li key={x.title}>{x.title}: {x.left === 0 ? "sold out" : `only ${x.left} left`}</li>)}</ul>
          <a href="#cart-tuffui" className="underline underline-offset-4">Change quantities in your cart</a>
        </ErrorBox>
      )}
      {tried && invalidKeys.length > 0 && (
        <ErrorBox title={`Fix ${invalidKeys.length === 1 ? "this" : `these ${invalidKeys.length}`} to place your order`}>
          <ul className="list-disc pl-4">
            {invalidKeys.map((k) => <li key={k}><a href={`#${k}`} className="underline underline-offset-4" onClick={(e) => { e.preventDefault(); focusField(k) }}>{FIELD_LABEL[k]}</a></li>)}
          </ul>
        </ErrorBox>
      )}
    </>
  )
  const actions = (
    <div className="flex flex-col gap-4">
      <div className="hidden flex-col gap-4 lg:flex">{alerts}</div>
      <ActionButton type="submit" variant="primary" size="md" className="h-12 w-full text-base">{placeLabel}</ActionButton>
      <p className="text-center text-sm text-muted-foreground">
        {pay !== "cod" ? `Paid by ${WALLET_NAME[pay]}. The seller checks your transaction ID and calls to confirm.`
          : advanceMode ? "The rest is paid in cash on delivery. The seller calls to confirm first."
          : "You pay nothing now. The seller calls to confirm first."}
      </p>
      {(state.store.returnPolicy || state.store.phone) && (
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          {state.store.returnPolicy && <span className="flex gap-2"><ArrowCounterClockwise className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{state.store.returnPolicy}</span>}
          {state.store.phone && <span>Need help? Call <a href={`tel:${state.store.phone}`} className="text-foreground underline underline-offset-4">{state.store.phone}</a></span>}
        </div>
      )}
    </div>
  )

  const deliveryNote = (
    <Inset aria-live="polite" className="flex gap-2 p-4 text-sm">
      <Truck className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      {!quote.known ? <span className="text-muted-foreground">Pick your district to see the delivery charge</span>
        : quote.free === "no-zones" ? <span>The seller will confirm the delivery charge by phone</span>
        : quote.free === "threshold" ? <span className="flex flex-wrap items-center gap-2"><Pill tone="positive">Free delivery</Pill>{quote.zone ? <>{quote.zone.name} · arrives in {quote.zone.eta}</> : <>Orders over <Money value={state.freeDeliveryOver ?? 0} /></>}</span>
        : quote.uncovered ? <span>The seller confirms the delivery charge for {district} when they call.</span>
        : <span><span className="font-medium">{quote.zone!.name}</span> · <Money value={quote.fee} /> delivery · arrives in {quote.zone!.eta}</span>}
    </Inset>
  )

  const phoneDesc = !errors.phone && touched.phone
    ? <span className="inline-flex items-center gap-1"><Check className="size-3.5" aria-hidden="true" />The courier will call {clean}.</span>
    : "Bangla digits work too."

  return (
    <StoreFrameTuffui back={{ href: "cart-tuffui", label: "Back to cart" }}>
      <div className="flex-1">
        <form noValidate onSubmit={submit} className={cn(TUFF.frame, TUFF.block, TUFF.grid)}>
          <div className="flex flex-wrap items-center justify-between gap-4 lg:col-span-2">
            <h1 className="text-3xl font-semibold tracking-tighter">Checkout</h1>
            <span className="flex items-center gap-2 text-sm text-muted-foreground"><Lock className="size-4" aria-hidden="true" />Secure checkout</span>
          </div>

          {(stockIssue || (tried && invalidKeys.length > 0)) && <div className="flex flex-col gap-4 lg:hidden">{alerts}</div>}
          {/* Mobile: summary opens in a bottom sheet */}
          <Sheet side="bottom" open={summaryOpen} onOpenChange={setSummaryOpen} title="Order summary"
            trigger={
              <button type="button" className="flex w-full items-center justify-between gap-2 rounded-[1.375rem] bg-surface px-4 py-4 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden">
                <span className="flex items-center gap-2"><ShoppingBag className="size-4" aria-hidden="true" />Show order summary</span>
                <Money value={total - advance} />
              </button>
            }>
            <div className="p-4"><SummaryBody lines={lines} sub={sub} quote={quote} advance={advance} total={total} /></div>
          </Sheet>

          <div className="flex min-w-0 flex-col gap-6">
            <Shell>
              <ShellHeader title="Contact" subtitle="The seller and courier call this number." as="h2" />
              <Panel className="flex flex-col gap-4 p-4">
                <div ref={box("phone")}><TextField label="Mobile number" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="01XXXXXXXXX" required
                  value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => touch("phone")} error={show("phone")} description={phoneDesc} /></div>
                <div ref={box("email")}><TextField label={<>Email <span className="font-normal text-muted-foreground">(optional)</span></>} type="email" autoComplete="email"
                  value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => touch("email")} error={show("email")} /></div>
              </Panel>
            </Shell>

            <Shell>
              <ShellHeader title="Delivery address" as="h2" />
              <Panel className="flex flex-col gap-4 p-4">
                <div ref={box("name")}><TextField label="Full name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} onBlur={() => touch("name")} error={show("name")} /></div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div ref={box("district")} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) touch("district") }}>
                    <Select label="District" placeholder="Select district" value={district} onValueChange={(v) => { setDistrict(v); setThana("") }}
                      options={DISTRICTS.map((x) => ({ value: x.name, label: x.name }))} error={show("district")} />
                  </div>
                  <div ref={box("thana")} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) touch("thana") }}>
                    <Select key={district} label="Thana" placeholder={district ? "Select thana" : "Pick district first"} value={thana} onValueChange={setThana}
                      options={thanasOf(district).map((t) => ({ value: t, label: t }))} error={show("thana")} />
                  </div>
                </div>
                <div ref={box("address")}><TextArea label="Full address" rows={3} autoComplete="street-address" required placeholder="House 12, Road 5, near the school"
                  value={address} onChange={(e) => setAddress(e.target.value)} onBlur={() => touch("address")} error={show("address")} description="House, road, area and a nearby landmark." /></div>
                {deliveryNote}
              </Panel>
            </Shell>

            <Shell>
              <ShellHeader title="Payment" as="h2" />
              <Panel className="flex flex-col gap-4 p-4">
                <RadioGroup label="Payment method" value={pay} onValueChange={(v) => setPay(v as Pay)} className="gap-2">
                  {payOptions.map((p) => (
                    <Inset key={p} className={cn("p-4 transition-[box-shadow] duration-150", pay === p && "ring-2 ring-foreground")}>
                      <Radio value={p} label={<span className="font-medium">{p === "cod" ? "Cash on delivery" : WALLET_NAME[p]}</span>}
                        description={p === "cod" ? codDescription : <>Pay <Money value={total} /> now from your {WALLET_NAME[p]} account.</>} />
                    </Inset>
                  ))}
                </RadioGroup>
                <AnimatePresence initial={false}>
                  {needsTrx && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={enter} className="overflow-hidden">
                      <Inset className="flex flex-col gap-4 p-4">
                        {advanceMode && wallets.length > 1 && (
                          <div className="flex flex-col gap-2">
                            <span className="px-1 text-[0.8125rem] font-medium" aria-hidden="true">Pay the delivery charge with</span>
                            <SegmentedTabsTuffui<Wallet> label="Pay the delivery charge with" value={advWallet} onValueChange={setAdvWallet}
                              options={wallets.map((w) => ({ value: w, label: WALLET_NAME[w] }))} className="self-start" />
                          </div>
                        )}
                        <p className="flex gap-2 text-sm"><WalletIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><span>{walletLine(state, payWallet, advanceMode ? advance : total)}</span></p>
                        <div ref={box("trx")}><TextField label="Transaction ID" autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="8N7A6D5K3P" maxLength={14} required
                          value={trx} onChange={(e) => setTrx(e.target.value)} onBlur={() => touch("trx")} error={show("trx")}
                          description={`In the SMS ${WALLET_NAME[payWallet]} sends you. 8 to 10 letters or digits.`} /></div>
                      </Inset>
                    </motion.div>
                  )}
                </AnimatePresence>
                {noteOpen ? (
                  <TextArea label={<>Note for the seller <span className="font-normal text-muted-foreground">(optional)</span></>} rows={2} value={note} onChange={(e) => setNote(e.target.value)} autoFocus />
                ) : (
                  <ActionButton variant="quiet" className="self-start" onClick={() => setNoteOpen(true)}>Add a note for the seller</ActionButton>
                )}
              </Panel>
            </Shell>

            <div className="lg:hidden">{actions}</div>
          </div>

          <aside className="hidden min-w-0 flex-col gap-4 lg:sticky lg:top-24 lg:flex" aria-label="Order summary">
            <Shell>
              <ShellHeader title="Order summary" as="h2" />
              <Panel className="p-4"><SummaryBody lines={lines} sub={sub} quote={quote} advance={advance} total={total} /></Panel>
            </Shell>
            {actions}
          </aside>
        </form>
      </div>
    </StoreFrameTuffui>
  )
}

/* ---------- Confirmation ---------- */

function Confirmation({ id, phone, district, eta, total, paid, fee, pay }: Placed) {
  const { state } = useApp()
  const due = total - paid
  const steps = [
    { title: "The seller calls to confirm", desc: `${state.store.name} calls ${phone}. Keep your phone nearby.` },
    { title: "Sent with the courier", desc: "You get the tracking number by SMS." },
    { title: eta ? `Arrives in ${eta}` : "Delivered to your door", desc: district },
  ]
  return (
    <StoreFrameTuffui>
      <main className={cn(TUFF.frame, TUFF.block)}><div className={cn(TUFF.narrow, "flex flex-col gap-6")}>
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
            className="flex size-12 items-center justify-center rounded-full bg-foreground text-background"><Check className="size-6" aria-hidden="true" /></motion.div>
          <h1 className="text-3xl font-semibold tracking-tighter">Order placed</h1>
          <p className="text-sm text-muted-foreground">Order #{id} · SMS sent to {phone}</p>
        </div>
        <Shell>
          <ShellHeader title="What happens next" as="h2" />
          <Panel className="p-4">
            <ol className="flex flex-col gap-4">
              {steps.map((s, i) => (
                <motion.li key={s.title} className="flex gap-4" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...enter, delay: 0.1 + i * 0.06 }}>
                  <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium", i === 0 ? "bg-foreground text-background" : "bg-foreground/[0.06]")}>{i + 1}</span>
                  <span className="flex flex-col"><span className="text-sm font-medium">{s.title}</span><span className="text-sm text-muted-foreground">{s.desc}</span></span>
                </motion.li>
              ))}
            </ol>
          </Panel>
        </Shell>
        <Shell>
          <Panel className="flex flex-col gap-2 p-4">
            <span className="text-sm text-muted-foreground">{due > 0 ? "Pay the courier on delivery" : "Nothing to pay on delivery"}</span>
            <Money value={due} className="text-3xl font-semibold tabular-nums" />
            <p className="text-sm text-muted-foreground">
              {pay !== "cod" ? <>You paid <Money value={paid} /> by {WALLET_NAME[pay]}. The seller checks it before sending.</>
                : paid > 0 ? <>You paid the <Money value={paid} /> delivery charge in advance. Keep the exact amount ready.</>
                : fee > 0 ? <>Includes <Money value={fee} /> delivery. Keep the exact amount ready.</>
                : state.zones.length === 0 ? <>The seller will confirm the delivery charge by phone.</>
                : <>Delivery is free. Keep the exact amount ready.</>}
            </p>
          </Panel>
        </Shell>
        {state.store.phone && <p className="text-center text-sm text-muted-foreground">Need help? Call <a href={`tel:${state.store.phone}`} className="text-foreground underline underline-offset-4">{state.store.phone}</a></p>}
        <ActionButton variant="primary" size="md" className="h-12 text-base" onClick={() => go("store-tuffui")}>Continue shopping</ActionButton>
        <a href={`#order-tuffui-${id}`} className="text-center text-xs text-muted-foreground underline underline-offset-4">See this order in the admin (prototype)</a>
      </div></main>
    </StoreFrameTuffui>
  )
}
