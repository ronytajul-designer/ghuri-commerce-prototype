import { useState } from "react"
import { toast } from "sonner"
import { FolderTreeIcon, PlusIcon, SearchIcon } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Textarea } from "@/components/ui/textarea"
import { Page, PageColumn, PageGrid, PageHeader } from "@/components/app/page"
import { ChoiceCardGroup } from "@/components/app/choice-card-group"
import { ProductThumb } from "@/components/app/product-thumb"
import { Money } from "@/components/app/money"
import { uid, useApp } from "@/store/store"

export function CollectionsPage() {
  const { state } = useApp()
  const count = (id: string) => state.products.filter((p) => p.collectionIds.includes(id)).length
  return (
    <Page>
      <PageHeader title="Collections" description="Group products so shoppers find them faster, like Eid collection or Panjabi."
        actions={state.collections.length > 0 && <Button asChild><a href="#collection-new"><PlusIcon />Add collection</a></Button>} />
      {state.collections.length === 0 ? (
        <Card>
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon"><FolderTreeIcon /></EmptyMedia>
              <EmptyTitle>No collections yet</EmptyTitle>
              <EmptyDescription>Collections show as tabs on your store’s homepage.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent><Button asChild><a href="#collection-new"><PlusIcon />Add collection</a></Button></EmptyContent>
          </Empty>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {state.collections.map((c) => {
            const items = state.products.filter((p) => p.collectionIds.includes(c.id))
            return (
              <li key={c.id}>
                <a href={`#collection-${c.id}`} className="group block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                  <Card className="h-full transition-colors group-hover:bg-muted/50">
                    <CardHeader>
                      <CardTitle>{c.title}</CardTitle>
                      <CardDescription>{count(c.id)} product{count(c.id) === 1 ? "" : "s"}{!c.visible && " · Hidden"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex -space-x-2">
                        {items.slice(0, 5).map((p) => <ProductThumb key={p.id} product={p} className="ring-2 ring-card" />)}
                        {items.length === 0 && <span className="text-sm text-muted-foreground">Empty</span>}
                      </div>
                    </CardContent>
                  </Card>
                </a>
              </li>
            )
          })}
        </ul>
      )}
    </Page>
  )
}

export function CollectionFormPage({ id }: { id?: string }) {
  const { state, set } = useApp()
  const existing = id ? state.collections.find((c) => c.id === id) : undefined
  const [title, setTitle] = useState(existing?.title ?? "")
  const [description, setDescription] = useState(existing?.description ?? "")
  const [visible, setVisible] = useState<"shown" | "hidden">(existing?.visible === false ? "hidden" : "shown")
  const [picked, setPicked] = useState<string[]>(() => state.products.filter((p) => existing && p.collectionIds.includes(existing.id)).map((p) => p.id))
  const [q, setQ] = useState("")
  const [tried, setTried] = useState(false)
  const products = state.products.filter((p) => p.status !== "archived").filter((p) => !q.trim() || p.title.toLowerCase().includes(q.toLowerCase()))

  const save = () => {
    setTried(true)
    if (!title.trim()) return
    const cid = existing?.id ?? uid()
    set((s) => ({
      ...s,
      collections: existing ? s.collections.map((c) => (c.id === cid ? { ...c, title: title.trim(), description, visible: visible === "shown" } : c)) : [...s.collections, { id: cid, title: title.trim(), description, visible: visible === "shown" }],
      products: s.products.map((p) => {
        const inIt = picked.includes(p.id)
        const has = p.collectionIds.includes(cid)
        if (inIt && !has) return { ...p, collectionIds: [...p.collectionIds, cid] }
        if (!inIt && has) return { ...p, collectionIds: p.collectionIds.filter((x) => x !== cid) }
        return p
      }),
    }))
    toast.success("Collection saved")
    window.location.hash = "collections"
  }
  const [confirmDelete, setConfirmDelete] = useState(false)
  const remove = () => {
    if (!existing) return
    set((s) => ({ ...s, collections: s.collections.filter((c) => c.id !== existing.id), products: s.products.map((p) => ({ ...p, collectionIds: p.collectionIds.filter((x) => x !== existing.id) })) }))
    toast("Collection deleted. Its products are not deleted.")
    window.location.hash = "collections"
  }

  return (
    <Page>
      <PageHeader backHref="#collections" backLabel="Back to collections" title={existing ? existing.title : "Add collection"}
        actions={<>{existing && <Button variant="ghost" onClick={() => setConfirmDelete(true)}>Delete</Button>}<Button onClick={save}>Save</Button></>} />
      <PageGrid>
        <PageColumn>
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent>
              <FieldGroup>
                <Field data-invalid={(tried && !title.trim()) || undefined}>
                  <FieldLabel htmlFor="ctitle">Name</FieldLabel>
                  <Input id="ctitle" value={title} onChange={(e) => setTitle(e.target.value)} aria-invalid={(tried && !title.trim()) || undefined} aria-describedby={tried && !title.trim() ? "ctitle-error" : "ctitle-help"} />
                  {tried && !title.trim() ? <FieldError id="ctitle-error">Enter a name, for example Eid collection.</FieldError> : <FieldDescription id="ctitle-help">Shown as a tab on your store.</FieldDescription>}
                </Field>
                <Field>
                  <FieldLabel htmlFor="cdesc">Description</FieldLabel>
                  <Textarea id="cdesc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Products</CardTitle><CardDescription>{picked.length} selected</CardDescription></CardHeader>
            <CardContent>
              <InputGroup>
                <InputGroupAddon><SearchIcon /></InputGroupAddon>
                <InputGroupInput aria-label="Search products" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
              </InputGroup>
              <ul className="flex flex-col divide-y rounded-md border">
                {products.length === 0 && <li className="p-4 text-sm text-muted-foreground">No products. <a href="#product-new" className="underline">Add a product</a> first.</li>}
                {products.map((p) => (
                  <li key={p.id}>
                    <label htmlFor={`cp-${p.id}`} className="flex cursor-pointer items-center gap-4 px-4 py-2 hover:bg-muted/50">
                      <Checkbox id={`cp-${p.id}`} checked={picked.includes(p.id)} onCheckedChange={(v) => setPicked(v ? [...picked, p.id] : picked.filter((x) => x !== p.id))} />
                      <ProductThumb product={p} />
                      <span className="flex-1 text-sm font-medium">{p.title}</span>
                      {p.status === "draft" && <Badge variant="muted">Draft</Badge>}
                      <Money value={p.price} className="text-sm" />
                    </label>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </PageColumn>
        <PageColumn>
          <Card>
            <CardHeader><CardTitle>Visibility</CardTitle></CardHeader>
            <CardContent>
              <ChoiceCardGroup name="cvis" aria-label="Visibility" value={visible} onValueChange={setVisible} choices={[
                { value: "shown", title: "Shown", description: "Appears on your store." },
                { value: "hidden", title: "Hidden", description: "Only you can see it." },
              ]} />
            </CardContent>
          </Card>
        </PageColumn>
      </PageGrid>
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {existing?.title}?</AlertDialogTitle>
            <AlertDialogDescription>The collection is removed from your store. Its products stay in your catalogue.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep collection</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={remove}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  )
}
