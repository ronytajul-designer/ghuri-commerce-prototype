import { useId, useRef, useState } from "react"
import { toast } from "sonner"
import { AnimatePresence, motion, MotionConfig } from "motion/react"
import { CheckCircle, Eye, EyeSlash, WarningCircle } from "@phosphor-icons/react"
import { Button as ActionButton, IconButton } from "@/components/ui/action-button"
import { Panel, Shell } from "@/components/ui/surface"
import { TextField } from "@/components/ui/text-field"
import { ThemeMenu } from "@/components/app/app-shell-tuffui"
import { NEGATIVE_TEXT } from "@/components/app/order-bits-tuffui"
import { EDGE, EDGES } from "@/pages/storefront-tuffui-pages"
import { cleanPhone, isValidBdPhone, slugify } from "@/lib/bd"
import { enter } from "@/lib/motion-tokens"
import { outline } from "@/lib/phosphor"
import { cn } from "@/lib/utils"
import { useApp } from "@/store/store"
import { emptyState } from "@/store/seed"

/* ---------- Validation (same rules as auth-pages) ---------- */

const TAKEN = ["tajul-1", "shop", "store", "admin", "ghuri"]
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const phoneError = (v: string) => {
  if (!v.trim()) return "Enter your mobile number"
  return isValidBdPhone(cleanPhone(v)) ? "" : "Enter an 11-digit number starting with 01, like 01711223344"
}
const passwordError = (v: string) => {
  if (!v) return "Enter a password"
  return v.length < 8 ? "Password must be at least 8 characters" : ""
}
const handleError = (v: string) => {
  if (!v) return "Choose a web address for your store"
  if (!/^[a-z0-9-]+$/.test(v)) return "Use only English letters, numbers and hyphens"
  if (v.length < 3 || v.length > 30) return "Use 3 to 30 characters"
  if (v.startsWith("-") || v.endsWith("-")) return "Don’t start or end with a hyphen"
  return ""
}
function identifierError(v: string) {
  const t = v.trim()
  if (!t) return "Enter your mobile number or email"
  if (t.includes("@")) return EMAIL_RE.test(t) ? "" : "Enter a valid email, like name@example.com"
  return isValidBdPhone(cleanPhone(t)) ? "" : "Enter a mobile number like 01711223344, or an email"
}
const normaliseIdentifier = (v: string) => (v.trim().includes("@") ? v.trim().toLowerCase() : cleanPhone(v))

function handleFrom(name: string, seed: string) {
  const s = slugify(name, seed)
  const h = s === `item-${seed}` ? `store-${seed}` : s
  return h.slice(0, 30).replace(/-+$/, "")
}

/* ---------- Layout ---------- */

function AuthLayout({ title, description, children, footer }: { title: string; description: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <div className={cn("relative flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-4 py-16", EDGES)}>
        <div className="absolute top-2 right-2 md:top-4 md:right-4"><ThemeMenu /></div>
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-xl bg-foreground text-base font-semibold text-background" aria-hidden="true">G</div>
          <span className="text-base font-semibold">Ghuri Commerce</span>
        </div>
        <motion.main className="w-full max-w-sm" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={enter}>
          <Shell>
            <div className="flex flex-col gap-1 px-3.5 pt-3 pb-4">
              <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <Panel className="p-4">{children}</Panel>
            {footer && <div className="flex justify-center px-4 py-2 text-center text-sm text-muted-foreground">{footer}</div>}
          </Shell>
        </motion.main>
      </div>
    </MotionConfig>
  )
}

function TextLink({ className, ...props }: React.ComponentProps<"a">) {
  return <a className={cn("inline-flex min-h-6 items-center font-medium text-foreground underline underline-offset-4 hover:no-underline", className)} {...props} />
}

function Notice({ tone, title, children }: { tone: "positive" | "negative"; title: string; children?: React.ReactNode }) {
  const Icon = tone === "positive" ? CheckCircle : WarningCircle
  return (
    <motion.div role={tone === "negative" ? "alert" : "status"} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={enter}
      className={cn("flex gap-2 rounded-xl p-4 text-sm", tone === "negative" ? "bg-negative/10" : "bg-foreground/[0.04]")}>
      <Icon className={cn("mt-0.5 size-4 shrink-0", tone === "negative" && NEGATIVE_TEXT)} aria-hidden="true" />
      <div className="flex flex-col gap-1"><span className={cn("font-medium", tone === "negative" && NEGATIVE_TEXT)}>{title}</span>{children && <span className="text-muted-foreground">{children}</span>}</div>
    </motion.div>
  )
}

function Or() {
  return <div className="flex items-center gap-4 text-xs text-muted-foreground" aria-hidden="true"><span className="h-px flex-1 bg-foreground/[0.08]" />or<span className="h-px flex-1 bg-foreground/[0.08]" /></div>
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.2 3.5-8.8Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.8 3.6-4.9 6.7-4.9Z" />
    </svg>
  )
}

function GoogleButton() {
  return (
    <ActionButton variant="secondary" size="md" className="w-full" onClick={() => toast("Google sign-in is not part of this prototype. Use your mobile number.")}>
      <GoogleIcon /> Continue with Google
    </ActionButton>
  )
}

/** TuffUI field with a trailing addon (suffix text or an icon button), same wiring as TextField. */
function AffixField({ label, labelAside, description, error, status, end, inputRef, ...props }: Omit<React.ComponentProps<"input">, "className"> & {
  label: React.ReactNode; labelAside?: React.ReactNode; description?: React.ReactNode; error?: string; status?: React.ReactNode; end: React.ReactNode
  inputRef?: React.Ref<HTMLInputElement>
}) {
  const id = useId()
  const describedBy = [status ? `${id}-status` : "", error ? `${id}-error` : description ? `${id}-desc` : ""].filter(Boolean).join(" ") || undefined
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2 px-1">
        <label htmlFor={id} className="text-[0.8125rem] font-medium">{label}</label>
        {labelAside}
      </div>
      <div className={cn("flex h-9 items-center rounded-full bg-foreground/[0.06] pr-0.5 transition-[background-color] duration-150 focus-within:bg-foreground/[0.1] hover:bg-foreground/[0.08]", EDGE, error && "bg-negative/10")}>
        <input id={id} data-affix="" ref={inputRef} aria-invalid={error ? "true" : undefined} aria-describedby={describedBy} {...props}
          className="h-full min-w-0 flex-1 bg-transparent pl-3.5 text-sm text-foreground outline-none placeholder:text-muted-foreground" />
        {end}
      </div>
      {status && <div id={`${id}-status`} aria-live="polite" className="px-1 text-xs">{status}</div>}
      {error ? <p id={`${id}-error`} className={cn("px-1 text-xs", NEGATIVE_TEXT)}>{error}</p>
        : description ? <p id={`${id}-desc`} className="px-1 text-xs text-muted-foreground">{description}</p> : null}
    </div>
  )
}

function PasswordField(props: { label: string; labelAside?: React.ReactNode; value: string; onChange: (v: string) => void; onBlur: () => void; error?: string; description?: string; autoComplete: string; inputRef?: React.Ref<HTMLInputElement> }) {
  const [show, setShow] = useState(false)
  return (
    <AffixField label={props.label} labelAside={props.labelAside} type={show ? "text" : "password"} value={props.value} autoComplete={props.autoComplete}
      onChange={(e) => props.onChange(e.target.value)} onBlur={props.onBlur} error={props.error} description={props.description} inputRef={props.inputRef}
      end={<IconButton icon={outline(show ? EyeSlash : Eye)} label="Show password" aria-pressed={show} onClick={() => setShow((s) => !s)} />} />
  )
}

/* ---------- Signup ---------- */

type SignupField = "phone" | "name" | "storeName" | "handle" | "password"

export function SignupTuffuiPage() {
  const { set } = useApp()
  const [seed] = useState(() => Math.random().toString(16).slice(2, 7))
  const [v, setV] = useState({ phone: "", name: "", storeName: "", handle: "", password: "" })
  const [handleEdited, setHandleEdited] = useState(false)
  const [touched, setTouched] = useState<Partial<Record<SignupField, boolean>>>({})
  const refs = {
    phone: useRef<HTMLInputElement>(null), name: useRef<HTMLInputElement>(null), storeName: useRef<HTMLInputElement>(null),
    handle: useRef<HTMLInputElement>(null), password: useRef<HTMLInputElement>(null),
  }

  const errors: Record<SignupField, string> = {
    phone: phoneError(v.phone),
    name: v.name.trim() ? "" : "Enter your name",
    storeName: v.storeName.trim() ? "" : "Enter your store name",
    handle: handleError(v.handle),
    password: passwordError(v.password),
  }
  const show = (k: SignupField) => (touched[k] && !(k === "handle" && !v.handle && !v.storeName.trim()) ? errors[k] : "")
  const blur = (k: SignupField) => () => setTouched((t) => ({ ...t, [k]: true }))

  const isAuto = !handleEdited && v.handle === `store-${seed}`
  const taken = !errors.handle && TAKEN.includes(v.handle)
  const suggestion = taken ? `${v.handle}-${seed.slice(0, 3)}` : ""

  const setStoreName = (name: string) => setV((s) => ({ ...s, storeName: name, handle: handleEdited ? s.handle : handleFrom(name, seed) }))
  const setHandle = (raw: string) => {
    const h = raw.toLowerCase().replace(/\s+/g, "-")
    setHandleEdited(h !== "")
    setV((s) => ({ ...s, handle: h }))
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ phone: true, name: true, storeName: true, handle: true, password: true })
    const order: SignupField[] = ["phone", "name", "storeName", "handle", "password"]
    const first = order.find((k) => errors[k] || (k === "handle" && taken))
    if (first) { refs[first].current?.focus(); return }
    set(() => emptyState({ name: v.name.trim(), phone: cleanPhone(v.phone), email: "" }, v.storeName.trim(), v.handle))
    window.location.hash = "home-tuffui"
    toast.success("Your store is ready. Let’s set it up.")
  }

  const handleStatus = show("handle") ? null
    : taken ? (
      <p className={NEGATIVE_TEXT}>
        Taken, try{" "}
        <button type="button" className="inline-flex min-h-6 items-center font-medium underline underline-offset-4"
          onClick={() => { setHandleEdited(true); setV((s) => ({ ...s, handle: suggestion })) }}>{suggestion}</button>
      </p>
    ) : v.handle && !errors.handle ? (
      <p className="flex items-center gap-1 font-medium text-foreground"><CheckCircle className="size-3.5" aria-hidden="true" /> Available</p>
    ) : null

  return (
    <AuthLayout title="Create your store" description="Start selling in a few minutes. No card needed."
      footer={<p>Already have a store? <TextLink href="#login-tuffui" className="min-h-10">Log in</TextLink></p>}>
      <form noValidate onSubmit={submit} className="flex flex-col gap-4">
        <GoogleButton />
        <Or />
        <TextField label="Mobile number" ref={refs.phone} type="tel" inputMode="tel" autoComplete="tel" placeholder="01711223344"
          value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} onBlur={blur("phone")} error={show("phone") || undefined}
          description="You’ll log in with this number. Bangla digits work too." />
        <TextField label="Your name" ref={refs.name} autoComplete="name" value={v.name}
          onChange={(e) => setV({ ...v, name: e.target.value })} onBlur={blur("name")} error={show("name") || undefined} />
        <TextField label="Store name" ref={refs.storeName} autoComplete="organization" placeholder="Tajul Fashion" value={v.storeName}
          onChange={(e) => setStoreName(e.target.value)} onBlur={blur("storeName")} error={show("storeName") || undefined} />
        <AffixField label="Store web address" inputRef={refs.handle} autoCapitalize="none" autoCorrect="off" spellCheck={false}
          placeholder="your-store" value={v.handle} maxLength={40} onChange={(e) => setHandle(e.target.value)} onBlur={blur("handle")}
          error={show("handle") || undefined} status={handleStatus}
          aria-invalid={!!show("handle") || taken || undefined}
          end={<span className="pr-3.5 pl-1 text-sm text-muted-foreground">.ghuri.store</span>}
          description={isAuto ? "Bangla names get an automatic address. You can change it."
            : v.handle && !taken && !errors.handle ? <>Your shop link: <span className="font-medium break-all text-foreground">{v.handle}.ghuri.store</span></>
              : "Fills in from your store name. Letters, numbers and hyphens."} />
        <PasswordField label="Password" inputRef={refs.password} value={v.password} autoComplete="new-password"
          onChange={(p) => setV({ ...v, password: p })} onBlur={blur("password")} error={show("password") || undefined} description="At least 8 characters" />
        <ActionButton type="submit" variant="primary" size="md" className="w-full">Create store</ActionButton>
        <p className="text-center text-sm text-muted-foreground">
          By creating a store you agree to the <TextLink href="#signup-tuffui">Terms</TextLink> and <TextLink href="#signup-tuffui">Privacy Policy</TextLink>
        </p>
      </form>
    </AuthLayout>
  )
}

/* ---------- Login and reset ---------- */

export function LoginTuffuiPage() {
  const [view, setView] = useState<"login" | "reset" | "sent">("login")
  const [id, setId] = useState("")
  const [password, setPassword] = useState("")
  const [touched, setTouched] = useState({ id: false, password: false })
  const [failed, setFailed] = useState(false)
  const idRef = useRef<HTMLInputElement>(null)
  const pwRef = useRef<HTMLInputElement>(null)
  const codeRef = useRef<HTMLInputElement>(null)
  const newPwRef = useRef<HTMLInputElement>(null)
  const [code, setCode] = useState("")
  const [newPw, setNewPw] = useState("")
  const [resetTouched, setResetTouched] = useState({ code: false, pw: false })
  const [updated, setUpdated] = useState(false)
  const codeError = (v: string) => (!v.trim() ? "Enter the 6-digit code from the SMS" : /^\d{6}$/.test(cleanPhone(v)) ? "" : "The code is 6 digits, like 123456")
  const newPwError = (v: string) => (!v ? "Enter a new password" : passwordError(v))
  const codeErr = resetTouched.code ? codeError(code) : ""
  const newPwErr = resetTouched.pw ? newPwError(newPw) : ""
  const idErr = touched.id ? identifierError(id) : ""
  const pwErr = touched.password ? (password ? passwordError(password) : "Enter your password") : ""

  const go = (next: typeof view) => {
    setView(next)
    setFailed(false)
    setTouched({ id: false, password: false })
    if (next !== "login") setUpdated(false)
    setCode(""); setNewPw(""); setResetTouched({ code: false, pw: false })
    requestAnimationFrame(() => (next === "sent" ? codeRef.current : idRef.current)?.focus())
  }

  const login = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ id: true, password: true })
    const ie = identifierError(id)
    const pe = password ? passwordError(password) : "Enter your password"
    if (ie) { setFailed(false); idRef.current?.focus(); return }
    if (pe) { setFailed(false); pwRef.current?.focus(); return }
    if (normaliseIdentifier(id) === "01999999999") { setFailed(true); return }
    window.location.hash = "home-tuffui"
    toast.success("Welcome back")
  }

  const sendCode = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched((t) => ({ ...t, id: true }))
    if (identifierError(id)) { idRef.current?.focus(); return }
    go("sent")
  }

  const updatePassword = (e: React.FormEvent) => {
    e.preventDefault()
    setResetTouched({ code: true, pw: true })
    if (codeError(code)) { codeRef.current?.focus(); return }
    if (newPwError(newPw)) { newPwRef.current?.focus(); return }
    setPassword("")
    go("login")
    setUpdated(true)
  }

  const idField = (
    <TextField label="Mobile number or email" ref={idRef} type="text" inputMode="email" autoComplete="username" autoCapitalize="none" spellCheck={false}
      placeholder="01711223344" value={id} error={idErr || undefined}
      onChange={(e) => { setId(e.target.value); setFailed(false) }} onBlur={() => setTouched((t) => ({ ...t, id: true }))} />
  )

  if (view !== "login") {
    return (
      <AuthLayout title="Reset your password" description="We’ll send a code by SMS"
        footer={<ActionButton variant="quiet" size="md" onClick={() => go("login")} className="underline underline-offset-4">Back to log in</ActionButton>}>
        <AnimatePresence mode="wait" initial={false}>
          {view === "reset" ? (
            <motion.form key="reset" noValidate onSubmit={sendCode} className="flex flex-col gap-4" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={enter}>
              {idField}
              <ActionButton type="submit" variant="primary" size="md" className="w-full">Send code</ActionButton>
            </motion.form>
          ) : (
            <motion.form key="sent" noValidate onSubmit={updatePassword} className="flex flex-col gap-4" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={enter}>
              <Notice tone="positive" title={`Code sent to ${normaliseIdentifier(id)}`}>It can take a minute to arrive. Use it to set a new password.</Notice>
              <TextField label="6-digit code" ref={codeRef} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="123456" value={code}
                onChange={(e) => setCode(e.target.value)} onBlur={() => setResetTouched((t) => ({ ...t, code: true }))} error={codeErr || undefined} />
              <PasswordField label="New password" inputRef={newPwRef} value={newPw} autoComplete="new-password"
                onChange={setNewPw} onBlur={() => setResetTouched((t) => ({ ...t, pw: true }))} error={newPwErr || undefined} description="At least 8 characters" />
              <ActionButton type="submit" variant="primary" size="md" className="w-full">Update password</ActionButton>
              <ActionButton variant="secondary" size="md" className="w-full" onClick={() => go("reset")}>Send a new code</ActionButton>
            </motion.form>
          )}
        </AnimatePresence>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Log in" description="Manage your store."
      footer={<p>New to Ghuri Commerce? <TextLink href="#signup-tuffui" className="min-h-10">Create a store</TextLink></p>}>
      <form noValidate onSubmit={login} className="flex flex-col gap-4">
        {updated && !failed && <Notice tone="positive" title="Password updated. Log in with your new password." />}
        {failed && <Notice tone="negative" title="Couldn’t log you in">That number or password is not right. Try again or reset your password.</Notice>}
        <GoogleButton />
        <Or />
        {idField}
        <PasswordField label="Password" inputRef={pwRef} value={password} autoComplete="current-password"
          labelAside={<button type="button" className="inline-flex min-h-6 items-center text-[0.8125rem] font-medium underline underline-offset-4 hover:no-underline" onClick={() => go("reset")}>Forgot password?</button>}
          onChange={(p) => { setPassword(p); setFailed(false) }} onBlur={() => setTouched((t) => ({ ...t, password: true }))} error={pwErr || undefined} />
        <ActionButton type="submit" variant="primary" size="md" className="w-full">Log in</ActionButton>
      </form>
    </AuthLayout>
  )
}
