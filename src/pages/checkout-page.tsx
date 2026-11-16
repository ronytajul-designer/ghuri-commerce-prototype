import { useState } from "react"
import { CheckIcon, ChevronDownIcon, LockIcon, RotateCcwIcon, ShoppingBagIcon, TruckIcon, WalletIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { ChoiceCardGroup, type Choice } from "@/components/app/choice-card-group"
import { Money } from "@/components/app/money"
import { ProductThumb } from "@/components/app/product-thumb"
import { DISTRICTS, cleanPhone, isValidBdPhone, thanasOf, toLatinDigits } from "@/lib/bd"
import { cn } from "@/lib/utils"
import { nextOrderId, placeOrder, stockFor, taka, useApp, zoneFor } from "@/store/store"
import type { AppState, Zone } from "@/store/types"
import { StoreFrame, cartLines } from "@/pages/storefront-pages"

type Pay = "cod" | "bkash" | "nagad"
type Wallet = "bkash" | "nagad"
type FieldKey = "phone" | "email" | "name" | "district" | "thana" | "address" | "trx"
type Line = ReturnType<typeof cartLines>[number]

const WALLET_NAME: Record<Wallet, string> = { bkash: "bKash", nagad: "Nagad" }
const FIELD_ORDER: FieldKey[] = ["phone", "email", "name", "district", "thana", "address", "trx"]
const FIELD_LABEL: Record<FieldKey, string> = {
  phone: "Mobile number", email: "Email", name: "Full name", district: "District", thana: "Thana", address: "Full address", trx: "Transaction ID",
}

/** Delivery quote for the picked district. `known` is false until the buyer picks a district (when zones exist). */
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

/* ---------- Order summary ---------- */

function SummaryBody({ lines, sub, quote, advance, total }: { lines: Line[]; sub: number; quote: Quote; advance: number; total: number }) {
  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-4">
        {lines.map((l, i) => (
          <li key={i} className="flex items-center gap-4">
            <div className="relative">
              <ProductThumb product={l.product} className="size-16" />
              <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-muted-foreground text-xs font-medium text-background tabular-nums" aria-hidden="true">{l.line.qty}</span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">{l.product.title}</span>
              <span className="text-sm text-muted-foreground">{[l.variant?.label, `Qty ${l.line.qty}`].filter(Boolean).join(" · ")}</span>
            </div>
            <Money value={l.price * l.line.qty} className="text-sm" />
          </li>
        ))}
      </ul>
      <Separator />
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><Money value={sub} /></div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Delivery{quote.free === "no-zones" ? ": to be confirmed" : ""}{quote.zone && quote.free === "none" ? ` (${quote.zone.name})` : ""}</span>
          {!quote.known ? <span className="text-muted-foreground">Pick district</span>
            : quote.free === "no-zones" ? <span className="text-muted-foreground">To be confirmed</span>
            : quote.free === "threshold" ? <Badge variant="success">Free delivery</Badge>
            : quote.uncovered ? <span className="text-muted-foreground">Seller confirms</span>
            : <Money value={quote.fee} />}
        </div>
        {advance > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Delivery charge paid now</span><span className="tabular-nums">−{taka(advance)}</span></div>}
      </div>
      <Separator />
      <div className="flex items-baseline justify-between">
        <span className="font-semibold">{advance > 0 ? "Pay on delivery" : "Total"}</span>
        <Money value={total - advance} className="text-xl font-semibold" />
      </div>
      {advance > 0 && <p className="-mt-2 text-right text-xs text-muted-foreground">Order total <Money value={total} /></p>}
    </div>
  )
}

/* ---------- Page ---------- */

export function CheckoutPage() {
  const { state, set } = useApp()
  const lines = cartLines(state)
  const [placed, setPlaced] = useState<{ id: number; phone: string; district: string; eta?: string; total: number; paid: number; fee: number; pay: Pay } | null>(null)

  if (placed) return <Confirmation {...placed} />
  if (lines.length === 0) {
    return (
      <StoreFrame back={{ href: "#store", label: "Back to store" }}>
        <main className="mx-auto w-full max-w-xl px-4 py-12">
          <Card><Empty className="py-12"><EmptyHeader><EmptyMedia variant="icon"><ShoppingBagIcon /></EmptyMedia><EmptyTitle>Your cart is empty</EmptyTitle></EmptyHeader><EmptyContent><Button asChild><a href="#store">Shop now</a></Button></EmptyContent></Empty></Card>
        </main>
      </StoreFrame>
    )
  }
  return <CheckoutForm state={state} lines={lines} onPlace={(input, done) => {
    let id = 0
    set((s) => { const r = placeOrder(s, input); id = r.id; return r.state })
    // React may run the updater lazily; the id it assigns is always nextOrderId of the current state.
    done(id || nextOrderId(state))
    window.scrollTo(0, 0)
  }} onPlaced={setPlaced} />
}

type PlaceInput = Parameters<typeof placeOrder>[1]

function CheckoutForm({ state, lines, onPlace, onPlaced }: {
  state: AppState
  lines: Line[]
  onPlace: (input: PlaceInput, done: (id: number) => void) => void
  onPlaced: (p: { id: number; phone: string; district: string; eta?: string; total: number; paid: number; fee: number; pay: Pay }) => void
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
    // Re-check stock against the latest store state before placing.
    const short = lines.filter((l) => l.line.qty > stockFor(l.product, l.variant?.key))
    if (short.length) { setStockIssue(short.map((l) => ({ title: [l.product.title, l.variant?.label].filter(Boolean).join(", "), left: stockFor(l.product, l.variant?.key) }))); return }
    setStockIssue(null)
    if (invalidKeys.length) {
      document.getElementById(invalidKeys[0])?.focus()
      return
    }
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
  const choices: Choice<Pay>[] = payOptions.map((p) =>
    p === "cod" ? { value: p, title: "Cash on delivery", description: codDescription }
      : { value: p, title: WALLET_NAME[p], description: <>Pay <Money value={total} /> now from your {WALLET_NAME[p]} account.</> })

  const placeLabel = quote.known ? <>Place order · <Money value={advanceMode ? advance : total} />{advanceMode ? " now" : ""}</> : <>Place order</>
  const alerts = (
    <>
      {stockIssue && (
        <Alert variant="destructive" role="alert">
          <AlertTitle>Not enough stock to place your order</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {stockIssue.map((x) => <li key={x.title}>{x.title}: {x.left === 0 ? "sold out" : `only ${x.left} left`}</li>)}
            </ul>
            <a href="#cart" className="underline underline-offset-4">Change quantities in your cart</a>
          </AlertDescription>
        </Alert>
      )}
      {tried && invalidKeys.length > 0 && (
        <Alert variant="destructive" role="alert">
          <AlertTitle>Fix {invalidKeys.length === 1 ? "this" : `these ${invalidKeys.length}`} to place your order</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {invalidKeys.map((k) => <li key={k}><a href={`#${k}`} className="underline underline-offset-4" onClick={(e) => { e.preventDefault(); document.getElementById(k)?.focus() }}>{FIELD_LABEL[k]}</a></li>)}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </>
  )
  const actions = (
    <div className="flex flex-col gap-4">
      <div className="hidden flex-col gap-4 lg:flex">{alerts}</div>
      <Button type="submit" size="lg" className="w-full rounded-full">{placeLabel}</Button>
      <p className="text-center text-sm text-muted-foreground">
        {pay !== "cod" ? `Paid by ${WALLET_NAME[pay]}. The seller checks your transaction ID and calls to confirm.`
          : advanceMode ? "The rest is paid in cash on delivery. The seller calls to confirm first."
          : "You pay nothing now. The seller calls to confirm first."}
      </p>
      {(state.store.returnPolicy || state.store.phone) && (
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          {state.store.returnPolicy && <span className="flex gap-2"><RotateCcwIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{state.store.returnPolicy}</span>}
          {state.store.phone && <span>Need help? Call <a href={`tel:${state.store.phone}`} className="text-foreground underline underline-offset-4">{state.store.phone}</a></span>}
        </div>
      )}
    </div>
  )

  const deliveryAlert = !quote.known ? (
    <Alert aria-live="polite"><TruckIcon /><AlertDescription>Pick your district to see the delivery charge</AlertDescription></Alert>
  ) : (
    <Alert aria-live="polite">
      <TruckIcon />
      <AlertDescription className="text-foreground">
        {quote.free === "no-zones" ? <span>The seller will confirm the delivery charge by phone</span>
          : quote.free === "threshold" ? <span className="flex flex-wrap items-center gap-2"><Badge variant="success">Free delivery</Badge>{quote.zone ? <>{quote.zone.name} · arrives in {quote.zone.eta}</> : <>Orders over <Money value={state.freeDeliveryOver ?? 0} /></>}</span>
          : quote.uncovered ? <span>The seller confirms the delivery charge for {district} when they call.</span>
          : <span><span className="font-medium">{quote.zone!.name}</span> · <Money value={quote.fee} /> delivery · arrives in {quote.zone!.eta}</span>}
      </AlertDescription>
    </Alert>
  )

  return (
    <StoreFrame back={{ href: "#cart", label: "Back to cart" }}>
      <div className="flex-1">
        <form noValidate onSubmit={submit} className="mx-auto grid w-full max-w-5xl items-start gap-6 px-4 py-6 md:px-8 md:py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex items-center justify-between gap-4 lg:col-span-2">
            <h1 className="text-3xl font-semibold tracking-tighter">Checkout</h1>
            <span className="flex items-center gap-2 text-sm text-muted-foreground"><LockIcon className="size-4" aria-hidden="true" />Secure checkout</span>
          </div>

          {(stockIssue || (tried && invalidKeys.length > 0)) && <div className="flex flex-col gap-4 lg:hidden">{alerts}</div>}
          {/* Mobile: collapsed summary at top */}
          <Collapsible open={summaryOpen} onOpenChange={setSummaryOpen} className="lg:hidden">
            <Card className="gap-0 py-0">
              <CollapsibleTrigger asChild>
                <button type="button" className="flex w-full items-center justify-between gap-2 px-4 py-4 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-xl">
                  <span className="flex items-center gap-2"><ShoppingBagIcon className="size-4" aria-hidden="true" />{summaryOpen ? "Hide order summary" : "Show order summary"} · <Money value={total - advance} /></span>
                  <ChevronDownIcon className={cn("size-4 transition-transform", summaryOpen && "rotate-180")} aria-hidden="true" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t px-4 py-4"><SummaryBody lines={lines} sub={sub} quote={quote} advance={advance} total={total} /></div>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <div className="flex min-w-0 flex-col gap-6">
            <Card>
              <CardHeader><CardTitle>Contact</CardTitle><CardDescription>The seller and courier call this number.</CardDescription></CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field data-invalid={show("phone") ? true : undefined}>
                    <FieldLabel htmlFor="phone">Mobile number</FieldLabel>
                    <Input id="phone" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="01XXXXXXXXX" required
                      value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => touch("phone")}
                      aria-invalid={show("phone") ? true : undefined} aria-describedby="phone-hint" />
                    {show("phone") ? <FieldError id="phone-hint">{show("phone")}</FieldError>
                      : !errors.phone && touched.phone ? <FieldDescription id="phone-hint" className="flex items-center gap-2"><CheckIcon className="size-4 text-success" aria-hidden="true" />The courier will call {clean}.</FieldDescription>
                      : <FieldDescription id="phone-hint">Bangla digits work too.</FieldDescription>}
                  </Field>
                  <Field data-invalid={show("email") ? true : undefined}>
                    <FieldLabel htmlFor="email">Email <span className="font-normal text-muted-foreground">(optional)</span></FieldLabel>
                    <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => touch("email")}
                      aria-invalid={show("email") ? true : undefined} aria-describedby={show("email") ? "email-error" : undefined} />
                    {show("email") && <FieldError id="email-error">{show("email")}</FieldError>}
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Delivery address</CardTitle></CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field data-invalid={show("name") ? true : undefined}>
                    <FieldLabel htmlFor="name">Full name</FieldLabel>
                    <Input id="name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} onBlur={() => touch("name")}
                      aria-invalid={show("name") ? true : undefined} aria-describedby={show("name") ? "name-error" : undefined} />
                    {show("name") && <FieldError id="name-error">{show("name")}</FieldError>}
                  </Field>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field data-invalid={show("district") ? true : undefined}>
                      <FieldLabel htmlFor="district">District</FieldLabel>
                      <Select value={district} onValueChange={(v) => { setDistrict(v); setThana("") }} onOpenChange={(o) => { if (!o) touch("district") }}>
                        <SelectTrigger id="district" className="w-full" aria-invalid={show("district") ? true : undefined} aria-describedby={show("district") ? "district-error" : undefined}>
                          <SelectValue placeholder="Select district" />
                        </SelectTrigger>
                        <SelectContent>{DISTRICTS.map((x) => <SelectItem key={x.name} value={x.name}>{x.name}</SelectItem>)}</SelectContent>
                      </Select>
                      {show("district") && <FieldError id="district-error">{show("district")}</FieldError>}
                    </Field>
                    <Field data-invalid={show("thana") ? true : undefined}>
                      <FieldLabel htmlFor="thana">Thana</FieldLabel>
                      <Select value={thana} onValueChange={setThana} onOpenChange={(o) => { if (!o) touch("thana") }}>
                        <SelectTrigger id="thana" className="w-full" aria-invalid={show("thana") ? true : undefined} aria-describedby={show("thana") ? "thana-error" : undefined}>
                          <SelectValue placeholder={district ? "Select thana" : "Pick district first"} />
                        </SelectTrigger>
                        <SelectContent>{thanasOf(district).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                      {show("thana") && <FieldError id="thana-error">{show("thana")}</FieldError>}
                    </Field>
                  </div>
                  <Field data-invalid={show("address") ? true : undefined}>
                    <FieldLabel htmlFor="address">Full address</FieldLabel>
                    <Textarea id="address" rows={3} autoComplete="street-address" required placeholder="House 12, Road 5, near the school"
                      value={address} onChange={(e) => setAddress(e.target.value)} onBlur={() => touch("address")}
                      aria-invalid={show("address") ? true : undefined} aria-describedby="address-hint" />
                    {show("address") ? <FieldError id="address-hint">{show("address")}</FieldError> : <FieldDescription id="address-hint">House, road, area and a nearby landmark.</FieldDescription>}
                  </Field>
                  {deliveryAlert}
                </FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-4">
                <ChoiceCardGroup<Pay> name="pay" aria-label="Payment method" value={pay} onValueChange={setPay} choices={choices} />
                {needsTrx && (
                  <div className="flex flex-col gap-4 rounded-lg border bg-muted/40 p-4">
                    {advanceMode && wallets.length > 1 && (
                      <ChoiceCardGroup<Wallet> name="adv-wallet" aria-label="Pay the delivery charge with" columns={2} value={advWallet} onValueChange={setAdvWallet}
                        choices={wallets.map((w) => ({ value: w, title: WALLET_NAME[w] }))} />
                    )}
                    <p className="flex gap-2 text-sm"><WalletIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><span>{walletLine(state, payWallet, advanceMode ? advance : total)}</span></p>
                    <Field data-invalid={show("trx") ? true : undefined}>
                      <FieldLabel htmlFor="trx">Transaction ID</FieldLabel>
                      <Input id="trx" autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="8N7A6D5K3P" maxLength={14} required
                        value={trx} onChange={(e) => setTrx(e.target.value)} onBlur={() => touch("trx")}
                        aria-invalid={show("trx") ? true : undefined} aria-describedby="trx-hint" />
                      {show("trx") ? <FieldError id="trx-hint">{show("trx")}</FieldError> : <FieldDescription id="trx-hint">In the SMS {WALLET_NAME[payWallet]} sends you. 8 to 10 letters or digits.</FieldDescription>}
                    </Field>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex-col items-stretch gap-4">
                {noteOpen ? (
                  <Field>
                    <FieldLabel htmlFor="note">Note for the seller <span className="font-normal text-muted-foreground">(optional)</span></FieldLabel>
                    <Textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} autoFocus />
                  </Field>
                ) : (
                  <Button type="button" variant="link" className="h-auto self-start p-0" onClick={() => setNoteOpen(true)}>Add a note for the seller</Button>
                )}
              </CardFooter>
            </Card>

            {/* Mobile: place order at the end of the form */}
            <div className="lg:hidden">{actions}</div>
          </div>

          <aside className="hidden min-w-0 flex-col gap-4 lg:sticky lg:top-24 lg:flex" aria-label="Order summary">
            <Card>
              <CardHeader><CardTitle>Order summary</CardTitle></CardHeader>
              <CardContent><SummaryBody lines={lines} sub={sub} quote={quote} advance={advance} total={total} /></CardContent>
            </Card>
            {actions}
          </aside>
        </form>
      </div>
    </StoreFrame>
  )
}

/* ---------- Confirmation ---------- */

function Confirmation({ id, phone, district, eta, total, paid, fee, pay }: { id: number; phone: string; district: string; eta?: string; total: number; paid: number; fee: number; pay: Pay }) {
  const { state } = useApp()
  const due = total - paid
  const steps = [
    { title: "The seller calls to confirm", desc: `${state.store.name} calls ${phone}. Keep your phone nearby.` },
    { title: "Sent with the courier", desc: "You get the tracking number by SMS." },
    { title: eta ? `Arrives in ${eta}` : "Delivered to your door", desc: district },
  ]
  return (
    <StoreFrame>
      <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-6 md:py-8">
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-success/15"><CheckIcon className="size-6 text-success-foreground" aria-hidden="true" /></div>
          <h1 className="text-3xl font-semibold tracking-tighter">Order placed</h1>
          <p className="text-sm text-muted-foreground">Order #{id} · SMS sent to {phone}</p>
        </div>
        <Card>
          <CardHeader><CardTitle>What happens next</CardTitle></CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-4">
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className={i === 0 ? "flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground" : "flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium"}>{i + 1}</span>
                  <span className="flex flex-col"><span className="text-sm font-medium">{s.title}</span><span className="text-sm text-muted-foreground">{s.desc}</span></span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{due > 0 ? "Pay the courier on delivery" : "Nothing to pay on delivery"}</CardDescription>
            <CardTitle className="text-3xl tabular-nums"><Money value={due} /></CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {pay !== "cod" ? <>You paid <Money value={paid} /> by {WALLET_NAME[pay]}. The seller checks it before sending.</>
                : paid > 0 ? <>You paid the <Money value={paid} /> delivery charge in advance. Keep the exact amount ready.</>
                : fee > 0 ? <>Includes <Money value={fee} /> delivery. Keep the exact amount ready.</>
                : state.zones.length === 0 ? <>The seller will confirm the delivery charge by phone.</>
                : <>Delivery is free. Keep the exact amount ready.</>}
            </p>
          </CardContent>
        </Card>
        {state.store.phone && <p className="text-center text-sm text-muted-foreground">Need help? Call <a href={`tel:${state.store.phone}`} className="text-foreground underline underline-offset-4">{state.store.phone}</a></p>}
        <Button size="lg" className="rounded-full" asChild><a href="#store">Continue shopping</a></Button>
        <a href={`#order-${id}`} className="text-center text-xs text-muted-foreground underline underline-offset-4">See this order in the admin (prototype)</a>
      </main>
    </StoreFrame>
  )
}
