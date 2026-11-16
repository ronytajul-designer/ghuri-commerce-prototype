import { useId, useRef, useState } from "react"
import { toast } from "sonner"
import { ArrowSquareOut as ArrowSquareOutI, CaretDown as CaretDownI, CheckCircle as CheckCircleI, Copy as CopyI, Info as InfoI, Plus as PlusI, Sparkle as SparkleI, Trash as TrashI, Truck as TruckI } from "@phosphor-icons/react"
import { outline } from "@/lib/phosphor"
import { SettingsLayoutTuffui } from "@/components/app/settings-layout-tuffui"
import { Money, parseAmount } from "@/components/app/money"
import { useUnsavedGuard } from "@/components/app/unsaved-guard"
import { Button, IconButton } from "@/components/ui/action-button"
import { Radio, RadioGroup, Switch } from "@/components/ui/choice-controls"
import { Dialog } from "@/components/ui/modal-sheet"
import { Select } from "@/components/ui/select-field"
import { Inset, Panel, Shell, ShellHeader } from "@/components/ui/surface"
import { TextArea, TextField } from "@/components/ui/text-field"
import { cleanPhone, isValidBdPhone } from "@/lib/bd"
import { cn } from "@/lib/utils"
import { uid, useApp } from "@/store/store"
import type { Member, Payments, Zone } from "@/store/types"
import { Pill } from "@/pages/products-tuffui-page"

const [ArrowSquareOut, CaretDown, CheckCircle, Copy, Info, Plus, Sparkle, Trash, Truck] = [ArrowSquareOutI, CaretDownI, CheckCircleI, CopyI, InfoI, PlusI, SparkleI, TrashI, TruckI].map(outline)

/* ---------- Shared TuffUI bits ---------- */

/** ShellHeader truncates subtitles; let them wrap. */
const WRAP = "[&_p]:whitespace-normal [&_p]:overflow-visible [&_p]:text-clip"
/** Error text contrast fix (TuffUI text-negative is under 4.5:1 in light mode). */
const ERR = "[&_[id$=-error]]:text-[oklch(0.45_0.2_27)] dark:[&_[id$=-error]]:text-[oklch(0.78_0.14_25)]"
const EDGE = "shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--foreground)_55%,transparent)]"
/** Control boundaries at 3:1 (TuffUI fields are tint-only), same fix as the product form. */
const EDGES = "[&_[role=switch][aria-checked=true]]:bg-[#248a3d] dark:[&_[role=switch][aria-checked=true]]:bg-[#30d158] [&_input]:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--foreground)_55%,transparent)] [&_textarea]:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--foreground)_55%,transparent)] [&_[role=radio][aria-checked=false]]:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--foreground)_55%,transparent)] [&_[role=switch][aria-checked=false]]:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--foreground)_55%,transparent)] [&_[role=combobox]]:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--foreground)_55%,transparent)]"

/** One settings card: Shell with a header row and a content panel. */
function Section({ title, subtitle, aside, children, className }: {
  title: React.ReactNode; subtitle?: React.ReactNode; aside?: React.ReactNode; children?: React.ReactNode; className?: string
}) {
  return (
    <Shell className={cn(ERR, EDGES, className)}>
      <ShellHeader as="h3" title={title} subtitle={subtitle} aside={aside} className={WRAP} />
      {children && <Panel className="flex flex-col gap-4 p-4">{children}</Panel>}
    </Shell>
  )
}

/** TuffUI text control with a fixed prefix or suffix (৳, .ghuri.store). */
function AffixField({ label, description, error, prefix, suffix, className, aside, ...props }: Omit<React.ComponentProps<"input">, "prefix"> & {
  label?: React.ReactNode; description?: React.ReactNode; error?: React.ReactNode; prefix?: string; suffix?: string; aside?: React.ReactNode
}) {
  const id = useId()
  const descId = description && !error ? `${id}-description` : undefined
  const errId = error ? `${id}-error` : undefined
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <label htmlFor={id} className="px-1 text-[0.8125rem] font-medium">{label}</label>}
      <div className={cn("flex h-9 w-full items-center gap-1 rounded-full bg-foreground/[0.06] px-3.5 text-sm transition-[background-color] duration-150 hover:bg-foreground/[0.08] focus-within:bg-foreground/[0.1] focus-within:ring-2 focus-within:ring-ring", EDGE, error && "bg-negative/10")}>
        {prefix && <span className="shrink-0 text-muted-foreground" aria-hidden="true">{prefix}</span>}
        <input {...props} id={id} aria-invalid={error ? true : undefined} aria-describedby={[descId, errId].filter(Boolean).join(" ") || undefined}
          className="h-full min-w-0 flex-1 !shadow-none bg-transparent text-foreground outline-none placeholder:text-muted-foreground" />
        {suffix && <span className="shrink-0 text-muted-foreground" aria-hidden="true">{suffix}</span>}
        {aside}
      </div>
      {descId && <p id={descId} className="px-1 text-xs text-muted-foreground">{description}</p>}
      {errId && <p id={errId} className="px-1 text-xs">{error}</p>}
    </div>
  )
}

function Note({ icon: I = Info, title, children }: { icon?: typeof Info; title?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Inset className="flex items-start gap-3 p-3 text-sm">
      <I className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="flex flex-col gap-0.5">{title && <p className="font-medium">{title}</p>}<p className="text-muted-foreground">{children}</p></div>
    </Inset>
  )
}

/** Radio cards: whole row is clickable, checked row is tinted. */
function ChoiceCards<T extends string>({ label, value, onValueChange, choices, columns = 1 }: {
  label: string; value: T; onValueChange: (v: T) => void; choices: { value: T; title: React.ReactNode; description?: React.ReactNode }[]; columns?: 1 | 2
}) {
  return (
    <RadioGroup label={label} value={value} onValueChange={(v) => onValueChange(v as T)} className={cn("grid gap-2", columns === 2 && "grid-cols-2")}>
      {choices.map((c) => (
        <Radio key={c.value} value={c.value} label={<span className="font-medium">{c.title}</span>} description={c.description}
          className={cn("rounded-xl p-3 transition-colors", value === c.value ? "bg-brand/10" : "bg-foreground/[0.04] hover:bg-foreground/[0.07]")} />
      ))}
    </RadioGroup>
  )
}

/** Save row shared by settings forms. Registers the unsaved-changes guard while dirty. */
function SaveRow({ dirty, onSave, onReset }: { dirty: boolean; onSave: () => void; onReset: () => void }) {
  useUnsavedGuard(dirty)
  return (
    <div className="sticky bottom-20 z-10 flex items-center justify-end gap-2 rounded-full bg-surface/90 p-1.5 pl-4 backdrop-blur md:bottom-4">
      <span className="mr-auto text-sm text-muted-foreground" aria-live="polite">{dirty ? "Unsaved changes" : "All changes saved"}</span>
      <Button variant="secondary" disabled={!dirty} onClick={onReset}>Discard</Button>
      <Button variant="primary" disabled={!dirty} onClick={onSave}>Save</Button>
    </div>
  )
}

const PHONE_ERR = "Enter an 11-digit number starting with 01."
const copyText = (v: string, msg = "Copied") => { navigator.clipboard?.writeText(v).catch(() => {}); toast(msg) }

/* ---------- General ---------- */

export function GeneralSettingsTuffuiPage() {
  const { state, set } = useApp()
  const [form, setForm] = useState(state.store)
  const dirty = JSON.stringify(form) !== JSON.stringify(state.store)
  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value })
  const phoneBad = !!form.phone && !isValidBdPhone(cleanPhone(form.phone))
  const waBad = !!form.whatsapp && !isValidBdPhone(cleanPhone(form.whatsapp))
  const [nameTouched, setNameTouched] = useState(false)
  const nameBad = nameTouched && !form.name.trim()
  const nameRef = useRef<HTMLInputElement>(null)
  return (
    <SettingsLayoutTuffui active="settings-tuffui-general" title="General" description="What shoppers see about your store, and how they reach you.">
      <Section title="Store details">
        <TextField ref={nameRef} label="Store name" value={form.name} onChange={f("name")} onBlur={() => setNameTouched(true)}
          error={nameBad ? "Enter your store name. Shoppers see it at the top of your store." : undefined} />
        <AffixField label="Store address" value={form.handle} readOnly suffix=".ghuri.store"
          description={<>Want your own address like www.yourbrand.com? <a href="#settings-tuffui-domains" className="underline underline-offset-4">Connect a domain</a>.</>} />
      </Section>
      <Section title="Contact" subtitle="Shown on your store, checkout and order SMS. Shoppers in Bangladesh often call before buying.">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Phone" type="tel" inputMode="tel" placeholder="01XXXXXXXXX" value={form.phone} onChange={f("phone")} error={phoneBad ? PHONE_ERR : undefined} />
          <TextField label="WhatsApp" type="tel" inputMode="tel" placeholder="01XXXXXXXXX" value={form.whatsapp} onChange={f("whatsapp")}
            error={waBad ? PHONE_ERR : undefined} description="Adds a WhatsApp button to your store." />
        </div>
        <TextField label="Facebook page" placeholder="facebook.com/yourpage" value={form.facebook} onChange={f("facebook")} />
        <TextField label="Business address" value={form.address} onChange={f("address")} />
      </Section>
      <Section title="Return and exchange policy" subtitle="Shown on every product page and at checkout.">
        <TextArea label={<span className="sr-only">Return and exchange policy</span>} rows={3} value={form.returnPolicy} onChange={f("returnPolicy")} placeholder="e.g. Exchange within 3 days if the size does not fit." />
      </Section>
      <SaveRow dirty={dirty} onReset={() => { setForm(state.store); setNameTouched(false) }} onSave={() => {
        if (!form.name.trim()) { setNameTouched(true); nameRef.current?.focus(); toast.error("Enter your store name to save."); return }
        if (phoneBad || waBad) { toast.error("Fix the phone numbers to save."); return }
        set((s) => ({ ...s, store: { ...form, name: form.name.trim(), phone: form.phone && cleanPhone(form.phone), whatsapp: form.whatsapp && cleanPhone(form.whatsapp) } }))
        toast.success("Store details saved")
      }} />
    </SettingsLayoutTuffui>
  )
}

/* ---------- Shipping ---------- */

const PRESET: Zone[] = [
  { id: "z1", name: "Inside Dhaka", districts: "dhaka", fee: 80, eta: "1 to 2 days" },
  { id: "z2", name: "Outside Dhaka", districts: "rest", fee: 150, eta: "2 to 4 days" },
]

export function ShippingSettingsTuffuiPage() {
  const { state, set } = useApp()
  const [zones, setZones] = useState(state.zones)
  const [free, setFree] = useState(state.freeDeliveryOver ? String(state.freeDeliveryOver) : "")
  const [freeOn, setFreeOn] = useState(state.freeDeliveryOver !== null)
  const freeN = parseAmount(free) ?? null
  const dirty = JSON.stringify(zones) !== JSON.stringify(state.zones) || (freeOn ? Number(freeN) || null : null) !== state.freeDeliveryOver
  const setZone = (id: string, patch: Partial<Zone>) => setZones(zones.map((z) => (z.id === id ? { ...z, ...patch } : z)))
  return (
    <SettingsLayoutTuffui active="settings-tuffui-shipping" title="Shipping" description="Delivery charges shoppers pay. They see the charge as soon as they pick a district.">
      {zones.length === 0 ? (
        <Section title="No delivery charges set" subtitle="Right now every order ships free, so you pay the courier yourself.">
          <Note icon={Truck} title="Start with the usual Bangladesh setup">
            Inside Dhaka <Money value={80} />, outside Dhaka <Money value={150} />. Close to Pathao, Steadfast and RedX rates. You can change both.
          </Note>
          <Button variant="primary" className="self-start" onClick={() => setZones(PRESET)}>Use Inside / Outside Dhaka</Button>
        </Section>
      ) : (
        <Section title="Delivery zones" subtitle="Dhaka district uses Inside Dhaka. Every other district uses Outside Dhaka.">
          <ul className="flex flex-col gap-2">
            {zones.map((z) => (
              <li key={z.id}>
                <Inset className="grid items-end gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_9rem_11rem]">
                  <div className="self-center">
                    <p className="text-sm font-medium">{z.name}</p>
                    <p className="text-xs text-muted-foreground">{z.districts === "dhaka" ? "Dhaka district" : "All other districts"}</p>
                  </div>
                  <AffixField label="Charge" prefix="৳" inputMode="numeric" value={String(z.fee)} aria-label={`Charge for ${z.name}`}
                    onChange={(e) => setZone(z.id, { fee: parseAmount(e.target.value) || 0 })} />
                  <TextField label="Delivery time" aria-label={`Delivery time for ${z.name}`} value={z.eta} onChange={(e) => setZone(z.id, { eta: e.target.value })} />
                </Inset>
              </li>
            ))}
          </ul>
        </Section>
      )}
      <Section title="Free delivery over an amount" subtitle="Raises order value. Shoppers see “Add ৳X more for free delivery” in the cart."
        aside={<Switch aria-label="Free delivery over an amount" checked={freeOn} onCheckedChange={setFreeOn} />}>
        {freeOn && (
          <AffixField className="sm:max-w-60" label="Order total over" prefix="৳" inputMode="numeric" value={free} onChange={(e) => setFree(e.target.value)} placeholder="3000"
/>
        )}
      </Section>
      <SaveRow dirty={dirty} onReset={() => { setZones(state.zones); setFree(state.freeDeliveryOver ? String(state.freeDeliveryOver) : ""); setFreeOn(state.freeDeliveryOver !== null) }}
        onSave={() => {
          set((s) => ({ ...s, zones, freeDeliveryOver: freeOn ? freeN || null : null })); toast.success("Delivery charges saved")
        }} />
    </SettingsLayoutTuffui>
  )
}

/* ---------- Payments ---------- */

export function PaymentsSettingsTuffuiPage() {
  const { state, set } = useApp()
  const [p, setP] = useState<Payments>(state.payments)
  const [tried, setTried] = useState(false)
  const dirty = JSON.stringify(p) !== JSON.stringify(state.payments)
  const bad = (w: "bkash" | "nagad") => p[w].enabled && !isValidBdPhone(cleanPhone(p[w].number))
  const wallet = (w: "bkash" | "nagad", label: string) => (
    <Section title={label} subtitle={`Shoppers send money to your ${label} number and enter the transaction ID at checkout.`}
      aside={<Switch aria-label={label} checked={p[w].enabled} onCheckedChange={(v) => setP({ ...p, [w]: { ...p[w], enabled: v } })} />}>
      {p[w].enabled && (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label={`${label} number`} type="tel" inputMode="tel" placeholder="01XXXXXXXXX" value={p[w].number}
            onChange={(e) => setP({ ...p, [w]: { ...p[w], number: e.target.value } })} error={tried && bad(w) ? PHONE_ERR : undefined} />
          <Select label="Account type" value={p[w].type} onValueChange={(v) => setP({ ...p, [w]: { ...p[w], type: v as "personal" | "merchant" } })}
            options={[{ value: "personal", label: "Personal (Send Money)" }, { value: "merchant", label: "Merchant (Payment)" }]} />
        </div>
      )}
    </Section>
  )
  return (
    <SettingsLayoutTuffui active="settings-tuffui-payments" title="Payments" description="How shoppers pay. Most pay cash on delivery. Wallets let you take money before you ship.">
      <Section title="Cash on delivery" subtitle="The courier collects cash and pays you after delivery."
        aside={<Switch aria-label="Cash on delivery" checked={p.cod} onCheckedChange={(v) => setP({ ...p, cod: v })} />}>
        {p.cod && (
          <>
            <ChoiceCards label="Advance payment" value={p.advanceDelivery ? "advance" : "none"} onValueChange={(v) => setP({ ...p, advanceDelivery: v === "advance" })} choices={[
              { value: "none", title: "Full cash on delivery", description: "Easiest for shoppers. More fake orders." },
              { value: "advance", title: "Delivery charge in advance", description: "Shopper pays only the delivery charge by bKash or Nagad first. Fewer fake orders." },
            ]} />
            {p.advanceDelivery && !p.bkash.enabled && !p.nagad.enabled && (
              <div role="status"><Note>Turn on bKash or Nagad below so shoppers can pay the delivery charge.</Note></div>
            )}
          </>
        )}
      </Section>
      {wallet("bkash", "bKash")}
      {wallet("nagad", "Nagad")}
      <Section title="Cards and online banking" subtitle="Visa, Mastercard, and bank payments through SSLCommerz." aside={<Pill tone="neutral">Coming soon</Pill>} />
      <SaveRow dirty={dirty} onReset={() => { setP(state.payments); setTried(false) }} onSave={() => {
        setTried(true)
        if (bad("bkash") || bad("nagad")) { toast.error("Fix the wallet numbers to save."); return }
        if (!p.cod && !p.bkash.enabled && !p.nagad.enabled) { toast.error("Keep at least one way to pay."); return }
        set((s) => ({ ...s, payments: { ...p, bkash: { ...p.bkash, number: cleanPhone(p.bkash.number) }, nagad: { ...p.nagad, number: cleanPhone(p.nagad.number) } } }))
        setTried(false); toast.success("Payment settings saved")
      }} />
    </SettingsLayoutTuffui>
  )
}

/* ---------- Team ---------- */

const ROLE_HELP: Record<Member["role"], string> = { Owner: "Everything, including billing and other owners.", Admin: "Settings, staff, products and orders.", Staff: "Products, orders and customers. No settings." }

export function TeamSettingsTuffuiPage() {
  const { state, set } = useApp()
  const [open, setOpen] = useState(false)
  const [contact, setContact] = useState("")
  const [role, setRole] = useState<Member["role"]>("Staff")
  const [tried, setTried] = useState(false)
  const valid = /\S+@\S+\.\S+/.test(contact) || isValidBdPhone(cleanPhone(contact))
  const invite = () => {
    setTried(true)
    if (!valid) return
    set((s) => ({ ...s, team: [...s.team, { id: uid(), name: contact.includes("@") ? contact.split("@")[0] : cleanPhone(contact), contact: contact.includes("@") ? contact : cleanPhone(contact), role, pending: true }] }))
    setOpen(false); toast.success("Invite sent")
  }
  return (
    <SettingsLayoutTuffui active="settings-tuffui-team" title="Team" description="People who help run the store. Each sees only what their role allows."
      actions={<Button variant="primary" icon={Plus} onClick={() => { setOpen(true); setTried(false); setContact(""); setRole("Staff") }}>Invite</Button>}>
      <Section title="Members" subtitle={`${state.team.filter((m) => !m.pending).length} active, ${state.team.filter((m) => m.pending).length} invited`}>
        <ul className="flex flex-col gap-1">
          {state.team.map((m) => (
            <li key={m.id}>
              <Inset className="flex items-center gap-3 p-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-raised text-sm font-medium" aria-hidden="true">{(m.name || "?")[0].toUpperCase()}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.contact}</p>
                </div>
                <span className="text-sm">{m.role}</span>
                {m.pending && <Pill tone="warning">Invited</Pill>}
                {m.role !== "Owner" ? (
                  <IconButton icon={Trash} variant="quiet" size="sm" label={`Remove ${m.name}`}
                    onClick={() => { set((s) => ({ ...s, team: s.team.filter((x) => x.id !== m.id) })); toast(`${m.name} removed`) }} />
                ) : <span className="size-8" aria-hidden="true" />}
              </Inset>
            </li>
          ))}
        </ul>
      </Section>
      <Section title="What each role can do">
        <dl className="flex flex-col gap-4 text-sm">
          {(Object.keys(ROLE_HELP) as Member["role"][]).map((r) => <div key={r} className="grid gap-1 sm:grid-cols-[96px_1fr] sm:gap-4"><dt className="font-medium">{r}</dt><dd className="text-muted-foreground">{ROLE_HELP[r]}</dd></div>)}
        </dl>
      </Section>
      <Dialog open={open} onOpenChange={setOpen} title="Invite a team member" description="They get an SMS or email with a link to join."
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button variant="primary" onClick={invite}>Send invite</Button></>}>
        <form className={cn("flex flex-col gap-4", ERR, EDGES)} onSubmit={(e) => { e.preventDefault(); invite() }}>
          <TextField label="Phone or email" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="01XXXXXXXXX"
            error={tried && !valid ? "Enter a mobile number or an email address." : undefined} />
          <div className="flex flex-col gap-1.5">
            <p className="px-1 text-[0.8125rem] font-medium">Role</p>
            <ChoiceCards label="Role" value={role} onValueChange={setRole} choices={(["Staff", "Admin"] as const).map((r) => ({ value: r, title: r, description: ROLE_HELP[r] }))} />
          </div>
        </form>
      </Dialog>
    </SettingsLayoutTuffui>
  )
}

/* ---------- Domain ---------- */

export function DomainSettingsTuffuiPage() {
  const { state, set } = useApp()
  const [name, setName] = useState("")
  const [tried, setTried] = useState(false)
  const valid = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(name.trim().replace(/^https?:\/\//, ""))
  const d = state.domain
  const cont = () => { setTried(true); if (valid) set((s) => ({ ...s, domain: { name: name.trim().replace(/^https?:\/\//, "").toLowerCase(), status: "pending" } })) }
  return (
    <SettingsLayoutTuffui active="settings-tuffui-domains" title="Domain" description={`Your store is at ${state.store.handle}.ghuri.store. You can add your own address too.`}>
      {!d ? (
        <Section title="Step 1 of 3: Enter your domain" subtitle="Buy one from a provider like Namecheap or a local seller first.">
          <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); cont() }}>
            <TextField className="sm:max-w-sm" label="Domain" placeholder="www.yourbrand.com" value={name} onChange={(e) => setName(e.target.value)}
              error={tried && !valid ? "Enter a domain like www.yourbrand.com" : undefined} description="Use the www version." />
            <Button type="submit" variant="primary" className="self-start">Continue</Button>
          </form>
        </Section>
      ) : (
        <>
          <Section
            title={d.status === "connected" ? "Connected" : "Step 2 of 3: Add this record at your domain provider"}
            subtitle={d.status === "connected" ? `${d.name} now opens your store.` : "Log in where you bought the domain, open DNS settings, and add one CNAME record."}
            aside={<Pill tone={d.status === "connected" ? "positive" : "warning"}>{d.status === "connected" ? "Connected" : d.status === "verifying" ? "Checking" : "Waiting"}</Pill>}>
            <Inset className="grid grid-cols-[auto_auto_minmax(0,1fr)] gap-x-6 gap-y-1 p-3 text-sm">
              <span className="text-xs text-muted-foreground">Type</span><span className="text-xs text-muted-foreground">Name</span><span className="text-xs text-muted-foreground">Value</span>
              <span>CNAME</span><span className="font-mono text-xs leading-8">www</span>
              <span className="flex min-w-0 items-center gap-1"><span className="truncate font-mono text-xs">domains.ghuri.store</span>
                <IconButton icon={Copy} variant="quiet" size="sm" label="Copy value" onClick={() => copyText("domains.ghuri.store")} /></span>
            </Inset>
          </Section>
          {d.status !== "connected" && (
            <Section title="Step 3 of 3: Check the connection" subtitle="Changes can take up to an hour. We also check every 10 minutes and send you an SMS.">
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" loading={d.status === "verifying"} disabled={d.status === "verifying"} onClick={() => {
                  set((s) => ({ ...s, domain: { ...d, status: "verifying" } }))
                  setTimeout(() => { set((s) => ({ ...s, domain: s.domain && { ...s.domain, status: "connected" } })); toast.success("Domain connected") }, 1500)
                }}>{d.status === "verifying" ? "Checking…" : "Check now"}</Button>
                <Button variant="quiet" onClick={() => { set((s) => ({ ...s, domain: null })); setTried(false) }}>Use a different domain</Button>
              </div>
            </Section>
          )}
          {d.status === "connected" && <Button variant="secondary" className="self-start" onClick={() => set((s) => ({ ...s, domain: null }))}>Remove domain</Button>}
        </>
      )}
    </SettingsLayoutTuffui>
  )
}

/* ---------- AI apps ---------- */

const AI_APPS = [
  { key: "claude", name: "Claude", steps: ["In Claude, open Settings → Connectors → Add custom connector.", "Paste the connector link below.", "Press Connect and choose this store."] },
  { key: "chatgpt", name: "ChatGPT", steps: ["In ChatGPT, open Plugins → Add → Custom MCP server.", "Paste the connector link below and choose OAuth.", "Connect and choose this store."] },
]

function Steps({ name, steps }: { name: string; steps: string[] }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <div>
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-md text-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">
        How to connect {name}<CaretDown className={cn("size-3.5 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open && <ol id={id} className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-sm text-muted-foreground">{steps.map((s) => <li key={s}>{s}</li>)}</ol>}
    </div>
  )
}

export function AiSettingsTuffuiPage() {
  const { state, set } = useApp()
  const link = "https://admin.ghuricommerce.com/mcp"
  return (
    <SettingsLayoutTuffui active="settings-tuffui-ai" title="AI apps" description="Let Claude or ChatGPT add products from photos, answer stock questions and update orders for you.">
      <Section title={<span className="flex items-center gap-2"><Sparkle className="size-4" aria-hidden="true" />What you can ask</span>}
        subtitle="“Add these 5 photos as Eid panjabi, ৳1,200, sizes M L XL.” “Which orders are waiting for a call?”">
        <AffixField label="Connector link" readOnly value={link} className="[&_input]:font-mono [&_input]:text-xs"
          aside={<IconButton icon={Copy} variant="quiet" size="sm" className="-mr-2.5" label="Copy link" onClick={() => copyText(link, "Link copied")} />} />
      </Section>
      {AI_APPS.map((a) => {
        const on = state.aiConnected.includes(a.key)
        return (
          <Section key={a.key} title={a.name} subtitle={on ? "Connected. It can read and change this store." : "Not connected"}
            aside={on ? <Pill tone="positive"><CheckCircle className="size-3.5" aria-hidden="true" />Connected</Pill> : undefined}>
            <Steps name={a.name} steps={a.steps} />
            <div>
              {on ? <Button variant="secondary" onClick={() => { set((s) => ({ ...s, aiConnected: s.aiConnected.filter((x) => x !== a.key) })); toast(`${a.name} disconnected`) }}>Disconnect</Button>
                : <Button variant="secondary" icon={ArrowSquareOut} onClick={() => { set((s) => ({ ...s, aiConnected: [...s.aiConnected, a.key] })); toast.success(`${a.name} connected (prototype)`) }}>Connect {a.name}</Button>}
            </div>
          </Section>
        )
      })}
      <p className="px-1 text-sm text-muted-foreground">Using Claude Code or Codex? The developer setup is in the help centre.</p>
    </SettingsLayoutTuffui>
  )
}

/* ---------- Account ---------- */

const ACCOUNT_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function AccountSettingsTuffuiPage() {
  const { state, set } = useApp()
  const acc = state.account ?? { name: "", phone: "", email: "" }
  const [form, setForm] = useState(acc)
  const [lang, setLang] = useState("en")
  const dirty = JSON.stringify(form) !== JSON.stringify(acc)
  const [tried, setTried] = useState(false)
  const refs = { name: useRef<HTMLInputElement>(null), phone: useRef<HTMLInputElement>(null), email: useRef<HTMLInputElement>(null) }
  const errs = {
    name: !form.name.trim() ? "Enter your name." : "",
    phone: !form.phone.trim() ? "Enter your mobile number. You use it to log in." : !isValidBdPhone(cleanPhone(form.phone)) ? "Enter an 11-digit number starting with 01, like 01711223344." : "",
    email: form.email.trim() && !ACCOUNT_EMAIL_RE.test(form.email.trim()) ? "Enter a valid email, like name@example.com, or leave it empty." : "",
  }
  const err = (k: keyof typeof errs) => (tried && errs[k]) || undefined
  const saveAccount = () => {
    setTried(true)
    const first = (Object.keys(errs) as (keyof typeof errs)[]).find((k) => errs[k])
    if (first) { refs[first].current?.focus(); toast.error("Fix the highlighted fields to save."); return }
    const clean = { name: form.name.trim(), phone: cleanPhone(form.phone), email: form.email.trim() }
    set((s) => ({ ...s, account: clean })); setForm(clean); setTried(false); toast.success("Account saved")
  }
  return (
    <SettingsLayoutTuffui active="settings-tuffui-account" title="Account" description="Your own login details. Not shown to shoppers.">
      <Section title="Profile">
        <TextField ref={refs.name} label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={err("name")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField ref={refs.phone} label="Mobile number" type="tel" inputMode="tel" placeholder="01XXXXXXXXX" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })} error={err("phone")} description="Used to log in and for order SMS." />
          <TextField ref={refs.email} label={<>Email <span className="font-normal text-muted-foreground">(optional)</span></>} type="email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} error={err("email")} />
        </div>
      </Section>
      <Section title="Language" subtitle="Language of this dashboard. Your store has its own setting.">
        <ChoiceCards label="Dashboard language" columns={2} value={lang} onValueChange={(v) => { setLang(v); if (v === "bn") toast("বাংলা সংস্করণ শীঘ্রই আসছে (prototype)") }}
          choices={[{ value: "en", title: "English" }, { value: "bn", title: "বাংলা" }]} />
      </Section>
      <SaveRow dirty={dirty} onReset={() => { setForm(acc); setTried(false) }} onSave={saveAccount} />
    </SettingsLayoutTuffui>
  )
}
