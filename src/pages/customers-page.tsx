import { useState } from "react"
import { toast } from "sonner"
import { CopyIcon, MessageCircleIcon, PhoneIcon, SearchIcon, UsersIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Page, PageColumn, PageGrid, PageHeader } from "@/components/app/page"
import { DescriptionList, StatGroup } from "@/components/app/description-list"
import { Money } from "@/components/app/money"
import { OrderStatusBadge } from "@/components/app/status-badge"
import { type Customer, orderTotal, timeAgo, useApp, useCustomers } from "@/store/store"

type Segment = "all" | "repeat" | "risky"
const isRisky = (c: Customer) => c.returned >= 2 && c.returned / c.orders.length >= 0.5
const isRepeat = (c: Customer) => c.delivered >= 2

function CustomerTags({ c }: { c: Customer }) {
  return (
    <div className="flex flex-wrap gap-2">
      {isRisky(c) && <Badge variant="destructive">Often returns</Badge>}
      {isRepeat(c) && <Badge variant="success">Repeat buyer</Badge>}
      {c.orders.length === 1 && <Badge variant="muted">New</Badge>}
    </div>
  )
}

export function CustomersPage() {
  const customers = useCustomers()
  const [segment, setSegment] = useState<Segment>("all")
  const [q, setQ] = useState("")
  const rows = customers
    .filter((c) => segment === "all" || (segment === "repeat" ? isRepeat(c) : isRisky(c)))
    .filter((c) => !q.trim() || `${c.name} ${c.phone}`.toLowerCase().includes(q.trim().toLowerCase()))

  return (
    <Page>
      <PageHeader title="Customers" description="Everyone who ordered, found by phone number. Guest orders included." />
      {customers.length === 0 ? (
        <Card><Empty className="py-12"><EmptyHeader><EmptyMedia variant="icon"><UsersIcon /></EmptyMedia><EmptyTitle>No customers yet</EmptyTitle><EmptyDescription>Customers appear here after their first order.</EmptyDescription></EmptyHeader></Empty></Card>
      ) : (
        <div className="flex flex-col gap-4">
          <Tabs value={segment} onValueChange={(v) => setSegment(v as Segment)}>
            <TabsList>
              <TabsTrigger value="all">All<span className="text-xs text-muted-foreground tabular-nums">{customers.length}</span></TabsTrigger>
              <TabsTrigger value="repeat">Repeat<span className="text-xs text-muted-foreground tabular-nums">{customers.filter(isRepeat).length}</span></TabsTrigger>
              <TabsTrigger value="risky">Often return<span className="text-xs text-muted-foreground tabular-nums">{customers.filter(isRisky).length}</span></TabsTrigger>
            </TabsList>
          </Tabs>
          <InputGroup className="w-full sm:max-w-80">
            <InputGroupAddon><SearchIcon /></InputGroupAddon>
            <InputGroupInput aria-label="Search customers" placeholder="Search name or phone" value={q} onChange={(e) => setQ(e.target.value)} />
          </InputGroup>
          <Card className="gap-0 py-0">
            <div className="hidden md:block">
              <Table>
                <TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Area</TableHead><TableHead className="text-right">Orders</TableHead><TableHead className="text-right">Returned</TableHead><TableHead className="text-right">Spent</TableHead><TableHead>Last order</TableHead></TableRow></TableHeader>
                <TableBody>
                  {rows.map((c) => (
                    <TableRow key={c.phone} className="cursor-pointer" onClick={() => { window.location.hash = `customer-${c.phone}` }}>
                      <TableCell>
                        <a href={`#customer-${c.phone}`} className="font-medium hover:underline" onClick={(e) => e.stopPropagation()}>{c.name}</a>
                        <div className="flex flex-wrap items-center gap-2"><span className="text-xs text-muted-foreground tabular-nums">{c.phone}</span><CustomerTags c={c} /></div>
                      </TableCell>
                      <TableCell>{c.district}</TableCell>
                      <TableCell className="text-right tabular-nums">{c.orders.length}</TableCell>
                      <TableCell className={c.returned ? "text-right text-destructive tabular-nums" : "text-right tabular-nums"}>{c.returned}</TableCell>
                      <TableCell className="text-right"><Money value={c.spent} /></TableCell>
                      <TableCell className="text-muted-foreground">{timeAgo(c.lastAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ul className="divide-y md:hidden">
              {rows.map((c) => (
                <li key={c.phone}>
                  <a href={`#customer-${c.phone}`} className="flex flex-col gap-2 px-4 py-4">
                    <div className="flex items-baseline justify-between gap-2"><span className="font-medium">{c.name}</span><Money value={c.spent} className="text-sm" /></div>
                    <div className="flex flex-wrap gap-x-4 text-sm text-muted-foreground"><span className="tabular-nums">{c.phone}</span><span>{c.orders.length} orders</span><span>{c.district}</span></div>
                    <CustomerTags c={c} />
                  </a>
                </li>
              ))}
            </ul>
          </Card>
          <p className="text-sm text-muted-foreground">{rows.length} customer{rows.length === 1 ? "" : "s"}</p>
        </div>
      )}
    </Page>
  )
}

export function CustomerDetailPage({ phone }: { phone: string }) {
  const { state, set } = useApp()
  const c = useCustomers().find((x) => x.phone === phone)
  const [note, setNote] = useState(state.customerNotes[phone] ?? "")
  if (!c) return <Page><Empty><EmptyHeader><EmptyTitle>Customer not found</EmptyTitle><EmptyDescription><a href="#customers" className="underline">Back to customers</a></EmptyDescription></EmptyHeader></Empty></Page>
  const rate = c.delivered + c.returned ? Math.round((c.delivered / (c.delivered + c.returned)) * 100) : null

  return (
    <Page>
      <PageHeader backHref="#customers" backLabel="Back to customers" title={c.name} badge={<CustomerTags c={c} />} description={`First order ${new Date(Math.min(...c.orders.map((o) => o.createdAt))).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: new Date(Math.min(...c.orders.map((o) => o.createdAt))).getFullYear() === new Date().getFullYear() ? undefined : "numeric" })}`}
        actions={<>
          <Button variant="outline" asChild><a href={`tel:${c.phone}`}><PhoneIcon />Call</a></Button>
          <Button variant="outline" asChild><a href={`https://wa.me/88${c.phone}`} target="_blank" rel="noreferrer"><MessageCircleIcon />WhatsApp</a></Button>
        </>} />
      <PageGrid>
        <PageColumn>
          <Card className="pb-0">
            <CardHeader><CardTitle>Orders</CardTitle><CardDescription>{c.orders.length} orders, newest first.</CardDescription></CardHeader>
            <CardContent className="px-0">
              <Table className="[&_td:first-child]:pl-6 [&_td:last-child]:pr-6 [&_th:first-child]:pl-6 [&_th:last-child]:pr-6">
                <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                <TableBody>
                  {c.orders.map((o) => (
                    <TableRow key={o.id} className="cursor-pointer" onClick={() => { window.location.hash = `order-${o.id}` }}>
                      <TableCell><a href={`#order-${o.id}`} className="font-medium hover:underline" onClick={(e) => e.stopPropagation()}>#{o.id}</a><div className="text-xs text-muted-foreground">{timeAgo(o.createdAt)} · {o.items.map((i) => i.title).join(", ")}</div></TableCell>
                      <TableCell><OrderStatusBadge status={o.status} /></TableCell>
                      <TableCell className="text-right"><Money value={orderTotal(o)} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </PageColumn>
        <PageColumn>
          <Card>
            <CardHeader><CardTitle>Summary</CardTitle>{rate !== null && <CardDescription>{rate}% of shipped orders delivered</CardDescription>}</CardHeader>
            <CardContent className="gap-6">
              <StatGroup stats={[{ label: "orders", value: c.orders.length }, { label: "delivered", value: c.delivered }, { label: "returned", value: c.returned, emphasis: c.returned > 0 }]} />
              <DescriptionList items={[
                { term: "Phone", detail: <span className="flex items-center gap-2 tabular-nums">{c.phone}<Button variant="ghost" size="icon-xs" aria-label="Copy phone" onClick={() => { navigator.clipboard?.writeText(c.phone).catch(() => {}); toast("Phone copied") }}><CopyIcon /></Button></span> },
                { term: "Address", detail: c.address },
                { term: "Area", detail: [c.thana, c.district].filter(Boolean).join(", ") },
                { term: "Spent", detail: <Money value={c.spent} /> },
              ]} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Note</CardTitle></CardHeader>
            <CardContent>
              <Field>
                <FieldLabel htmlFor="cnote" className="sr-only">Note about this customer</FieldLabel>
                <Textarea id="cnote" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Prefers delivery after 5 pm" />
                <FieldDescription>Only staff see this. Shown on every order from this number.</FieldDescription>
              </Field>
            </CardContent>
            <CardFooter className="justify-end">
              <Button variant="outline" onClick={() => { set((s) => ({ ...s, customerNotes: { ...s.customerNotes, [phone]: note } })); toast("Note saved") }}>Save note</Button>
            </CardFooter>
          </Card>
        </PageColumn>
      </PageGrid>
    </Page>
  )
}
