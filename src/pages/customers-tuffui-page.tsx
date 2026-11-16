import { useMemo, useState } from "react"
import { toast } from "sonner"
import { motion } from "motion/react"
import { ChatCircle, Copy, MagnifyingGlass, NotePencil, Phone, Receipt, User, Users } from "@phosphor-icons/react"
import { PageTuffui as Page, PageColumnTuffui as PageColumn, PageGridTuffui as PageGrid, PageHeaderTuffui as PageHeader } from "@/components/app/page-tuffui"
import { DescriptionList, StatGroup } from "@/components/app/description-list"
import { Money } from "@/components/app/money"
import { OrderStatusPill, Pill } from "@/components/app/order-bits-tuffui"
import { Button as ActionButton, IconButton } from "@/components/ui/action-button"
import { DataTable, type DataColumn } from "@/components/ui/data-table"
import { EmptyState } from "@/components/ui/empty-state"
import { SegmentedTabsTuffui } from "@/components/app/tabs-tuffui"
import { Panel, Shell, ShellHeader } from "@/components/ui/surface"
import { SearchField, TextArea } from "@/components/ui/text-field"
import { EASE_OUT } from "@/lib/motion-tokens"
import { outline } from "@/lib/phosphor"
import { type Customer, orderTotal, timeAgo, useApp, useCustomers } from "@/store/store"
import { EDGES } from "@/pages/collections-tuffui-page"

type Segment = "all" | "repeat" | "risky"
const isRisky = (c: Customer) => c.returned >= 2 && c.returned / c.orders.length >= 0.5
const isRepeat = (c: Customer) => c.delivered >= 2
const go = (h: string) => { window.location.hash = h }
const WRAP = "[&_p]:whitespace-normal [&_p]:overflow-visible [&_p]:text-clip"
const NEG = "text-[oklch(0.45_0.2_27)] dark:text-[oklch(0.8_0.13_25)]"

function CustomerTags({ c }: { c: Customer }) {
  return (
    <span className="flex flex-wrap gap-1">
      {isRisky(c) && <Pill tone="negative">Often returns</Pill>}
      {isRepeat(c) && <Pill tone="positive">Repeat buyer</Pill>}
      {c.orders.length === 1 && <Pill tone="neutral">New</Pill>}
    </span>
  )
}

type Row = { id: string; customer: string; district: string; orders: number; returned: number; spent: number; last: number }

export function CustomersTuffuiPage() {
  const customers = useCustomers()
  const [segment, setSegment] = useState<Segment>("all")
  const [q, setQ] = useState("")
  const byPhone = useMemo(() => new Map(customers.map((c) => [c.phone, c])), [customers])
  const list = customers
    .filter((c) => segment === "all" || (segment === "repeat" ? isRepeat(c) : isRisky(c)))
    .filter((c) => !q.trim() || `${c.name} ${c.phone}`.toLowerCase().includes(q.trim().toLowerCase()))
  const rows: Row[] = list.map((c) => ({ id: c.phone, customer: c.name, district: c.district, orders: c.orders.length, returned: c.returned, spent: c.spent, last: new Date(c.lastAt).getTime() }))
  const counts: Record<Segment, number> = { all: customers.length, repeat: customers.filter(isRepeat).length, risky: customers.filter(isRisky).length }
  const LABEL: Record<Segment, string> = { all: "All", repeat: "Repeat", risky: "Often return" }

  const columns: DataColumn<Row>[] = [
    {
      key: "customer", label: "Customer", width: "30%", format: (_v, r) => {
        const c = byPhone.get(r.id)!
        return (
          <div className="flex min-w-0 flex-col gap-1">
            <a href={`#customer-tuffui-${c.phone}`} className="truncate font-medium hover:underline" onClick={(e) => e.stopPropagation()}>{c.name}</a>
            <div className="flex flex-wrap items-center gap-2"><span className="text-xs text-muted-foreground tabular-nums">{c.phone}</span><CustomerTags c={c} /></div>
          </div>
        )
      },
    },
    { key: "district", label: "Area", width: "16%", priority: 3 },
    { key: "orders", label: "Orders", width: "10%", align: "right", priority: 2, format: (v) => <span className="tabular-nums">{v}</span> },
    { key: "returned", label: "Returned", width: "12%", align: "right", priority: 3, format: (v) => <span className={v ? `tabular-nums ${NEG}` : "tabular-nums"}>{v}</span> },
    { key: "spent", label: "Spent", width: "14%", align: "right", priority: 1, format: (v) => <Money value={Number(v)} /> },
    { key: "last", label: "Last order", width: "18%", priority: 3, format: (_v, r) => <span className="text-muted-foreground">{timeAgo(byPhone.get(r.id)!.lastAt)}</span> },
  ]

  return (
    <Page>
      <PageHeader title="Customers" description="Everyone who ordered, found by phone number. Guest orders included." />
      {customers.length === 0 ? (
        <Shell><Panel className="pb-6"><EmptyState icon={outline(Users)} title="No customers yet" description="Customers appear here after their first order." /></Panel></Shell>
      ) : (
        <motion.div className="flex flex-col gap-4" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.24, ease: EASE_OUT } }}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <SegmentedTabsTuffui<Segment> label="Filter customers" value={segment} onValueChange={setSegment}
              options={(["all", "repeat", "risky"] as Segment[]).map((s) => ({ value: s, label: LABEL[s], count: counts[s] }))} />
            <SearchField className="w-full sm:max-w-80 [&_input]:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--foreground)_55%,transparent)]" aria-label="Search customers" placeholder="Search name or phone" value={q} onChange={(e) => setQ(e.target.value)} onClear={() => setQ("")} />
          </div>
          {rows.length === 0 ? (
            <Shell><Panel><EmptyState icon={outline(MagnifyingGlass)} title="No customers match" description="Try another name, number or tab." /></Panel></Shell>
          ) : (
            <div className="[&_table]:table-fixed"><DataTable key={segment + q} data={rows} columns={columns} title="Customers" pageSize={20} searchable={false} onRowClick={(r) => go(`customer-tuffui-${r.id}`)} className="max-w-none" /></div>
          )}
          <p className="text-sm text-muted-foreground">{rows.length} customer{rows.length === 1 ? "" : "s"}</p>
        </motion.div>
      )}
    </Page>
  )
}

export function CustomerDetailTuffuiPage({ phone }: { phone: string }) {
  const { state, set } = useApp()
  const c = useCustomers().find((x) => x.phone === phone)
  const [note, setNote] = useState(state.customerNotes[phone] ?? "")
  if (!c) return <Page><Shell><Panel className="py-8"><EmptyState title="Customer not found" description={<a href="#customers-tuffui" className="underline">Back to customers</a>} /></Panel></Shell></Page>
  const rate = c.delivered + c.returned ? Math.round((c.delivered / (c.delivered + c.returned)) * 100) : null
  const saved = (state.customerNotes[phone] ?? "") === note

  return (
    <Page className={EDGES}>
      <PageHeader backHref="#customers-tuffui" backLabel="Back to customers" title={c.name} badge={<CustomerTags c={c} />} description={`Customer since ${timeAgo(c.orders[c.orders.length - 1].createdAt)}`}
        actions={<>
          <ActionButton variant="secondary" size="md" icon={outline(Phone)} onClick={() => { window.location.href = `tel:${c.phone}` }}>Call</ActionButton>
          <ActionButton variant="secondary" size="md" icon={outline(ChatCircle)} aria-label={`Message ${c.name} on WhatsApp (opens in a new tab)`}
            onClick={() => window.open(`https://wa.me/88${c.phone}`, "_blank", "noopener,noreferrer")}>WhatsApp</ActionButton>
        </>} />
      <PageGrid>
        <PageColumn>
          <Shell>
            <ShellHeader as="h2" icon={outline(Receipt)} title="Orders" subtitle={`${c.orders.length} orders, newest first.`} />
            <Panel className="p-2">
              <ul className="flex flex-col">
                {c.orders.map((o) => (
                  <li key={o.id}>
                    <a href={`#order-tuffui-${o.id}`} className="flex items-center gap-4 rounded-xl px-2 py-2.5 text-sm hover:bg-foreground/[0.04] focus-visible:ring-2 focus-visible:ring-ring outline-none">
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="font-medium">#{o.id}</span>
                        <span className="truncate text-xs text-muted-foreground">{timeAgo(o.createdAt)} · {o.items.map((i) => i.title).join(", ")}</span>
                      </div>
                      <OrderStatusPill status={o.status} />
                      <Money value={orderTotal(o)} className="w-20 text-right" />
                    </a>
                  </li>
                ))}
              </ul>
            </Panel>
          </Shell>
        </PageColumn>
        <PageColumn>
          <Shell>
            <ShellHeader as="h2" className={WRAP} icon={outline(User)} title="Summary" subtitle={rate !== null ? `${rate}% of shipped orders delivered` : undefined} />
            <Panel className="flex flex-col gap-6 p-4">
              <StatGroup stats={[{ label: "orders", value: c.orders.length }, { label: "delivered", value: c.delivered }, { label: "returned", value: c.returned, emphasis: c.returned > 0 }]} />
              <DescriptionList items={[
                { term: "Phone", detail: <span className="flex items-center gap-2 tabular-nums">{c.phone}<IconButton size="sm" icon={outline(Copy)} label="Copy phone" onClick={() => { navigator.clipboard?.writeText(c.phone).catch(() => {}); toast("Phone copied") }} /></span> },
                { term: "Address", detail: c.address },
                { term: "Area", detail: [c.thana, c.district].filter(Boolean).join(", ") },
                { term: "Spent", detail: <Money value={c.spent} /> },
              ]} />
            </Panel>
          </Shell>
          <Shell>
            <ShellHeader as="h2" icon={outline(NotePencil)} title="Note" />
            <Panel className="flex flex-col gap-4 p-4">
              <TextArea id="cnote" label={<span className="sr-only">Note about this customer</span>} rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Prefers delivery after 5 pm"
                description="Only staff see this. Shown on every order from this number." />
              <div className="flex justify-end">
                <ActionButton variant="secondary" size="md" disabled={saved} onClick={() => { set((s) => ({ ...s, customerNotes: { ...s.customerNotes, [phone]: note } })); toast("Note saved") }}>Save note</ActionButton>
              </div>
            </Panel>
          </Shell>
        </PageColumn>
      </PageGrid>
    </Page>
  )
}
