import { ArrowLeft } from "@phosphor-icons/react"
import { IconButton } from "@/components/ui/action-button"
import { outline } from "@/lib/phosphor"
import { cn } from "@/lib/utils"

/*
 * One container system for every TuffUI page (admin and storefront). All values sit on the 8px grid.
 *
 *   content width   1200px (admin list, detail, form, settings, theme; storefront header, content, footer)
 *   page padding    16px phone, 32px from md
 *   page top/bottom 24px phone, 32px from md
 *   section gap     24px
 *   aside           320px from lg (one width for every main + aside grid, admin and storefront)
 *   narrow card     576px (empty and success states)
 *   auth card       384px
 *   Shell 6px, Panel 16px, table first/last cell text at 16px from the panel edge
 */
export const TUFF = {
  /** Horizontal frame: 1200px of content plus the page padding. Use on header rows and page bodies alike. */
  frame: "mx-auto w-full max-w-[calc(1200px+2rem)] px-4 md:max-w-[calc(1200px+4rem)] md:px-8",
  /** Vertical page rhythm. */
  block: "py-6 md:py-8",
  gap: "gap-6",
  grid: "grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]",
  gridAsideFirst: "grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]",
  narrow: "mx-auto w-full max-w-[576px]",
  auth: "w-full max-w-[384px]",
  panel: "p-4",
  /** DataTable: its panel pads 8px and cells 8px, so cell text lands on the 16px panel inset. */
  table: "max-w-none",
} as const

/** Admin and storefront page body: frame + rhythm + section gap. */
export function PageTuffui({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn(TUFF.frame, TUFF.block, "flex flex-col", TUFF.gap, className)} {...props} />
}

type PageHeaderTuffuiProps = {
  title: React.ReactNode
  description?: React.ReactNode
  badge?: React.ReactNode
  backHref?: string
  backLabel?: string
  actions?: React.ReactNode
}

/** Title row. The back button (if any) sits on the content edge, the title follows it. */
export function PageHeaderTuffui({ title, description, badge, backHref, backLabel = "Back", actions }: PageHeaderTuffuiProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-2">
        {backHref && <IconButton size="md" icon={outline(ArrowLeft)} label={backLabel} onClick={() => { window.location.hash = backHref.replace(/^#/, "") }} />}
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

/**
 * Main column + one 320px aside from lg, single column below. `asideFirst` puts the
 * 320px column on the left (theme editor beside its preview); the width never changes.
 */
export function PageGridTuffui({ className, asideFirst, ...props }: React.ComponentProps<"div"> & { asideFirst?: boolean }) {
  return <div className={cn(asideFirst ? TUFF.gridAsideFirst : TUFF.grid, className)} {...props} />
}

export function PageColumnTuffui({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex min-w-0 flex-col", TUFF.gap, className)} {...props} />
}
