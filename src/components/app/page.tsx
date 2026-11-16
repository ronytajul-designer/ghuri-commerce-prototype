import { ArrowLeftIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Page layout primitives. Every admin page uses these so spacing stays on the 8px grid:
 * page padding 16/32, section gap 24, header gap 8.
 */
export function Page({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8", className)} {...props} />
}

type PageHeaderProps = {
  title: React.ReactNode
  description?: React.ReactNode
  badge?: React.ReactNode
  backHref?: string
  backLabel?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, description, badge, backHref, backLabel = "Back", actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-2">
        {backHref && (
          <Button variant="ghost" size="icon-sm" asChild>
            <a href={backHref} aria-label={backLabel}><ArrowLeftIcon /></a>
          </Button>
        )}
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-semibold tracking-tight">{title}</h1>
            {badge}
          </div>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/** Main column + 320px aside on large screens, single column below. */
export function PageGrid({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]", className)} {...props} />
}

export function PageColumn({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex min-w-0 flex-col gap-6", className)} {...props} />
}
