import { useState } from "react"
import { toast } from "sonner"
import { motion } from "motion/react"
import { Eye, FolderSimple, MagnifyingGlass, Package, Plus, TextAlignLeft, Trash } from "@phosphor-icons/react"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Page, PageColumn, PageGrid, PageHeader } from "@/components/app/page"
import { Money } from "@/components/app/money"
import { Button as ActionButton } from "@/components/ui/action-button"
import { Checkbox, Radio, RadioGroup } from "@/components/ui/choice-controls"
import { EmptyState } from "@/components/ui/empty-state"
import { Inset, Panel, Shell, ShellHeader } from "@/components/ui/surface"
import { SearchField, TextArea, TextField } from "@/components/ui/text-field"
import { EASE_OUT } from "@/lib/motion-tokens"
import { outline } from "@/lib/phosphor"
import { cn } from "@/lib/utils"
import { uid, useApp } from "@/store/store"
import { Pill, Thumb } from "@/pages/products-tuffui-page"

const WRAP = "[&_p]:whitespace-normal [&_p]:overflow-visible [&_p]:text-clip"
/** Same boundary fix as #product-tuffui: tint-only controls get a 3:1 inset edge. */
export const EDGES = "[&_input]:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--foreground)_55%,transparent)] [&_textarea]:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--foreground)_55%,transparent)] [&_[role=checkbox][aria-checked=false]]:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--foreground)_55%,transparent)] [&_[role=radio][aria-checked=false]]:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--foreground)_55%,transparent)]"
const ERR = "[&_[id$=-error]]:text-[oklch(0.45_0.2_27)] dark:[&_[id$=-error]]:text-[oklch(0.78_0.14_25)]"
const go = (h: string) => { window.location.hash = h }
const rise = (i: number) => ({ initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0, transition: { duration: 0.24, ease: EASE_OUT, delay: i * 0.03 } } })

export function CollectionsTuffuiPage() {
  const { state } = useApp()
  const add = <ActionButton variant="primary" size="md" icon={outline(Plus)} onClick={() => go("collection-tuffui-new")}>Add collection</ActionButton>
  return (
    <Page>
      <PageHeader title="Collections" description="Group products so shoppers find them faster, like Eid collection or Panjabi."
        actions={state.collections.length > 0 && add} />
      {state.collections.length === 0 ? (
        <Shell>
          <Panel className="flex flex-col items-center gap-4 pb-6">
            <EmptyState icon={outline(FolderSimple)} title="No collections yet" description="Collections show as tabs on your store’s homepage." />
            {add}
          </Panel>
        </Shell>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {state.collections.map((c, i) => {
            const items = state.products.filter((p) => p.collectionIds.includes(c.id))
            return (
              <motion.li key={c.id} {...rise(i)}>
                <a href={`#collection-tuffui-${c.id}`} className="group block h-full rounded-[1.25rem] outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Shell className="h-full transition-colors group-hover:bg-foreground/[0.04]">
                    <ShellHeader icon={outline(FolderSimple)} title={c.title}
                      subtitle={`${items.length} product${items.length === 1 ? "" : "s"}`}
                      aside={!c.visible && <Pill tone="neutral">Hidden</Pill>} />
                    <Panel className="flex min-h-16 items-center p-4">
                      <div className="flex -space-x-2">
                        {items.slice(0, 5).map((p) => <Thumb key={p.id} product={p} className="ring-2 ring-surface" />)}
                        {items.length === 0 && <span className="text-sm text-muted-foreground">Empty</span>}
                      </div>
                    </Panel>
                  </Shell>
                </a>
              </motion.li>
            )
          })}
        </ul>
      )}
    </Page>
  )
}

export function CollectionFormTuffuiPage({ id }: { id?: string }) {
  const { state, set } = useApp()
  const existing = id ? state.collections.find((c) => c.id === id) : undefined
  const [title, setTitle] = useState(existing?.title ?? "")
  const [description, setDescription] = useState(existing?.description ?? "")
  const [visible, setVisible] = useState<"shown" | "hidden">(existing?.visible === false ? "hidden" : "shown")
  const [picked, setPicked] = useState<string[]>(() => state.products.filter((p) => existing && p.collectionIds.includes(existing.id)).map((p) => p.id))
  const [q, setQ] = useState("")
  const [tried, setTried] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const all = state.products.filter((p) => p.status !== "archived")
  const products = all.filter((p) => !q.trim() || p.title.toLowerCase().includes(q.trim().toLowerCase()))

  if (id && !existing) {
    return <Page><Shell><Panel className="py-8"><EmptyState title="Collection not found" description={<a href="#collections-tuffui" className="underline">Back to collections</a>} /></Panel></Shell></Page>
  }

  const save = () => {
    setTried(true)
    if (!title.trim()) { toast.error("Enter a name to save."); return }
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
    go("collections-tuffui")
  }
  const remove = () => {
    if (!existing) return
    set((s) => ({ ...s, collections: s.collections.filter((c) => c.id !== existing.id), products: s.products.map((p) => ({ ...p, collectionIds: p.collectionIds.filter((x) => x !== existing.id) })) }))
    toast("Collection deleted. Its products are not deleted.")
    go("collections-tuffui")
  }
  const titleError = tried && !title.trim() ? "Enter a name, for example Eid collection." : undefined

  return (
    <Page className={cn(EDGES, ERR)}>
      <PageHeader backHref="#collections-tuffui" backLabel="Back to collections" title={existing ? existing.title : "Add collection"}
        actions={<>
          {existing && <ActionButton variant="secondary" size="md" icon={outline(Trash)} onClick={() => setConfirmDelete(true)}>Delete</ActionButton>}
          <ActionButton variant="primary" size="md" onClick={save}>Save</ActionButton>
        </>} />
      <PageGrid>
        <PageColumn>
          <Shell>
            <ShellHeader as="h2" icon={outline(TextAlignLeft)} title="Details" />
            <Panel className="flex flex-col gap-6 p-4">
              <TextField id="ctitle" label="Name" value={title} onChange={(e) => setTitle(e.target.value)} error={titleError} description="Shown as a tab on your store." />
              <TextArea id="cdesc" label="Description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </Panel>
          </Shell>
          <Shell>
            <ShellHeader as="h2" icon={outline(Package)} title="Products" subtitle={`${picked.length} selected`} />
            <Panel className="flex flex-col gap-4 p-4">
              <SearchField aria-label="Search products" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} onClear={() => setQ("")} />
              {all.length === 0 ? (
                <p className="text-sm text-muted-foreground">No products. <a href="#product-tuffui-new" className="underline">Add a product</a> first.</p>
              ) : products.length === 0 ? (
                <EmptyState icon={outline(MagnifyingGlass)} title="No products match" description="Try another name." />
              ) : (
                <fieldset className="flex flex-col gap-1">
                  <legend className="sr-only">Products in this collection</legend>
                  {products.map((p) => (
                    <Inset key={p.id} className={cn("flex items-center gap-4 px-3 py-2 transition-colors", picked.includes(p.id) && "bg-foreground/[0.08]")}>
                      <Checkbox id={`cp-${p.id}`} aria-label={p.title} checked={picked.includes(p.id)} onCheckedChange={(v) => setPicked(v ? [...picked, p.id] : picked.filter((x) => x !== p.id))} />
                      <Thumb product={p} />
                      <label htmlFor={`cp-${p.id}`} className="min-w-0 flex-1 cursor-pointer truncate text-sm font-medium">{p.title}</label>
                      {p.status === "draft" && <Pill tone="neutral">Draft</Pill>}
                      <Money value={p.price} className="text-sm" />
                    </Inset>
                  ))}
                </fieldset>
              )}
            </Panel>
          </Shell>
        </PageColumn>
        <PageColumn>
          <Shell>
            <ShellHeader as="h2" icon={outline(Eye)} title="Visibility" />
            <Panel className="p-4">
              <RadioGroup label="Visibility" value={visible} onValueChange={(v) => setVisible(v as "shown" | "hidden")} className="flex flex-col gap-2">
                {([["shown", "Shown", "Appears on your store."], ["hidden", "Hidden", "Only you can see it."]] as const).map(([v, t, d]) => (
                  <Inset key={v} className={cn("p-4 transition-colors", visible === v && "bg-foreground/[0.1]")}><Radio value={v} label={t} description={d} /></Inset>
                ))}
              </RadioGroup>
            </Panel>
          </Shell>
          {existing && (
            <Shell>
              <ShellHeader as="h2" className={WRAP} icon={outline(Trash)} title="Delete collection" subtitle="Products in it stay in your store." />
              <Panel className="p-4"><ActionButton variant="secondary" size="md" className="w-full" onClick={() => setConfirmDelete(true)}>Delete collection</ActionButton></Panel>
            </Shell>
          )}
        </PageColumn>
      </PageGrid>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {existing?.title}?</AlertDialogTitle>
            <AlertDialogDescription>The collection is removed from your store. Its products are not deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild><ActionButton variant="secondary" size="md">Keep it</ActionButton></AlertDialogCancel>
            <AlertDialogAction asChild><ActionButton variant="danger" size="md" onClick={remove}>Delete</ActionButton></AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  )
}
