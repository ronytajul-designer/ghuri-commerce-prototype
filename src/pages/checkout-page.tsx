import { useState } from "react"
import { CheckIcon, LockIcon, MessageCircleIcon, PhoneIcon, RotateCcwIcon, TruckIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { ChoiceCardGroup } from "@/components/app/choice-card-group"
import { Money } from "@/components/app/money"
import { ModeToggle } from "@/components/mode-toggle"

// Sample zones. Real rates come from the merchant's Shipping settings.
const DISTRICTS = [
  { id: "dhaka", name: "Dhaka", zone: "Inside Dhaka", fee: 80, eta: "1 to 2 days", thanas: ["Dhanmondi", "Mirpur", "Gulshan", "Uttara", "Mohammadpur"] },
  { id: "gazipur", name: "Gazipur", zone: "Outside Dhaka", fee: 150, eta: "2 to 3 days", thanas: ["Gazipur Sadar", "Tongi", "Kaliakair"] },
  { id: "chattogram", name: "Chattogram", zone: "Outside Dhaka", fee: 150, eta: "2 to 4 days", thanas: ["Kotwali", "Panchlaish", "Double Mooring"] },
  { id: "sylhet", name: "Sylhet", zone: "Outside Dhaka", fee: 150, eta: "3 to 5 days", thanas: ["Sylhet Sadar", "Beanibazar", "Golapganj"] },
]
const ITEM = { title: "Cotton Panjabi", variant: "Size M", price: 500 }
const BN: Record<string, string> = { "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4", "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9" }
type Pay = "cod" | "bkash" | "nagad"

function cleanPhone(raw: string) {
  let s = raw.replace(/[০-৯]/g, (c) => BN[c]).replace(/[\s\-()]/g, "")
  if (s.startsWith("+880")) s = "0" + s.slice(4)
  else if (s.startsWith("880")) s = "0" + s.slice(3)
  return s
}

function StoreHeader() {
  return (
    <header className="sticky top-0 z-10 border-b bg-background">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 md:px-8">
        <div className="flex flex-col">
          <span className="font-semibold tracking-wide">TAJUL 1</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><LockIcon className="size-3" aria-hidden="true" />Secure checkout</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild><a href="#" aria-label="Call the seller"><PhoneIcon /></a></Button>
          <Button variant="outline" asChild><a href="#"><MessageCircleIcon />WhatsApp</a></Button>
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}

function OrderSummary({ fee, zone, total }: { fee: number; zone: string; total: number }) {
  return (
    <Card>
      <CardHeader><CardTitle>Order summary</CardTitle></CardHeader>
      <CardContent className="gap-4">
        <div className="flex items-center gap-4">
          <div className="size-16 shrink-0 rounded-md bg-muted" aria-hidden="true" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium">{ITEM.title}</span>
            <span className="text-sm text-muted-foreground">{ITEM.variant} · Qty 1</span>
          </div>
          <Money value={ITEM.price} className="text-sm" />
        </div>
        <Separator />
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><Money value={ITEM.price} /></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Delivery ({zone})</span><Money value={fee} /></div>
        </div>
        <Separator />
        <div className="flex items-baseline justify-between"><span className="font-semibold">Total</span><Money value={total} className="text-xl font-semibold" /></div>
      </CardContent>
    </Card>
  )
}

export function CheckoutPage() { // TODO(checkout agent): wire to store
  const [phone, setPhone] = useState("")
  const [touched, setTouched] = useState(false)
  const [tried, setTried] = useState(false)
  const [districtId, setDistrictId] = useState("dhaka")
  const [thana, setThana] = useState("")
  const [pay, setPay] = useState<Pay>("cod")
  const [noteOpen, setNoteOpen] = useState(false)
  const [placed, setPlaced] = useState(false)

  const d = DISTRICTS.find((x) => x.id === districtId) ?? DISTRICTS[0]
  const total = ITEM.price + d.fee
  const clean = cleanPhone(phone)
  const valid = /^01[3-9]\d{8}$/.test(clean)
  const showError = (touched || tried) && !valid

  if (placed) return <Confirmation phone={clean} district={d} total={total} onBack={() => setPlaced(false)} />

  return (
    <div className="min-h-svh bg-muted/40">
      <StoreHeader />
      <main className="mx-auto grid max-w-5xl items-start gap-6 px-4 py-6 md:px-8 md:py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <h1 className="sr-only">Checkout</h1>
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader><CardTitle>Contact</CardTitle><CardDescription>The seller and courier call this number.</CardDescription></CardHeader>
            <CardContent>
              <FieldGroup>
                <Field data-invalid={showError || undefined}>
                  <FieldLabel htmlFor="phone">Mobile number</FieldLabel>
                  <Input id="phone" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="01XXXXXXXXX" required
                    value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => setTouched(true)} aria-invalid={showError || undefined} />
                  {showError ? <FieldError>Enter an 11-digit number starting with 01, for example 01711223344.</FieldError>
                    : valid && touched ? <FieldDescription className="flex items-center gap-1"><CheckIcon className="size-4 text-success" aria-hidden="true" />The courier will call {clean}.</FieldDescription>
                    : <FieldDescription>Bangla digits work too.</FieldDescription>}
                </Field>
                <Field>
                  <FieldLabel htmlFor="email">Email <span className="font-normal text-muted-foreground">(optional)</span></FieldLabel>
                  <Input id="email" type="email" autoComplete="email" />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Delivery address</CardTitle></CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Full name</FieldLabel>
                  <Input id="name" autoComplete="name" required />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="district">District</FieldLabel>
                    <Select value={districtId} onValueChange={(v) => { setDistrictId(v); setThana("") }}>
                      <SelectTrigger id="district" className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>{DISTRICTS.map((x) => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="thana">Thana</FieldLabel>
                    <Select value={thana} onValueChange={setThana}>
                      <SelectTrigger id="thana" className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{d.thanas.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="address">Full address</FieldLabel>
                  <Textarea id="address" rows={3} autoComplete="street-address" required />
                  <FieldDescription>House, road, area and a nearby landmark.</FieldDescription>
                </Field>
                <Alert aria-live="polite">
                  <TruckIcon />
                  <AlertDescription className="text-foreground">
                    <span><span className="font-medium">{d.zone}</span> · <Money value={d.fee} /> delivery · arrives in {d.eta}</span>
                  </AlertDescription>
                </Alert>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
            <CardContent>
              <ChoiceCardGroup<Pay> name="pay" aria-label="Payment method" value={pay} onValueChange={setPay} choices={[
                { value: "cod", title: "Cash on delivery", description: <>Pay <Money value={total} /> when it arrives.</> },
                { value: "bkash", title: "bKash", description: "Pay now. Faster confirmation." },
                { value: "nagad", title: "Nagad", description: "Pay now from your Nagad account." },
              ]} />
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-4">
              {noteOpen ? (
                <Field>
                  <FieldLabel htmlFor="note">Note for the seller <span className="font-normal text-muted-foreground">(optional)</span></FieldLabel>
                  <Textarea id="note" rows={2} />
                </Field>
              ) : (
                <Button variant="link" className="h-auto self-start p-0" onClick={() => setNoteOpen(true)}>Add a note for the seller</Button>
              )}
            </CardFooter>
          </Card>
        </div>

        <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-24">
          <OrderSummary fee={d.fee} zone={d.zone} total={total} />
          {tried && !valid && (
            <Alert variant="destructive" role="alert"><AlertDescription>Fix the mobile number before placing your order.</AlertDescription></Alert>
          )}
          <Button size="lg" className="w-full" onClick={() => { setTried(true); if (valid) { setPlaced(true); window.scrollTo(0, 0) } }}>
            Place order · <Money value={total} />
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {pay === "cod" ? "You pay nothing now. The seller calls to confirm first." : `You will pay on ${pay === "bkash" ? "bKash" : "Nagad"} next.`}
          </p>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><RotateCcwIcon className="size-4" aria-hidden="true" />[Return policy] · <a href="#" className="text-foreground underline underline-offset-4">Details</a></span>
            <span>Need help? Call <a href="#" className="text-foreground underline underline-offset-4">[Store phone]</a></span>
          </div>
        </aside>
      </main>
    </div>
  )
}

function Confirmation({ phone, district, total, onBack }: { phone: string; district: (typeof DISTRICTS)[number]; total: number; onBack: () => void }) {
  const steps = [
    { title: "The seller calls to confirm", desc: "Within [X hours]. Keep your phone nearby." },
    { title: "Sent with the courier", desc: "You get the tracking number by SMS." },
    { title: `Arrives in ${district.eta}`, desc: district.name },
  ]
  return (
    <div className="min-h-svh bg-muted/40">
      <StoreHeader />
      <main className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-6 md:py-8">
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-success/15"><CheckIcon className="size-6 text-success-foreground" aria-hidden="true" /></div>
          <h1 className="text-2xl font-semibold tracking-tight">Order placed</h1>
          <p className="text-sm text-muted-foreground">Order #1013 · SMS sent to {phone}</p>
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
            <CardDescription>Pay the courier on delivery</CardDescription>
            <CardTitle className="text-3xl tabular-nums"><Money value={total} /></CardTitle>
          </CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Includes <Money value={district.fee} /> delivery. Keep the exact amount ready.</p></CardContent>
        </Card>
        <Button size="lg" onClick={onBack}>Continue shopping</Button>
      </main>
    </div>
  )
}
