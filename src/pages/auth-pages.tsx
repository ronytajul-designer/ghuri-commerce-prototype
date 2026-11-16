import { useRef, useState } from "react"
import { AlertCircleIcon, CheckCircle2Icon, EyeIcon, EyeOffIcon } from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { ModeToggle } from "@/components/mode-toggle"
import { cleanPhone, isValidBdPhone, slugify } from "@/lib/bd"
import { useApp } from "@/store/store"
import { emptyState } from "@/store/seed"

/* ---------- Validation ---------- */

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
/** Login accepts a BD mobile number or an email address. */
function identifierError(v: string) {
  const t = v.trim()
  if (!t) return "Enter your mobile number or email"
  if (t.includes("@")) return EMAIL_RE.test(t) ? "" : "Enter a valid email, like name@example.com"
  return isValidBdPhone(cleanPhone(t)) ? "" : "Enter a mobile number like 01711223344, or an email"
}
const normaliseIdentifier = (v: string) => (v.trim().includes("@") ? v.trim().toLowerCase() : cleanPhone(v))

/** Store name to handle. Bangla names are transliterated; anything left empty gets "store-xxxxx". */
function handleFrom(name: string, seed: string) {
  const s = slugify(name, seed)
  const h = s === `item-${seed}` ? `store-${seed}` : s
  return h.slice(0, 30).replace(/-+$/, "")
}

/* ---------- Shared layout ---------- */

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/40 p-4 py-16">
      <div className="absolute top-2 right-2 md:top-4 md:right-4"><ModeToggle /></div>
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-base font-semibold text-primary-foreground" aria-hidden="true">G</div>
        <span className="text-base font-semibold">Ghuri Commerce</span>
      </div>
      <main className="w-full max-w-sm">{children}</main>
    </div>
  )
}

function Heading({ title, description }: { title: string; description: string }) {
  return (
    <CardHeader>
      <CardTitle><h1 className="text-xl font-semibold tracking-tight">{title}</h1></CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
  )
}

/** Text link with a 24px minimum hit area. */
function TextLink({ className, ...props }: React.ComponentProps<"a">) {
  return <a className={cn("inline-flex min-h-6 items-center font-medium text-primary underline underline-offset-4 hover:no-underline", className)} {...props} />
}

function FooterLink({ text, link, href }: { text: string; link: string; href: string }) {
  return (
    <CardFooter className="justify-center text-center text-sm text-muted-foreground">
      <p>{text}{" "}<TextLink href={href} className="min-h-10">{link}</TextLink></p>
    </CardFooter>
  )
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
    <Button type="button" variant="outline" className="w-full" onClick={() => toast("Google sign-in is not part of this prototype. Use your mobile number.")}>
      <GoogleIcon /> Continue with Google
    </Button>
  )
}

function PasswordInput({ id, value, onChange, onBlur, error, autoComplete, describedBy, inputRef }: {
  id: string; value: string; onChange: (v: string) => void; onBlur: () => void; error: string
  autoComplete: string; describedBy?: string; inputRef?: React.Ref<HTMLInputElement>
}) {
  const [show, setShow] = useState(false)
  return (
    <InputGroup>
      <InputGroupInput
        id={id} ref={inputRef} type={show ? "text" : "password"} value={value} autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)} onBlur={onBlur}
        aria-invalid={!!error || undefined} aria-describedby={describedBy}
      />
      <InputGroupAddon align="inline-end" className="py-0 pr-0 has-[>button]:mr-0">
        <InputGroupButton
          size="icon-sm" className="-my-px h-10 w-10 rounded-l-none"
          aria-label="Show password" aria-pressed={show} aria-controls={id}
          onClick={() => setShow((s) => !s)}
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}

/* ---------- Signup ---------- */

type SignupField = "phone" | "name" | "storeName" | "handle" | "password"

export function SignupPage() {
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
  // An empty address only needs its own message once there is a store name to build it from.
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
    const phone = cleanPhone(v.phone)
    const name = v.name.trim()
    set(() => emptyState({ name, phone, email: "" }, v.storeName.trim(), v.handle))
    window.location.hash = "home"
    toast.success("Your store is ready. Let’s set it up.")
  }

  const err = (k: SignupField) => ({ "aria-invalid": !!show(k) || undefined, "aria-describedby": show(k) ? `su-${k}-error` : undefined })

  return (
    <AuthLayout>
      <Card>
        <Heading title="Create your store" description="Start selling in a few minutes. No card needed." />
        <CardContent>
          <form noValidate onSubmit={submit}>
            <FieldGroup className="gap-4">
              <GoogleButton />
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">or</FieldSeparator>

              <Field data-invalid={!!show("phone") || undefined} className="gap-2">
                <FieldLabel htmlFor="su-phone">Mobile number</FieldLabel>
                <Input id="su-phone" ref={refs.phone} type="tel" inputMode="tel" autoComplete="tel" placeholder="01711223344"
                  value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} onBlur={blur("phone")} {...err("phone")}
                  aria-describedby={show("phone") ? "su-phone-error" : "su-phone-hint"} />
                {show("phone") ? <FieldError id="su-phone-error">{show("phone")}</FieldError>
                  : <FieldDescription id="su-phone-hint">You’ll log in with this number. Bangla digits work too.</FieldDescription>}
              </Field>

              <Field data-invalid={!!show("name") || undefined} className="gap-2">
                <FieldLabel htmlFor="su-name">Your name</FieldLabel>
                <Input id="su-name" ref={refs.name} autoComplete="name" value={v.name}
                  onChange={(e) => setV({ ...v, name: e.target.value })} onBlur={blur("name")} {...err("name")} />
                <FieldError id="su-name-error">{show("name")}</FieldError>
              </Field>

              <Field data-invalid={!!show("storeName") || undefined} className="gap-2">
                <FieldLabel htmlFor="su-store">Store name</FieldLabel>
                <Input id="su-store" ref={refs.storeName} autoComplete="organization" placeholder="Tajul Fashion" value={v.storeName}
                  onChange={(e) => setStoreName(e.target.value)} onBlur={blur("storeName")} {...err("storeName")} />
                <FieldError id="su-storeName-error">{show("storeName")}</FieldError>
              </Field>

              <Field data-invalid={!!show("handle") || taken || undefined} className="gap-2">
                <FieldLabel htmlFor="su-handle">Store web address</FieldLabel>
                <InputGroup>
                  <InputGroupInput id="su-handle" ref={refs.handle} autoCapitalize="none" autoCorrect="off" spellCheck={false}
                    placeholder="your-store" value={v.handle} maxLength={40}
                    onChange={(e) => setHandle(e.target.value)} onBlur={blur("handle")}
                    aria-invalid={!!show("handle") || taken || undefined} aria-describedby="su-handle-status su-handle-hint" />
                  <InputGroupAddon align="inline-end"><InputGroupText>.ghuri.store</InputGroupText></InputGroupAddon>
                </InputGroup>
                <div id="su-handle-status" aria-live="polite" className="text-sm">
                  {show("handle") ? <FieldError>{show("handle")}</FieldError>
                    : taken ? (
                      <p className="text-destructive">
                        Taken, try{" "}
                        <button type="button" className="inline-flex min-h-6 items-center font-medium underline underline-offset-4"
                          onClick={() => { setHandleEdited(true); setV((s) => ({ ...s, handle: suggestion })) }}>
                          {suggestion}
                        </button>
                      </p>
                    ) : v.handle && !errors.handle ? (
                      <p className="flex items-center gap-2 font-medium text-success-foreground">
                        <CheckCircle2Icon className="size-4" aria-hidden="true" /> Available
                      </p>
                    ) : null}
                </div>
                <FieldDescription id="su-handle-hint">
                  {isAuto ? "Bangla names get an automatic address. You can change it."
                    : v.handle && !taken && !errors.handle ? <>Your shop link: <span className="font-medium break-all text-foreground">{v.handle}.ghuri.store</span></>
                      : "Fills in from your store name. Letters, numbers and hyphens."}
                </FieldDescription>
              </Field>

              <Field data-invalid={!!show("password") || undefined} className="gap-2">
                <FieldLabel htmlFor="su-password">Password</FieldLabel>
                <PasswordInput id="su-password" inputRef={refs.password} value={v.password} autoComplete="new-password"
                  onChange={(p) => setV({ ...v, password: p })} onBlur={blur("password")} error={show("password")}
                  describedBy={show("password") ? "su-password-error" : "su-password-hint"} />
                {show("password") ? <FieldError id="su-password-error">{show("password")}</FieldError>
                  : <FieldDescription id="su-password-hint">At least 8 characters</FieldDescription>}
              </Field>

              <Button type="submit" className="w-full">Create store</Button>
              <p className="text-center text-sm text-muted-foreground">
                By creating a store you agree to the <TextLink href="#signup">Terms</TextLink> and{" "}
                <TextLink href="#signup">Privacy Policy</TextLink>
              </p>
            </FieldGroup>
          </form>
        </CardContent>
        <FooterLink text="Already have a store?" link="Log in" href="#login" />
      </Card>
    </AuthLayout>
  )
}

/* ---------- Login and reset ---------- */

export function LoginPage() {
  const [view, setView] = useState<"login" | "reset" | "sent">("login")
  const [id, setId] = useState("")
  const [password, setPassword] = useState("")
  const [touched, setTouched] = useState({ id: false, password: false })
  const [failed, setFailed] = useState(false)
  const idRef = useRef<HTMLInputElement>(null)
  const pwRef = useRef<HTMLInputElement>(null)
  const backRef = useRef<HTMLButtonElement>(null)
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
    window.location.hash = "home"
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
    <Field data-invalid={!!idErr || undefined} className="gap-2">
      <FieldLabel htmlFor="li-id">Mobile number or email</FieldLabel>
      <Input id="li-id" ref={idRef} type="text" inputMode="email" autoComplete="username" autoCapitalize="none" spellCheck={false}
        placeholder="01711223344" value={id}
        onChange={(e) => { setId(e.target.value); setFailed(false) }} onBlur={() => setTouched((t) => ({ ...t, id: true }))}
        aria-invalid={!!idErr || undefined} aria-describedby={idErr ? "li-id-error" : undefined} />
      <FieldError id="li-id-error">{idErr}</FieldError>
    </Field>
  )

  if (view !== "login") {
    return (
      <AuthLayout>
        <Card>
          <Heading title="Reset your password" description="We’ll send a code by SMS" />
          <CardContent>
            {view === "reset" ? (
              <form noValidate onSubmit={sendCode}>
                <FieldGroup className="gap-4">
                  {idField}
                  <Button type="submit" className="w-full">Send code</Button>
                </FieldGroup>
              </form>
            ) : (
              <form noValidate onSubmit={updatePassword}>
                <FieldGroup className="gap-4">
                  <Alert>
                    <CheckCircle2Icon className="text-success-foreground!" />
                    <AlertTitle>Code sent to {normaliseIdentifier(id)}</AlertTitle>
                    <AlertDescription>It can take a minute to arrive. Use it to set a new password.</AlertDescription>
                  </Alert>
                  <Field data-invalid={!!codeErr || undefined} className="gap-2">
                    <FieldLabel htmlFor="rs-code">6-digit code</FieldLabel>
                    <Input id="rs-code" ref={codeRef} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="123456" value={code}
                      onChange={(e) => setCode(e.target.value)} onBlur={() => setResetTouched((t) => ({ ...t, code: true }))}
                      aria-invalid={!!codeErr || undefined} aria-describedby={codeErr ? "rs-code-error" : undefined} />
                    <FieldError id="rs-code-error">{codeErr}</FieldError>
                  </Field>
                  <Field data-invalid={!!newPwErr || undefined} className="gap-2">
                    <FieldLabel htmlFor="rs-password">New password</FieldLabel>
                    <PasswordInput id="rs-password" inputRef={newPwRef} value={newPw} autoComplete="new-password"
                      onChange={setNewPw} onBlur={() => setResetTouched((t) => ({ ...t, pw: true }))}
                      error={newPwErr} describedBy={newPwErr ? "rs-password-error" : "rs-password-hint"} />
                    {newPwErr ? <FieldError id="rs-password-error">{newPwErr}</FieldError> : <FieldDescription id="rs-password-hint">At least 8 characters</FieldDescription>}
                  </Field>
                  <Button type="submit" className="w-full">Update password</Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={() => go("reset")}>Send a new code</Button>
                </FieldGroup>
              </form>
            )}
          </CardContent>
          <CardFooter className="justify-center">
            <Button ref={backRef} type="button" variant="link" className="h-10 underline hover:no-underline" onClick={() => go("login")}>Back to log in</Button>
          </CardFooter>
        </Card>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <Card>
        <Heading title="Log in" description="Manage your store." />
        <CardContent>
          <form noValidate onSubmit={login}>
            <FieldGroup className="gap-4">
              {updated && !failed && (
                <Alert role="status">
                  <CheckCircle2Icon className="text-success-foreground!" />
                  <AlertTitle>Password updated. Log in with your new password.</AlertTitle>
                </Alert>
              )}
              {failed && (
                <Alert variant="destructive">
                  <AlertCircleIcon />
                  <AlertTitle>Couldn’t log you in</AlertTitle>
                  <AlertDescription>That number or password is not right. Try again or reset your password.</AlertDescription>
                </Alert>
              )}
              <GoogleButton />
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">or</FieldSeparator>
              {idField}
              <Field data-invalid={!!pwErr || undefined} className="gap-2">
                <div className="flex items-center justify-between gap-2">
                  <FieldLabel htmlFor="li-password">Password</FieldLabel>
                  <button type="button" className="inline-flex min-h-6 items-center text-sm font-medium text-primary underline underline-offset-4 hover:no-underline"
                    onClick={() => go("reset")}>
                    Forgot password?
                  </button>
                </div>
                <PasswordInput id="li-password" inputRef={pwRef} value={password} autoComplete="current-password"
                  onChange={(p) => { setPassword(p); setFailed(false) }} onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  error={pwErr} describedBy={pwErr ? "li-password-error" : undefined} />
                <FieldError id="li-password-error">{pwErr}</FieldError>
              </Field>
              <Button type="submit" className="w-full">Log in</Button>
            </FieldGroup>
          </form>
        </CardContent>
        <FooterLink text="New to Ghuri Commerce?" link="Create a store" href="#signup" />
      </Card>
    </AuthLayout>
  )
}
