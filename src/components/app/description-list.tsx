import { cn } from "@/lib/utils"

export type DescriptionItem = { term: React.ReactNode; detail: React.ReactNode }

/** Label / value pairs with a fixed label column so values align across cards. */
export function DescriptionList({ items, className }: { items: DescriptionItem[]; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-[96px_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm", className)}>
      {items.map((it, i) => (
        <div key={i} className="contents">
          <dt className="text-muted-foreground">{it.term}</dt>
          <dd className="min-w-0 break-words">{it.detail}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Small row of numbers, e.g. a customer's order history. */
export function StatGroup({ stats }: { stats: { label: string; value: number; emphasis?: boolean }[] }) {
  return (
    <dl className="grid grid-cols-3 gap-2">
      {stats.map((s) => (
        <div key={s.label} className="flex flex-col gap-1 rounded-md bg-muted px-2 py-2 text-center">
          <dd className={cn("text-lg font-semibold tabular-nums", s.emphasis && "text-destructive")}>{s.value}</dd>
          <dt className="order-last text-xs text-muted-foreground">{s.label}</dt>
        </div>
      ))}
    </dl>
  )
}
