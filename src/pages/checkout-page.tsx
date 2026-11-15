import { useState } from "react"
import { CheckIcon, ChevronDownIcon, LockIcon, MessageCircleIcon, PhoneIcon, RotateCcwIcon, TruckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { taka } from "@/data/orders"

// Sample zones. Real rates come from the merchant's Shipping settings.
const DISTRICTS = [
  { id: "dhaka", name: "Dhaka", zone: "Inside Dhaka", fee: 80, eta: "1 to 2 days", thanas: ["Dhanmondi", "Mirpur", "Gulshan", "Uttara", "Mohammadpur"] },
  { id: "gazipur", name: "Gazipur", zone: "Outside Dhaka", fee: 150, eta: "2 to 3 days", thanas: ["Gazipur Sadar", "Tongi", "Kaliakair"] },
  { id: "chattogram", name: "Chattogram", zone: "Outside Dhaka", fee: 150, eta: "2 to 4 days", thanas: ["Kotwali", "Panchlaish", "Double Mooring"] },
  { id: "sylhet", name: "Sylhet", zone: "Outside Dhaka", fee: 150, eta: "3 to 5 days", thanas: ["Sylhet Sadar", "Beanibazar", "Golapganj"] },
]
const SUBTOTAL = 500
const BN: Record<string, string> = { "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4", "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9" }

function cleanPhone(raw: string) {
  let s = raw.replace(/[০-৯]/g, (c) => BN[c]).replace(/[\s\-()]/g, "")
  if (s.startsWith("+880")) s = "0" + s.slice(4)
  else if (s.startsWith("880")) s = "0" + s.slice(3)
  return s
}

export function CheckoutPage() {
  const [phone, setPhone] = useState("")
  const [touched, setTouched] = useState(false)
  const [tried, setTried] = useState(false)
  const [districtId, setDistrictId] = useState("dhaka")
  const [thana, setThana] = useState("")
  const [pay, setPay] = useState("cod")
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [placed, setPlaced] = useState(false)

  const d = DISTRICTS.find((x) => x.id === districtId) ?? DISTRICTS[0]
  const total = SUBTOTAL + d.fee
  const clean = cleanPhone(phone)
  const valid = /^01[3-9]\d{8}$/.test(clean)
  const showError = (touched || tried) && !valid

  if (placed) return <Confirmation phone={clean} district={d} total={total} onBack={() => setPlaced(false)} />

  return (
    <div className="min-h-svh bg-muted/40">
      <StoreHeader />
      <button
        type="button"
        aria-expanded={summaryOpen}
        onClick={() => setSummaryOpen(!summaryOpen)}
        className="flex min-h-12 w-full items-center justify-between border-b bg-background px-4 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="flex items-center gap-1">{summaryOpen ? "Hide" : "Show"} order summary (1 item) <ChevronDownIcon className={cn("size-4 transition-transform", summaryOpen && "rotate-180")} /></span>
        <span className="text-base font-semibold tabular-nums">{taka(total)}</span>
      </button>
      {summaryOpen && (
        <div className="flex items-center gap-3 border-b bg-background px-4 py-3">
          <div className="size-14 shrink-0 rounded-md bg-muted" aria-hidden="true" />
          <div className="flex flex-1 flex-col text-sm"><span className="font-medium">[Product name]</span><span className="text-muted-foreground">Size M · Qty 1</span></div>
          <span className="text-sm font-medium tabular-nums">{taka(SUBTOTAL)}</span>
        </div>
      )}

      <main className="mx-auto flex max-w-lg flex-col gap-3 p-4">
        <Card>
          <CardHeader><CardTitle>1. Your mobile number</CardTitle></CardHeader>
          <CardContent>
            <FieldGroup>
              <Field data-invalid={showError || undefined}>
                <FieldLabel htmlFor="phone">Mobile number <span className="text-destructive" aria-hidden="true">*</span></FieldLabel>
                <Input
                  id="phone" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="01XXXXXXXXX" required
                  className="h-11 text-base"
                  value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => setTouched(true)}
                  aria-invalid={showError || undefined} aria-describedby="phone-msg"
                />
                {showError ? (
                  <FieldError id="phone-msg">Enter an 11-digit mobile number starting with 01, for example 01711223344.</FieldError>
                ) : valid && touched ? (
                  <FieldDescription id="phone-msg" className="flex items-center gap-1 text-foreground"><CheckIcon className="size-4 text-success" aria-hidden="true" /> The courier will call {clean}.</FieldDescription>
                ) : (
                  <FieldDescription id="phone-msg">The seller and courier call this number to confirm and deliver.</FieldDescription>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email <span className="font-normal text-muted-foreground">(optional)</span></FieldLabel>
                <Input id="email" type="email" autoComplete="email" className="h-11 text-base" />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>2. Delivery address</CardTitle></CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Full name <span className="text-destructive" aria-hidden="true">*</span></FieldLabel>
                <Input id="name" autoComplete="name" required className="h-11 text-base" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="district">District <span className="text-destructive" aria-hidden="true">*</span></FieldLabel>
                  <Select value={districtId} onValueChange={(v) => { setDistrictId(v); setThana("") }}>
                    <SelectTrigger id="district" className="h-11 w-full text-base"><SelectValue /></SelectTrigger>
                    <SelectContent>{DISTRICTS.map((x) => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="thana">Thana <span className="text-destructive" aria-hidden="true">*</span></FieldLabel>
                  <Select value={thana} onValueChange={setThana}>
                    <SelectTrigger id="thana" className="h-11 w-full text-base"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{d.thanas.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="address">Full address <span className="text-destructive" aria-hidden="true">*</span></FieldLabel>
                <Textarea id="address" rows={3} autoComplete="street-address" required className="text-base" />
                <FieldDescription>House, road, area and a nearby landmark. Example: House 12, Road 5, near Dhanmondi Lake.</FieldDescription>
              </Field>
              <div className="flex gap-3 rounded-lg border bg-muted/50 p-3" aria-live="polite">
                <TruckIcon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                <div className="flex flex-col text-sm">
                  <span className="font-semibold">{d.zone} · {taka(d.fee)} delivery</span>
                  <span className="text-muted-foreground">Arrives in {d.eta}</span>
                </div>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>3. Payment</CardTitle></CardHeader>
          <CardContent>
            <RadioGroup value={pay} onValueChange={setPay} aria-label="Payment method" className="gap-2">
              {[
                { id: "cod", title: "Cash on delivery", desc: `Pay ${taka(total)} to the courier when it arrives.` },
                { id: "bkash", title: "bKash", desc: "Pay now. Faster confirmation." },
                { id: "nagad", title: "Nagad", desc: "Pay now from your Nagad account." },
              ].map((p) => (
                <FieldLabel key={p.id} htmlFor={`pay-${p.id}`} className="cursor-pointer rounded-lg border p-3 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-muted/60">
                  <Field orientation="horizontal" className="items-start">
                    <RadioGroupItem id={`pay-${p.id}`} value={p.id} className="mt-0.5" />
                    <span className="flex flex-col gap-0.5"><span className="font-medium">{p.title}</span><span className="text-sm font-normal text-muted-foreground">{p.desc}</span></span>
                  </Field>
                </FieldLabel>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{taka(SUBTOTAL)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Delivery ({d.zone})</span><span className="tabular-nums">{taka(d.fee)}</span></div>
            <Separator className="my-1" />
            <div className="flex items-baseline justify-between"><span className="text-base font-semibold">Total</span><span className="text-xl font-semibold tabular-nums">{taka(total)}</span></div>
            <p className="text-muted-foreground">{pay === "cod" ? "You pay nothing now. The seller calls to confirm before sending." : `You will be sent to ${pay === "bkash" ? "bKash" : "Nagad"} to pay ${taka(total)}.`}</p>
            {noteOpen ? (
              <Field className="mt-2">
                <FieldLabel htmlFor="note">Note for the seller <span className="font-normal text-muted-foreground">(optional)</span></FieldLabel>
                <Textarea id="note" rows={2} className="text-base" />
              </Field>
            ) : (
              <Button variant="link" className="h-11 self-start px-0" onClick={() => setNoteOpen(true)}>+ Add a note for the seller</Button>
            )}
          </CardContent>
        </Card>

        {tried && !valid && (
          <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive">Please fix the mobile number above before placing your order.</div>
        )}
        <Button size="lg" className="h-12 text-base" onClick={() => { setTried(true); if (valid) { setPlaced(true); window.scrollTo(0, 0) } }}>
          Place order · {taka(total)}
        </Button>
        <div className="flex flex-col gap-1 px-1 pb-8 text-sm text-muted-foreground">
          <span className="flex items-center gap-2"><RotateCcwIcon className="size-4" aria-hidden="true" /> [Return policy, e.g. exchange within 3 days] · <a href="#" className="text-foreground underline underline-offset-4">Details</a></span>
          <span>Need help? Call <a href="#" className="text-foreground underline underline-offset-4">[Store phone]</a></span>
        </div>
      </main>
    </div>
  )
}

function StoreHeader() {
  return (
    <header className="flex items-center justify-between gap-3 border-b bg-background px-4 py-2">
      <div className="flex flex-col">
        <span className="font-semibold tracking-wide">TAJUL 1</span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground"><LockIcon className="size-3" aria-hidden="true" /> Secure checkout</span>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="icon" className="size-11" asChild><a href="#" aria-label="Call the seller"><PhoneIcon /></a></Button>
        <Button variant="outline" className="h-11" asChild><a href="#"><MessageCircleIcon /> WhatsApp</a></Button>
      </div>
    </header>
  )
}

function Confirmation({ phone, district, total, onBack }: { phone: string; district: (typeof DISTRICTS)[number]; total: number; onBack: () => void }) {
  const steps = [
    { title: "The seller calls you to confirm", desc: "Within [X hours]. Keep your phone nearby." },
    { title: "Sent with the courier", desc: "You get the tracking number by SMS." },
    { title: `Arrives in ${district.eta}`, desc: `${district.name}` },
  ]
  return (
    <div className="min-h-svh bg-muted/40">
      <StoreHeader />
      <main className="mx-auto flex max-w-lg flex-col gap-3 p-4">
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-4 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-success/15"><CheckIcon className="size-7 text-success" aria-hidden="true" /></div>
            <h1 className="text-2xl font-semibold">Order placed</h1>
            <p className="text-muted-foreground">Order #1013 · SMS sent to {phone}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>What happens next</CardTitle></CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-4">
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-3">
                  <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold", i === 0 ? "bg-primary text-primary-foreground" : "bg-muted")}>{i + 1}</span>
                  <span className="flex flex-col"><span className="font-medium">{s.title}</span><span className="text-sm text-muted-foreground">{s.desc}</span></span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1">
            <span className="text-sm font-medium">Pay the courier on delivery</span>
            <span className="text-3xl font-semibold tabular-nums">{taka(total)}</span>
            <span className="text-sm text-muted-foreground">Includes {taka(district.fee)} delivery. Please keep the exact amount ready.</span>
          </CardContent>
        </Card>
        <Button size="lg" className="h-12 text-base" onClick={onBack}>Continue shopping</Button>
      </main>
    </div>
  )
}
