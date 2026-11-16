import { useState } from "react"
import { toast } from "sonner"
import { CheckCircle2Icon, CopyIcon, ExternalLinkIcon, InfoIcon, PlusIcon, SparklesIcon, TrashIcon, TruckIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { SettingsLayout } from "@/components/app/settings-layout"
import { ChoiceCardGroup } from "@/components/app/choice-card-group"
import { Money, MoneyInput, parseAmount } from "@/components/app/money"
import { cleanPhone, isValidBdPhone } from "@/lib/bd"
import { useUnsavedGuard } from "@/components/app/unsaved-guard"
import { uid, useApp } from "@/store/store"
import type { Member, Payments, Zone } from "@/store/types"

/** Save bar shared by settings forms: shows only when something changed. */
function SaveRow({ dirty, onSave, onReset }: { dirty: boolean; onSave: () => void; onReset: () => void }) {
  useUnsavedGuard(dirty)
  return (
    <div className="flex items-center justify-end gap-2">
      {dirty && <span className="mr-auto text-sm text-muted-foreground">Unsaved changes</span>}
      <Button variant="outline" disabled={!dirty} onClick={onReset}>Discard</Button>
      <Button disabled={!dirty} onClick={onSave}>Save</Button>
    </div>
  )
}

/* ---------- General ---------- */

export function GeneralSettingsPage() {
  const { state, set } = useApp()
  const [form, setForm] = useState(state.store)
  const dirty = JSON.stringify(form) !== JSON.stringify(state.store)
  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value })
  const phoneBad = !!form.phone && !isValidBdPhone(cleanPhone(form.phone))
  const waBad = !!form.whatsapp && !isValidBdPhone(cleanPhone(form.whatsapp))
  const [nameTouched, setNameTouched] = useState(false)
  const nameBad = nameTouched && !form.name.trim()
  return (
    <SettingsLayout active="settings-general" title="General" description="What shoppers see about your store, and how they reach you.">
      <Card>
        <CardHeader><CardTitle>Store details</CardTitle></CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={nameBad || undefined}>
              <FieldLabel htmlFor="sname">Store name</FieldLabel>
              <Input id="sname" value={form.name} onChange={f("name")} onBlur={() => setNameTouched(true)} aria-invalid={nameBad || undefined} aria-describedby={nameBad ? "sname-error" : undefined} />
              {nameBad && <FieldError id="sname-error">Enter your store name. Shoppers see it at the top of your store.</FieldError>}
            </Field>
            <Field>
              <FieldLabel htmlFor="shandle">Store address</FieldLabel>
              <InputGroup>
                <InputGroupInput id="shandle" value={form.handle} readOnly />
                <InputGroupAddon align="inline-end"><InputGroupText>.ghuri.store</InputGroupText></InputGroupAddon>
              </InputGroup>
              <FieldDescription>Want your own address like www.yourbrand.com? <a href="#settings-domains" className="underline underline-offset-4">Connect a domain</a>.</FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
          <CardDescription>Shown on your store, checkout and order SMS. Shoppers in Bangladesh often call before buying.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field data-invalid={phoneBad || undefined}>
                <FieldLabel htmlFor="sphone">Phone</FieldLabel>
                <Input id="sphone" type="tel" inputMode="tel" placeholder="01XXXXXXXXX" value={form.phone} onChange={f("phone")} aria-invalid={phoneBad || undefined} aria-describedby={phoneBad ? "sphone-error" : undefined} />
                {phoneBad && <FieldError id="sphone-error">Enter an 11-digit number starting with 01.</FieldError>}
              </Field>
              <Field data-invalid={waBad || undefined}>
                <FieldLabel htmlFor="swa">WhatsApp</FieldLabel>
                <Input id="swa" type="tel" inputMode="tel" placeholder="01XXXXXXXXX" value={form.whatsapp} onChange={f("whatsapp")} aria-invalid={waBad || undefined} aria-describedby="swa-help" />
                {waBad ? <FieldError id="swa-help">Enter an 11-digit number starting with 01.</FieldError> : <FieldDescription id="swa-help">Adds a WhatsApp button to your store.</FieldDescription>}
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="sfb">Facebook page</FieldLabel>
              <Input id="sfb" placeholder="facebook.com/yourpage" value={form.facebook} onChange={f("facebook")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="saddr">Business address</FieldLabel>
              <Input id="saddr" value={form.address} onChange={f("address")} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Return and exchange policy</CardTitle><CardDescription>Shown on every product page and at checkout.</CardDescription></CardHeader>
        <CardContent>
          <Field>
            <FieldLabel htmlFor="spolicy" className="sr-only">Return and exchange policy</FieldLabel>
            <Textarea id="spolicy" rows={3} value={form.returnPolicy} onChange={f("returnPolicy")} placeholder="e.g. Exchange within 3 days if the size does not fit." />
          </Field>
        </CardContent>
      </Card>
      <SaveRow dirty={dirty} onReset={() => setForm(state.store)} onSave={() => {
        if (!form.name.trim()) { setNameTouched(true); document.getElementById("sname")?.focus(); toast.error("Enter your store name to save."); return }
        if (phoneBad || waBad) { toast.error("Fix the phone numbers to save."); return }
        set((s) => ({ ...s, store: { ...form, name: form.name.trim(), phone: form.phone && cleanPhone(form.phone), whatsapp: form.whatsapp && cleanPhone(form.whatsapp) } }))
        toast.success("Store details saved")
      }} />
    </SettingsLayout>
  )
}

/* ---------- Shipping ---------- */

const PRESET: Zone[] = [
  { id: "z1", name: "Inside Dhaka", districts: "dhaka", fee: 80, eta: "1 to 2 days" },
  { id: "z2", name: "Outside Dhaka", districts: "rest", fee: 150, eta: "2 to 4 days" },
]

export function ShippingSettingsPage() {
  const { state, set } = useApp()
  const [zones, setZones] = useState(state.zones)
  const [free, setFree] = useState(state.freeDeliveryOver ? String(state.freeDeliveryOver) : "")
  const [freeOn, setFreeOn] = useState(state.freeDeliveryOver !== null)
  const dirty = JSON.stringify(zones) !== JSON.stringify(state.zones) || (freeOn ? Number(free) || null : null) !== state.freeDeliveryOver
  const setZone = (id: string, patch: Partial<Zone>) => setZones(zones.map((z) => (z.id === id ? { ...z, ...patch } : z)))
  return (
    <SettingsLayout active="settings-shipping" title="Shipping" description="Delivery charges shoppers pay. They see the charge as soon as they pick a district.">
      {zones.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No delivery charges set</CardTitle>
            <CardDescription>Right now every order ships free, so you pay the courier yourself.</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <TruckIcon />
              <AlertTitle>Start with the usual Bangladesh setup</AlertTitle>
              <AlertDescription>Inside Dhaka <Money value={80} />, outside Dhaka <Money value={150} />. Close to Pathao, Steadfast and RedX rates. You can change both.</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="gap-2">
            <Button onClick={() => setZones(PRESET)}>Use Inside / Outside Dhaka</Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="pb-0">
          <CardHeader><CardTitle>Delivery zones</CardTitle><CardDescription>Dhaka district uses Inside Dhaka. Every other district uses Outside Dhaka.</CardDescription></CardHeader>
          <CardContent className="px-0">
            <Table className="[&_td:first-child]:pl-6 [&_td:last-child]:pr-6 [&_th:first-child]:pl-6 [&_th:last-child]:pr-6">
              <TableHeader><TableRow><TableHead>Zone</TableHead><TableHead className="w-36">Charge</TableHead><TableHead className="w-40">Delivery time</TableHead></TableRow></TableHeader>
              <TableBody>
                {zones.map((z) => (
                  <TableRow key={z.id}>
                    <TableCell className="font-medium">{z.name}<div className="text-xs font-normal text-muted-foreground">{z.districts === "dhaka" ? "Dhaka district" : "All other districts"}</div></TableCell>
                    <TableCell><MoneyInput className="h-8" aria-label={`Charge for ${z.name}`} value={String(z.fee)} onChange={(e) => setZone(z.id, { fee: parseAmount(e.target.value) || 0 })} /></TableCell>
                    <TableCell><Input className="h-8" aria-label={`Delivery time for ${z.name}`} value={z.eta} onChange={(e) => setZone(z.id, { eta: e.target.value })} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle><label htmlFor="free-on">Free delivery over an amount</label></CardTitle>
          <CardDescription>Raises order value. Shoppers see “Add ৳X more for free delivery” in the cart.</CardDescription>
          <CardAction><Switch id="free-on" checked={freeOn} onCheckedChange={setFreeOn} /></CardAction>
        </CardHeader>
        {freeOn && (
          <CardContent>
            <Field className="sm:max-w-60">
              <FieldLabel htmlFor="free">Order total over</FieldLabel>
              <MoneyInput id="free" value={free} onChange={(e) => setFree(e.target.value)} placeholder="3000" />
            </Field>
          </CardContent>
        )}
      </Card>
      <SaveRow dirty={dirty} onReset={() => { setZones(state.zones); setFree(state.freeDeliveryOver ? String(state.freeDeliveryOver) : ""); setFreeOn(state.freeDeliveryOver !== null) }}
        onSave={() => { set((s) => ({ ...s, zones, freeDeliveryOver: freeOn ? parseAmount(free) || null : null })); toast.success("Delivery charges saved") }} />
    </SettingsLayout>
  )
}

/* ---------- Payments ---------- */

export function PaymentsSettingsPage() {
  const { state, set } = useApp()
  const [p, setP] = useState<Payments>(state.payments)
  const [tried, setTried] = useState(false)
  const dirty = JSON.stringify(p) !== JSON.stringify(state.payments)
  const bad = (w: "bkash" | "nagad") => p[w].enabled && !isValidBdPhone(cleanPhone(p[w].number))
  const wallet = (w: "bkash" | "nagad", label: string) => (
    <Card>
      <CardHeader>
        <CardTitle><label htmlFor={`${w}-on`}>{label}</label></CardTitle>
        <CardDescription>Shoppers send money to your {label} number and enter the transaction ID at checkout.</CardDescription>
        <CardAction><Switch id={`${w}-on`} checked={p[w].enabled} onCheckedChange={(v) => setP({ ...p, [w]: { ...p[w], enabled: v } })} /></CardAction>
      </CardHeader>
      {p[w].enabled && (
        <CardContent>
          <FieldGroup>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field data-invalid={(tried && bad(w)) || undefined}>
                <FieldLabel htmlFor={`${w}-no`}>{label} number</FieldLabel>
                <Input id={`${w}-no`} type="tel" inputMode="tel" placeholder="01XXXXXXXXX" value={p[w].number} onChange={(e) => setP({ ...p, [w]: { ...p[w], number: e.target.value } })} aria-invalid={(tried && bad(w)) || undefined} />
                {tried && bad(w) && <FieldError>Enter an 11-digit number starting with 01.</FieldError>}
              </Field>
              <Field>
                <FieldLabel htmlFor={`${w}-type`}>Account type</FieldLabel>
                <Select value={p[w].type} onValueChange={(v) => setP({ ...p, [w]: { ...p[w], type: v as "personal" | "merchant" } })}>
                  <SelectTrigger id={`${w}-type`} className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="personal">Personal (Send Money)</SelectItem><SelectItem value="merchant">Merchant (Payment)</SelectItem></SelectContent>
                </Select>
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      )}
    </Card>
  )
  return (
    <SettingsLayout active="settings-payments" title="Payments" description="How shoppers pay. Most pay cash on delivery. Wallets let you take money before you ship.">
      <Card>
        <CardHeader>
          <CardTitle><label htmlFor="cod-on">Cash on delivery</label></CardTitle>
          <CardDescription>The courier collects cash and pays you after delivery.</CardDescription>
          <CardAction><Switch id="cod-on" checked={p.cod} onCheckedChange={(v) => setP({ ...p, cod: v })} /></CardAction>
        </CardHeader>
        {p.cod && (
          <CardContent>
            <ChoiceCardGroup name="advance" aria-label="Advance payment" value={p.advanceDelivery ? "advance" : "none"} onValueChange={(v) => setP({ ...p, advanceDelivery: v === "advance" })} choices={[
              { value: "none", title: "Full cash on delivery", description: "Easiest for shoppers. More fake orders." },
              { value: "advance", title: "Delivery charge in advance", description: "Shopper pays only the delivery charge by bKash or Nagad first. Fewer fake orders." },
            ]} />
            {p.advanceDelivery && !p.bkash.enabled && !p.nagad.enabled && (
              <Alert><InfoIcon /><AlertDescription>Turn on bKash or Nagad below so shoppers can pay the delivery charge.</AlertDescription></Alert>
            )}
          </CardContent>
        )}
      </Card>
      {wallet("bkash", "bKash")}
      {wallet("nagad", "Nagad")}
      <Card>
        <CardHeader>
          <CardTitle>Cards and online banking</CardTitle>
          <CardDescription>Visa, Mastercard, and bank payments through SSLCommerz.</CardDescription>
          <CardAction><Badge variant="muted">Coming soon</Badge></CardAction>
        </CardHeader>
      </Card>
      <SaveRow dirty={dirty} onReset={() => { setP(state.payments); setTried(false) }} onSave={() => {
        setTried(true)
        if (bad("bkash") || bad("nagad")) { toast.error("Fix the wallet numbers to save."); return }
        if (!p.cod && !p.bkash.enabled && !p.nagad.enabled) { toast.error("Keep at least one way to pay."); return }
        set((s) => ({ ...s, payments: { ...p, bkash: { ...p.bkash, number: cleanPhone(p.bkash.number) }, nagad: { ...p.nagad, number: cleanPhone(p.nagad.number) } } }))
        toast.success("Payment settings saved")
      }} />
    </SettingsLayout>
  )
}

/* ---------- Team ---------- */

const ROLE_HELP: Record<Member["role"], string> = { Owner: "Everything, including billing and other owners.", Admin: "Settings, staff, products and orders.", Staff: "Products, orders and customers. No settings." }

export function TeamSettingsPage() {
  const { state, set } = useApp()
  const [open, setOpen] = useState(false)
  const [contact, setContact] = useState("")
  const [role, setRole] = useState<Member["role"]>("Staff")
  const [tried, setTried] = useState(false)
  const valid = /\S+@\S+\.\S+/.test(contact) || isValidBdPhone(cleanPhone(contact))
  return (
    <SettingsLayout active="settings-team" title="Team" description="People who help run the store. Each sees only what their role allows."
      actions={<Button onClick={() => { setOpen(true); setTried(false); setContact("") }}><PlusIcon />Invite</Button>}>
      <Card className="pb-0">
        <CardHeader><CardTitle>Members</CardTitle><CardDescription>{state.team.filter((m) => !m.pending).length} active, {state.team.filter((m) => m.pending).length} invited</CardDescription></CardHeader>
        <CardContent className="px-0">
          <Table className="[&_td:first-child]:pl-6 [&_td:last-child]:pr-6 [&_th:first-child]:pl-6 [&_th:last-child]:pr-6">
            <TableHeader><TableRow><TableHead>Person</TableHead><TableHead>Role</TableHead><TableHead className="w-12"><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
            <TableBody>
              {state.team.map((m) => (
                <TableRow key={m.id}>
                  <TableCell><div className="font-medium">{m.name}</div><div className="text-xs text-muted-foreground">{m.contact}</div></TableCell>
                  <TableCell><div className="flex items-center gap-2">{m.role}{m.pending && <Badge variant="warning">Invited</Badge>}</div></TableCell>
                  <TableCell>{m.role !== "Owner" && <Button variant="ghost" size="icon-sm" aria-label={`Remove ${m.name}`} onClick={() => { set((s) => ({ ...s, team: s.team.filter((x) => x.id !== m.id) })); toast(`${m.name} removed`) }}><TrashIcon /></Button>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>What each role can do</CardTitle></CardHeader>
        <CardContent>
          <dl className="flex flex-col gap-4 text-sm">
            {(Object.keys(ROLE_HELP) as Member["role"][]).map((r) => <div key={r} className="grid gap-1 sm:grid-cols-[96px_1fr] sm:gap-4"><dt className="font-medium">{r}</dt><dd className="text-muted-foreground">{ROLE_HELP[r]}</dd></div>)}
          </dl>
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Invite a team member</DialogTitle><DialogDescription>They get an SMS or email with a link to join.</DialogDescription></DialogHeader>
          <FieldGroup>
            <Field data-invalid={(tried && !valid) || undefined}>
              <FieldLabel htmlFor="inv">Phone or email</FieldLabel>
              <Input id="inv" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="01XXXXXXXXX" aria-invalid={(tried && !valid) || undefined} />
              {tried && !valid && <FieldError>Enter a mobile number or an email address.</FieldError>}
            </Field>
            <Field>
              <FieldLabel>Role</FieldLabel>
              <ChoiceCardGroup name="role" aria-label="Role" value={role} onValueChange={setRole} choices={(["Staff", "Admin"] as const).map((r) => ({ value: r, title: r, description: ROLE_HELP[r] }))} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              setTried(true)
              if (!valid) return
              set((s) => ({ ...s, team: [...s.team, { id: uid(), name: contact.includes("@") ? contact.split("@")[0] : cleanPhone(contact), contact: contact.includes("@") ? contact : cleanPhone(contact), role, pending: true }] }))
              setOpen(false); toast.success("Invite sent")
            }}>Send invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingsLayout>
  )
}

/* ---------- Domain ---------- */

export function DomainSettingsPage() {
  const { state, set } = useApp()
  const [name, setName] = useState("")
  const [tried, setTried] = useState(false)
  const valid = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(name.trim().replace(/^https?:\/\//, ""))
  const d = state.domain
  const copy = (v: string) => { navigator.clipboard?.writeText(v).catch(() => {}); toast("Copied") }
  return (
    <SettingsLayout active="settings-domains" title="Domain" description={`Your store is at ${state.store.handle}.ghuri.store. You can add your own address too.`}>
      {!d ? (
        <Card>
          <CardHeader><CardTitle>Step 1 of 3: Enter your domain</CardTitle><CardDescription>Buy one from a provider like Namecheap or a local seller first.</CardDescription></CardHeader>
          <CardContent>
            <Field data-invalid={(tried && !valid) || undefined} className="sm:max-w-sm">
              <FieldLabel htmlFor="dom">Domain</FieldLabel>
              <Input id="dom" placeholder="www.yourbrand.com" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={(tried && !valid) || undefined} />
              {tried && !valid ? <FieldError>Enter a domain like www.yourbrand.com</FieldError> : <FieldDescription>Use the www version.</FieldDescription>}
            </Field>
          </CardContent>
          <CardFooter><Button onClick={() => { setTried(true); if (valid) set((s) => ({ ...s, domain: { name: name.trim().replace(/^https?:\/\//, "").toLowerCase(), status: "pending" } })) }}>Continue</Button></CardFooter>
        </Card>
      ) : (
        <>
          <Card className="pb-0">
            <CardHeader>
              <CardTitle>{d.status === "connected" ? "Connected" : "Step 2 of 3: Add this record at your domain provider"}</CardTitle>
              <CardDescription>{d.status === "connected" ? `${d.name} now opens your store.` : "Log in where you bought the domain, open DNS settings, and add one CNAME record."}</CardDescription>
              <CardAction><Badge variant={d.status === "connected" ? "success" : "warning"}>{d.status === "connected" ? "Connected" : d.status === "verifying" ? "Checking" : "Waiting"}</Badge></CardAction>
            </CardHeader>
            <CardContent className="px-0">
              <Table className="[&_td:first-child]:pl-6 [&_td:last-child]:pr-6 [&_th:first-child]:pl-6 [&_th:last-child]:pr-6">
                <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Name</TableHead><TableHead>Value</TableHead></TableRow></TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>CNAME</TableCell>
                    <TableCell><span className="font-mono text-xs">www</span></TableCell>
                    <TableCell><span className="flex items-center gap-2"><span className="font-mono text-xs">domains.ghuri.store</span><Button variant="ghost" size="icon-xs" aria-label="Copy value" onClick={() => copy("domains.ghuri.store")}><CopyIcon /></Button></span></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {d.status !== "connected" && (
            <Card>
              <CardHeader><CardTitle>Step 3 of 3: Check the connection</CardTitle><CardDescription>Changes can take up to an hour. We also check every 10 minutes and send you an SMS.</CardDescription></CardHeader>
              <CardFooter className="gap-2">
                <Button onClick={() => { set((s) => ({ ...s, domain: { ...d, status: "verifying" } })); setTimeout(() => { set((s) => ({ ...s, domain: s.domain && { ...s.domain, status: "connected" } })); toast.success("Domain connected") }, 1500) }} disabled={d.status === "verifying"}>
                  {d.status === "verifying" ? "Checking…" : "Check now"}
                </Button>
                <Button variant="ghost" onClick={() => set((s) => ({ ...s, domain: null }))}>Use a different domain</Button>
              </CardFooter>
            </Card>
          )}
          {d.status === "connected" && <Button variant="outline" className="self-start" onClick={() => set((s) => ({ ...s, domain: null }))}>Remove domain</Button>}
        </>
      )}
    </SettingsLayout>
  )
}

/* ---------- AI apps ---------- */

const AI_APPS = [
  { key: "claude", name: "Claude", steps: ["In Claude, open Settings → Connectors → Add custom connector.", "Paste the connector link below.", "Press Connect and choose this store."] },
  { key: "chatgpt", name: "ChatGPT", steps: ["In ChatGPT, open Plugins → Add → Custom MCP server.", "Paste the connector link below and choose OAuth.", "Connect and choose this store."] },
]

export function AiSettingsPage() {
  const { state, set } = useApp()
  const link = "https://admin.ghuricommerce.com/mcp"
  return (
    <SettingsLayout active="settings-ai" title="AI apps" description="Let Claude or ChatGPT add products from photos, answer stock questions and update orders for you.">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><SparklesIcon className="size-4" aria-hidden="true" />What you can ask</CardTitle>
          <CardDescription>“Add these 5 photos as Eid panjabi, ৳1,200, sizes M L XL.” “Which orders are waiting for a call?”</CardDescription>
        </CardHeader>
        <CardContent>
          <Field>
            <FieldLabel htmlFor="mcp">Connector link</FieldLabel>
            <InputGroup>
              <InputGroupInput id="mcp" readOnly value={link} className="font-mono text-xs" />
              <InputGroupAddon align="inline-end"><Button variant="ghost" size="icon-xs" aria-label="Copy link" onClick={() => { navigator.clipboard?.writeText(link).catch(() => {}); toast("Link copied") }}><CopyIcon /></Button></InputGroupAddon>
            </InputGroup>
          </Field>
        </CardContent>
      </Card>
      {AI_APPS.map((a) => {
        const on = state.aiConnected.includes(a.key)
        return (
          <Card key={a.key}>
            <CardHeader>
              <CardTitle>{a.name}</CardTitle>
              <CardDescription>{on ? "Connected. It can read and change this store." : "Not connected"}</CardDescription>
              <CardAction>{on ? <Badge variant="success"><CheckCircle2Icon />Connected</Badge> : null}</CardAction>
            </CardHeader>
            <CardContent>
              <Collapsible>
                <CollapsibleTrigger asChild><Button variant="link" className="h-auto p-0">How to connect {a.name}</Button></CollapsibleTrigger>
                <CollapsibleContent>
                  <ol className="mt-4 flex list-decimal flex-col gap-2 pl-4 text-sm text-muted-foreground">{a.steps.map((s) => <li key={s}>{s}</li>)}</ol>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
            <CardFooter className="gap-2">
              {on ? <Button variant="outline" onClick={() => { set((s) => ({ ...s, aiConnected: s.aiConnected.filter((x) => x !== a.key) })); toast(`${a.name} disconnected`) }}>Disconnect</Button>
                : <Button variant="outline" onClick={() => { set((s) => ({ ...s, aiConnected: [...s.aiConnected, a.key] })); toast.success(`${a.name} connected (prototype)`) }}><ExternalLinkIcon />Connect {a.name}</Button>}
            </CardFooter>
          </Card>
        )
      })}
      <p className="text-sm text-muted-foreground">Using Claude Code or Codex? The developer setup is in the help centre.</p>
    </SettingsLayout>
  )
}

/* ---------- Account ---------- */

const ACCOUNT_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function AccountSettingsPage() {
  const { state, set } = useApp()
  const acc = state.account ?? { name: "", phone: "", email: "" }
  const [form, setForm] = useState(acc)
  const [lang, setLang] = useState("en")
  const dirty = JSON.stringify(form) !== JSON.stringify(acc)
  const [tried, setTried] = useState(false)
  const errs = {
    name: !form.name.trim() ? "Enter your name." : "",
    phone: !form.phone.trim() ? "Enter your mobile number. You use it to log in." : !isValidBdPhone(cleanPhone(form.phone)) ? "Enter an 11-digit number starting with 01, like 01711223344." : "",
    email: form.email.trim() && !ACCOUNT_EMAIL_RE.test(form.email.trim()) ? "Enter a valid email, like name@example.com, or leave it empty." : "",
  }
  const err = (k: keyof typeof errs) => (tried ? errs[k] : "")
  const fieldProps = (k: keyof typeof errs) => ({ "aria-invalid": !!err(k) || undefined, "aria-describedby": err(k) ? `a${k}-error` : k === "phone" ? "aphone-help" : undefined })
  const saveAccount = () => {
    setTried(true)
    const first = (Object.keys(errs) as (keyof typeof errs)[]).find((k) => errs[k])
    if (first) { document.getElementById(`a${first}`)?.focus(); toast.error("Fix the highlighted fields to save."); return }
    const clean = { name: form.name.trim(), phone: cleanPhone(form.phone), email: form.email.trim() }
    set((s) => ({ ...s, account: clean })); setForm(clean); setTried(false); toast.success("Account saved")
  }
  return (
    <SettingsLayout active="settings-account" title="Account" description="Your own login details. Not shown to shoppers.">
      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={!!err("name") || undefined}>
              <FieldLabel htmlFor="aname">Name</FieldLabel>
              <Input id="aname" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} {...fieldProps("name")} />
              {err("name") && <FieldError id="aname-error">{err("name")}</FieldError>}
            </Field>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field data-invalid={!!err("phone") || undefined}>
                <FieldLabel htmlFor="aphone">Mobile number</FieldLabel>
                <Input id="aphone" type="tel" inputMode="tel" placeholder="01XXXXXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} {...fieldProps("phone")} />
                {err("phone") ? <FieldError id="aphone-error">{err("phone")}</FieldError> : <FieldDescription id="aphone-help">Used to log in and for order SMS.</FieldDescription>}
              </Field>
              <Field data-invalid={!!err("email") || undefined}>
                <FieldLabel htmlFor="aemail">Email <span className="font-normal text-muted-foreground">(optional)</span></FieldLabel>
                <Input id="aemail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} {...fieldProps("email")} />
                {err("email") && <FieldError id="aemail-error">{err("email")}</FieldError>}
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Language</CardTitle><CardDescription>Language of this dashboard. Your store has its own setting.</CardDescription></CardHeader>
        <CardContent>
          <ChoiceCardGroup name="lang" columns={2} aria-label="Dashboard language" value={lang} onValueChange={(v) => { setLang(v); if (v === "bn") toast("বাংলা সংস্করণ শীঘ্রই আসছে (prototype)") }} choices={[{ value: "en", title: "English" }, { value: "bn", title: "বাংলা" }]} />
        </CardContent>
      </Card>
      <SaveRow dirty={dirty} onReset={() => { setForm(acc); setTried(false) }} onSave={saveAccount} />
    </SettingsLayout>
  )
}
