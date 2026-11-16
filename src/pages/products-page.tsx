import { useState } from "react"
import { PackageIcon, PlusIcon, SearchIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Page, PageHeader } from "@/components/app/page"
import { Money } from "@/components/app/money"
import { ProductThumb } from "@/components/app/product-thumb"
import { productStock, useApp } from "@/store/store"
import type { Product, ProductStatus } from "@/store/types"

type Filter = "all" | ProductStatus
const STATUS_BADGE: Record<ProductStatus, { label: string; variant: "success" | "muted" | "outline" }> = {
  active: { label: "Active", variant: "success" },
  draft: { label: "Draft", variant: "muted" },
  archived: { label: "Archived", variant: "outline" },
}

export function StockBadge({ product }: { product: Product }) {
  const n = productStock(product)
  const lowVariant = product.variants.some((v) => v.stock <= 2)
  if (n === 0) return <Badge variant="destructive">Out of stock</Badge>
  if (n <= 5 || lowVariant) return <Badge variant="warning">{n} in stock{lowVariant && n > 5 ? ", some low" : ""}</Badge>
  return <span className="text-sm tabular-nums">{n} in stock</span>
}

export function ProductsPage() {
  const { state } = useApp()
  const [filter, setFilter] = useState<Filter>("all")
  const [q, setQ] = useState("")
  const counts = { all: state.products.length, active: 0, draft: 0, archived: 0 } as Record<Filter, number>
  state.products.forEach((p) => counts[p.status]++)
  const rows = state.products.filter((p) => filter === "all" || p.status === filter).filter((p) => !q.trim() || p.title.toLowerCase().includes(q.trim().toLowerCase()))
  const open = (id: string) => { window.location.hash = `product-${id}` }

  if (state.products.length === 0) {
    return (
      <Page>
        <PageHeader title="Products" description="Everything you sell." />
        <Card>
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon"><PackageIcon /></EmptyMedia>
              <EmptyTitle>Add your first product</EmptyTitle>
              <EmptyDescription>Start with photos from your phone. You can add sizes, colours and stock in the same form.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent><Button asChild><a href="#product-new"><PlusIcon />Add product</a></Button></EmptyContent>
          </Empty>
        </Card>
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader title="Products" description="Everything you sell." actions={<Button asChild><a href="#product-new"><PlusIcon />Add product</a></Button>} />
      <div className="flex flex-col gap-4">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)} className="min-w-0">
          <div className="overflow-x-auto [scrollbar-width:none]">
            <TabsList className="w-max">
              {(["all", "active", "draft", "archived"] as Filter[]).map((f) => (
                <TabsTrigger key={f} value={f} className="flex-none capitalize">{f}<span className="text-xs text-muted-foreground tabular-nums">{counts[f]}</span></TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>
        <InputGroup className="w-full sm:max-w-80">
          <InputGroupAddon><SearchIcon /></InputGroupAddon>
          <InputGroupInput aria-label="Search products" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
        </InputGroup>
        <Card className="gap-0 py-0">
          {rows.length === 0 ? (
            <Empty className="py-12"><EmptyHeader><EmptyTitle>No products match</EmptyTitle><EmptyDescription>Try another name or tab.</EmptyDescription></EmptyHeader></Empty>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Status</TableHead><TableHead>Stock</TableHead><TableHead className="text-right">Sold</TableHead><TableHead className="text-right">Price</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {rows.map((p) => (
                      <TableRow key={p.id} className="cursor-pointer" onClick={() => open(p.id)}>
                        <TableCell>
                          <div className="flex items-center gap-4">
                            <ProductThumb product={p} />
                            <div className="flex min-w-0 flex-col">
                              <a href={`#product-${p.id}`} className="font-medium hover:underline" onClick={(e) => e.stopPropagation()}>{p.title}</a>
                              <span className="text-xs text-muted-foreground">{p.variants.length ? `${p.variants.length} options` : "No options"}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant={STATUS_BADGE[p.status].variant}>{STATUS_BADGE[p.status].label}</Badge></TableCell>
                        <TableCell><StockBadge product={p} /></TableCell>
                        <TableCell className="text-right tabular-nums">{p.sold}</TableCell>
                        <TableCell className="text-right">
                          <Money value={p.price} />
                          {p.compareAt && <div className="text-xs text-muted-foreground line-through"><Money value={p.compareAt} /></div>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ul className="divide-y md:hidden">
                {rows.map((p) => (
                  <li key={p.id}>
                    <a href={`#product-${p.id}`} className="flex items-center gap-4 px-4 py-4 outline-none focus-visible:bg-muted">
                      <ProductThumb product={p} className="size-12" />
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <div className="flex items-baseline justify-between gap-2"><span className="truncate font-medium">{p.title}</span><Money value={p.price} className="text-sm" /></div>
                        <div className="flex flex-wrap items-center gap-2"><Badge variant={STATUS_BADGE[p.status].variant}>{STATUS_BADGE[p.status].label}</Badge><StockBadge product={p} /></div>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
        <p className="text-sm text-muted-foreground">{rows.length} product{rows.length === 1 ? "" : "s"}</p>
      </div>
    </Page>
  )
}
