import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Tone } from "@/data/orders"

// Tinted badge using the product's success / warning / info / destructive tokens.
// Text stays foreground for 4.5:1 contrast; the colored dot carries the hue.
const toneClass: Record<Tone, string> = {
  warning: "bg-warning/15 border-warning/40",
  info: "bg-info/10 border-info/30",
  success: "bg-success/10 border-success/30",
  destructive: "bg-destructive/10 border-destructive/30 text-destructive",
  muted: "bg-muted border-border text-muted-foreground",
}
const dotClass: Record<Tone, string> = {
  warning: "bg-warning",
  info: "bg-info",
  success: "bg-success",
  destructive: "bg-destructive",
  muted: "bg-muted-foreground",
}

export function ToneBadge({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return (
    <Badge variant="outline" className={cn("gap-1.5 font-medium text-foreground", toneClass[tone], className)}>
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", dotClass[tone])} />
      {children}
    </Badge>
  )
}
