import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { cn } from "@/lib/utils"
import { taka } from "@/data/orders"

const BN: Record<string, string> = { "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4", "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9" }

/** Parses English or Bangla digits. Returns null when empty, NaN when invalid. */
export function parseAmount(raw: string): number | null {
  const s = raw.replace(/[০-৯]/g, (c) => BN[c]).replace(/[,\s৳]/g, "")
  if (s === "") return null
  const n = Number(s)
  return Number.isFinite(n) && n >= 0 ? n : NaN
}

export function Money({ value, className }: { value: number; className?: string }) {
  return <span className={cn("tabular-nums", className)}>{taka(value)}</span>
}

/** Taka input: ৳ prefix, numeric keyboard on phones, accepts Bangla digits. */
export function MoneyInput({ className, ...props }: React.ComponentProps<typeof InputGroupInput>) {
  return (
    <InputGroup className={className}>
      <InputGroupAddon><InputGroupText>৳</InputGroupText></InputGroupAddon>
      <InputGroupInput inputMode="decimal" {...props} />
    </InputGroup>
  )
}
