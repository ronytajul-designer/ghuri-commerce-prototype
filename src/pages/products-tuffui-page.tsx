import { useMemo, useState } from "react"
import { motion } from "motion/react"
import { Image as ImageGlyph, MagnifyingGlass, Package, Plus } from "@phosphor-icons/react"
import { PageTuffui as Page, PageHeaderTuffui as PageHeader } from "@/components/app/page-tuffui"
import { Money } from "@/components/app/money"
import { Button as ActionButton } from "@/components/ui/action-button"
import { DataTable, type DataColumn } from "@/components/ui/data-table"
import { EmptyState } from "@/components/ui/empty-state"
import { Segmented } from "@/components/ui/segmented-control"
import { StatusPill, type StatusTone } from "@/components/ui/status-pill"
import { Panel, Shell } from "@/components/ui/surface"
import { SearchField } from "@/components/ui/text-field"
import { EASE_OUT } from "@/lib/motion-tokens"
import { outline } from "@/lib/phosphor"
import { cn } from "@/lib/utils"
import { productStock, useApp } from "@/store/store"
import type { Product, ProductStatus } from "@/store/types"

type Filter = "all" | ProductStatus

/** Same contrast overrides as #home-tuffui: stock pill text fails 4.5:1 in light mode. */
export const READABLE: Record<StatusTone, string> = {
  warning: "text-warning-foreground",
  brand: "text-info-foreground",
  positive: "text-success-foreground",
  negative: "text-[oklch(0.45_0.2_27)] dark:text-[oklch(0.78_0.14_25)]",
  neutral: "",
}
export function Pill({ tone, children }: { tone: StatusTone; children: React.ReactNode }) {
  return <StatusPill tone={tone} className={READABLE[tone]}>{children}</StatusPill>
}

export const STATUS_PILL: Record<ProductStatus, { label: string; tone: StatusTone }> = {
  active: { label: "Active", tone: "positive" },
  draft: { label: "Draft", tone: "neutral" },
  archived: { label: "Archived", tone: "neutral" },
}

function go(href: string) { window.location.hash = href.replace(/^#/, "") }

export function StockPill({ product }: { product: Product }) {
  const n = productStock(product)
  const lowVariant = product.variants.some((v) => v.stock <= 2)
  if (n === 0) return <Pill tone="negative">Out of stock</Pill>
  if (n <= 5 || lowVariant) return <Pill tone="warning">{n} in stock{lowVariant && n > 5 ? ", some low" : ""}</Pill>
  return <span className="text-sm tabular-nums">{n} in stock</span>
}

export function Thumb({ product, className }: { product: Pick<Product, "title" | "photos" | "tint">; className?: string }) {
  const src = product.photos[0]
  return (
    <div className={cn("relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-medium text-foreground/70", className)} style={src ? undefined : { background: product.tint }}>
      {src ? <img src={src} alt="" className="size-full object-cover" /> : product.title ? <span className="text-[oklch(0.3_0_0)]">{product.title[0].toUpperCase()}</span> : <ImageGlyph className="size-4" aria-hidden="true" />}
    </div>
  )
}

type Row = { id: string; product: string; status: string; stock: number; sold: number; price: number }

export function ProductsTuffuiPage() {
  const { state } = useApp()
  const [filter, setFilter] = useState<Filter>("all")
  const [q, setQ] = useState("")
  const counts = { all: state.products.length, active: 0, draft: 0, archived: 0 } as Record<Filter, number>
  state.products.forEach((p) => counts[p.status]++)
  const list = state.products.filter((p) => filter === "all" || p.status === filter).filter((p) => !q.trim() || p.title.toLowerCase().includes(q.trim().toLowerCase()))
  const byId = useMemo(() => new Map(state.products.map((p) => [p.id, p])), [state.products])
  const rows: Row[] = list.map((p) => ({ id: p.id, product: p.title, status: p.status, stock: productStock(p), sold: p.sold, price: p.price }))
  const add = <ActionButton variant="primary" size="md" icon={outline(Plus)} onClick={() => go("product-tuffui-new")}>Add product</ActionButton>

  if (state.products.length === 0) {
    return (
      <Page>
        <PageHeader title="Products" description="Everything you sell." />
        <Shell>
          <Panel className="flex flex-col items-center gap-4 pb-6">
            <EmptyState icon={outline(Package)} title="Add your first product"
              description="Start with photos from your phone. You can add sizes, colours and stock in the same form." />
            {add}
          </Panel>
        </Shell>
      </Page>
    )
  }

  const columns: DataColumn<Row>[] = [
    {
      key: "product", label: "Product", format: (_v, r) => {
        const p = byId.get(r.id)!
        return (
          <div className="flex min-w-0 items-center gap-4">
            <Thumb product={p} className="size-12 @md:size-10" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <a href={`#product-tuffui-${p.id}`} className="truncate font-medium hover:underline" onClick={(e) => e.stopPropagation()}>{p.title}</a>
              <span className="hidden text-xs text-muted-foreground @md:block">{p.variants.length ? `${p.variants.length} options` : "No options"}</span>
              <div className="flex flex-wrap items-center gap-2 @md:hidden">
                <Pill tone={STATUS_PILL[p.status].tone}>{STATUS_PILL[p.status].label}</Pill>
                <StockPill product={p} />
              </div>
            </div>
          </div>
        )
      },
    },
    { key: "status", label: "Status", priority: 2, format: (_v, r) => { const s = STATUS_PILL[byId.get(r.id)!.status]; return <Pill tone={s.tone}>{s.label}</Pill> } },
    { key: "stock", label: "Stock", priority: 2, format: (_v, r) => <StockPill product={byId.get(r.id)!} /> },
    { key: "sold", label: "Sold", align: "right", priority: 3, format: (v) => <span className="tabular-nums">{v}</span> },
    {
      key: "price", label: "Price", align: "right", priority: 1, format: (_v, r) => {
        const p = byId.get(r.id)!
        return <div className="flex flex-col items-end"><Money value={p.price} className="text-sm" />{p.compareAt && <Money value={p.compareAt} className="text-xs text-muted-foreground line-through" />}</div>
      },
    },
  ]

  return (
    <Page>
      <PageHeader title="Products" description="Everything you sell." actions={add} />
      <motion.div className="flex flex-col gap-4" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.24, ease: EASE_OUT } }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
            <Segmented<Filter> label="Filter products by status" value={filter} onValueChange={setFilter} className="w-max"
              options={(["all", "active", "draft", "archived"] as Filter[]).map((f) => ({
                value: f, label: <span className="flex items-center gap-2 capitalize">{f}<span className="text-xs text-muted-foreground tabular-nums">{counts[f]}</span></span>,
              }))} />
          </div>
          <SearchField className="w-full sm:max-w-80 [&_input]:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--foreground)_55%,transparent)]" aria-label="Search products" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} onClear={() => setQ("")} />
        </div>
        {rows.length === 0 ? (
          <Shell>
            <Panel><EmptyState icon={outline(MagnifyingGlass)} title="No products match" description="Try another name or tab." /></Panel>
          </Shell>
        ) : (
          <DataTable key={filter + q} data={rows} columns={columns} title="Products" pageSize={20} searchable={false} onRowClick={(r) => go(`product-tuffui-${r.id}`)} className="max-w-none" />
        )}
        <p className="text-sm text-muted-foreground">{rows.length} product{rows.length === 1 ? "" : "s"}</p>
      </motion.div>
    </Page>
  )
}
