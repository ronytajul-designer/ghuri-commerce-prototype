import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react"
import { Card, CardAction, CardDescription, CardFooter, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/**
 * One KPI: label, big number, change vs previous period and a short line of context.
 * `goodWhen` says which direction is good, so a drop in returns reads as good news.
 */
export function StatCard({
  label, value, delta, deltaUnit = "%", goodWhen = "up", hint, icon,
}: {
  label: string
  value: React.ReactNode
  delta?: number
  deltaUnit?: "%" | " pts"
  goodWhen?: "up" | "down"
  hint: React.ReactNode
  icon?: React.ReactNode
}) {
  const good = delta === undefined ? null : goodWhen === "up" ? delta >= 0 : delta <= 0
  return (
    <Card size="sm" className="gap-2">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <div className="text-2xl font-semibold tabular-nums">{value}</div>
        {icon && <CardAction className="text-muted-foreground [&_svg]:size-4">{icon}</CardAction>}
      </CardHeader>
      <CardFooter className="flex-wrap gap-2 text-sm">
        {delta !== undefined && (
          <span className={cn("inline-flex items-center gap-1 font-medium tabular-nums", good ? "text-success-foreground" : "text-destructive")}>
            {delta >= 0 ? <ArrowUpRightIcon className="size-4" aria-hidden="true" /> : <ArrowDownRightIcon className="size-4" aria-hidden="true" />}
            {delta > 0 ? "+" : ""}{delta}{deltaUnit}
            <span className="sr-only">{good ? ", better than before" : ", worse than before"}</span>
          </span>
        )}
        <span className="text-muted-foreground">{hint}</span>
      </CardFooter>
    </Card>
  )
}
