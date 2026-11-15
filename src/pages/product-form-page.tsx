import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { CheckCircle2Icon, CircleIcon, ImageUpIcon, PlusIcon, StarIcon, XIcon } from "lucide-react"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Page, PageColumn, PageGrid, PageHeader } from "@/components/app/page"
import { ChoiceCardGroup } from "@/components/app/choice-card-group"
import { Money, MoneyInput, parseAmount } from "@/components/app/money"
import { MobileSaveBar } from "@/components/app/save-bar"
import { cn } from "@/lib/utils"

const SIZE_PRESETS = ["S", "M", "L", "XL", "XXL", "Free size"]
type Photo = { id: string; url: string; name: string }
type Status = "draft" | "active"

export function ProductFormPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
  const [price, setPrice] = useState("")
  const [compare, setCompare] = useState("")
  const [stock, setStock] = useState("")
  const [hasVariants, setHasVariants] = useState(false)
  const [sizes, setSizes] = useState<string[]>([])
  const [colours, setColours] = useState<string[]>([])
  const [colourDraft, setColourDraft] = useState("")
  const [variantStock, setVariantStock] = useState<Record<string, string>>({})
  const [variantPrice, setVariantPrice] = useState<Record<string, string>>({})
  const [bulkStock, setBulkStock] = useState("")
  const [status, setStatus] = useState<Status>("draft")
  const [collections, setCollections] = useState(["Eid collection", "New arrivals", "Panjabi", "Three-piece"])
  const [picked, setPicked] = useState<string[]>([])
  const [newCollection, setNewCollection] = useState("")
  const [weight, setWeight] = useState("500")
  const [slugEdit, setSlugEdit] = useState<string | null>(null)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const slugSeed = useRef(Math.random().toString(36).slice(2, 7))

  const edit = <T,>(set: (v: T) => void) => (v: T) => { set(v); setDirty(true) }
  const blur = (k: string) => () => setTouched((t) => ({ ...t, [k]: true }))
  const shown = (k: string) => submitted || !!touched[k]

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault() }
    window.addEventListener("beforeunload", h)
    return () => window.removeEventListener("beforeunload", h)
  }, [dirty])

  const priceN = parseAmount(price)
  const compareN = parseAmount(compare)
  const stockN = parseAmount(stock)
  const errors = {
    title: !title.trim() ? "Enter a product name." : null,
    price: priceN === null ? "Enter a price." : Number.isNaN(priceN) ? "Use numbers only, for example 1200 or ১২০০." : priceN === 0 ? "Price must be more than ৳0." : null,
    compare: compareN === null ? null : Number.isNaN(compareN) ? "Use numbers only." : priceN && compareN <= priceN ? "Must be higher than the selling price to show a discount." : null,
    stock: hasVariants || stockN === null ? null : Number.isNaN(stockN) || !Number.isInteger(stockN) ? "Use a whole number, for example 10." : null,
  }
  const discount = priceN && compareN && !errors.compare ? Math.round((1 - priceN / compareN) * 100) : null

  const autoSlug = useMemo(() => {
    const latin = title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-")
    return latin || (title.trim() ? `product-${slugSeed.current}` : "")
  }, [title])

  const variants = useMemo(() => {
    const s = sizes.length ? sizes : [undefined]
    const c = colours.length ? colours : [undefined]
    return s.flatMap((size) => c.map((colour) => ({ key: `${size ?? ""}|${colour ?? ""}`, label: [size, colour].filter(Boolean).join(" / ") }))).filter((v) => v.label)
  }, [sizes, colours])
  const totalStock = hasVariants ? variants.reduce((s, v) => s + (parseAmount(variantStock[v.key] ?? "") || 0), 0) : stockN || 0

  const checklist = [
    { done: photos.length > 0, label: "At least 1 photo" },
    { done: !errors.title, label: "Product name" },
    { done: !errors.price, label: "Selling price" },
    { done: totalStock > 0, label: "Stock to sell" },
  ]
  const ready = checklist.every((c) => c.done)

  const addFiles = (files: FileList | null) => {
    if (!files) return
    const next = Array.from(files).filter((f) => f.type.startsWith("image/")).map((f) => ({ id: crypto.randomUUID(), url: URL.createObjectURL(f), name: f.name }))
    setPhotos((p) => [...p, ...next].slice(0, 8)); setDirty(true)
  }
  const addColour = () => {
    const v = colourDraft.trim()
    if (v && !colours.includes(v)) { setColours([...colours, v]); setDirty(true) }
    setColourDraft("")
  }
  const save = () => {
    setSubmitted(true)
    if (errors.title || errors.price || errors.compare || errors.stock) { toast.error("Fix the highlighted fields to save."); return }
    if (status === "active" && !ready) { toast.error("Finish the checklist to go live, or save as Draft."); return }
    setDirty(false)
    toast.success(status === "active" ? "Product saved and live in your store" : "Product saved as draft")
  }
  const reset = () => {
    setPhotos([]); setTitle(""); setDesc(""); setPrice(""); setCompare(""); setStock(""); setHasVariants(false); setSizes([]); setColours([])
    setVariantStock({}); setVariantPrice({}); setPicked([]); setTouched({}); setSubmitted(false); setDirty(false); setSlugEdit(null); setStatus("draft")
  }

  return (
    <Page className="pb-24 md:pb-8">
      <PageHeader
        backHref="#orders"
        backLabel="Back to products"
        title={title.trim() || "Add product"}
        badge={<Badge variant={status === "active" ? "success" : "muted"}>{status === "active" ? "Active" : "Draft"}</Badge>}
        actions={
          <div className="hidden items-center gap-2 md:flex">
            {dirty && <span className="text-sm text-muted-foreground">Unsaved changes</span>}
            <Button variant="outline" disabled={!dirty} onClick={() => setConfirmDiscard(true)}>Discard</Button>
            <Button onClick={save}>Save</Button>
          </div>
        }
      />

      <PageGrid>
        <PageColumn>
          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
              <CardDescription>The first photo is the cover in your store and in Facebook link previews.</CardDescription>
            </CardHeader>
            <CardContent>
              <input id="photos" type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { addFiles(e.target.files); e.target.value = "" }} />
              {photos.length === 0 ? (
                <label htmlFor="photos" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files) }}
                  className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center transition-colors hover:bg-muted/50">
                  <ImageUpIcon className="size-6 text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm font-medium">Add photos</span>
                  <span className="text-sm text-muted-foreground">Choose from your phone or drop files here. JPEG, PNG or WebP, up to 8.</span>
                </label>
              ) : (
                <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {photos.map((p, i) => (
                    <li key={p.id} className="relative aspect-square overflow-hidden rounded-md border bg-muted">
                      <img src={p.url} alt={p.name} className="size-full object-cover" />
                      {i === 0 ? <Badge className="absolute bottom-2 left-2">Cover</Badge> : (
                        <Button size="icon-xs" variant="secondary" className="absolute bottom-2 left-2" aria-label={`Make ${p.name} the cover`}
                          onClick={() => { setPhotos((ps) => [p, ...ps.filter((x) => x.id !== p.id)]); setDirty(true) }}><StarIcon /></Button>
                      )}
                      <Button size="icon-xs" variant="secondary" className="absolute top-2 right-2" aria-label={`Remove ${p.name}`}
                        onClick={() => { setPhotos((ps) => ps.filter((x) => x.id !== p.id)); setDirty(true) }}><XIcon /></Button>
                    </li>
                  ))}
                  {photos.length < 8 && (
                    <li><label htmlFor="photos" className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed text-sm text-muted-foreground hover:bg-muted/50"><PlusIcon className="size-4" aria-hidden="true" />Add</label></li>
                  )}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent>
              <FieldGroup>
                <Field data-invalid={(shown("title") && !!errors.title) || undefined}>
                  <FieldLabel htmlFor="title">Name</FieldLabel>
                  <Input id="title" value={title} onChange={(e) => edit(setTitle)(e.target.value)} onBlur={blur("title")} aria-invalid={(shown("title") && !!errors.title) || undefined} />
                  {shown("title") && errors.title ? <FieldError>{errors.title}</FieldError> : (
                    <FieldDescription>
                      {autoSlug ? <>Web address: <span className="text-foreground">/products/{slugEdit ?? autoSlug}</span>{slugEdit === null && <> · <button type="button" className="underline underline-offset-4" onClick={() => setSlugEdit(autoSlug)}>Edit</button></>}</> : "Bangla or English. Example: Cotton Panjabi."}
                    </FieldDescription>
                  )}
                </Field>
                {slugEdit !== null && (
                  <Field>
                    <FieldLabel htmlFor="slug">Web address</FieldLabel>
                    <InputGroup>
                      <InputGroupAddon><InputGroupText>/products/</InputGroupText></InputGroupAddon>
                      <InputGroupInput id="slug" value={slugEdit} onChange={(e) => setSlugEdit(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} />
                    </InputGroup>
                  </Field>
                )}
                <Field>
                  <FieldLabel htmlFor="desc">Description</FieldLabel>
                  <Textarea id="desc" rows={4} value={desc} onChange={(e) => edit(setDesc)(e.target.value)} />
                  <FieldDescription>Fabric, fit, size guide and wash care. Shoppers ask these before ordering.</FieldDescription>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field data-invalid={(shown("price") && !!errors.price) || undefined}>
                    <FieldLabel htmlFor="price">Selling price</FieldLabel>
                    <MoneyInput id="price" value={price} onChange={(e) => edit(setPrice)(e.target.value)} onBlur={blur("price")} aria-invalid={(shown("price") && !!errors.price) || undefined} />
                    {shown("price") && errors.price && <FieldError>{errors.price}</FieldError>}
                  </Field>
                  <Field data-invalid={(shown("compare") && !!errors.compare) || undefined}>
                    <FieldLabel htmlFor="compare">Regular price</FieldLabel>
                    <MoneyInput id="compare" value={compare} onChange={(e) => edit(setCompare)(e.target.value)} onBlur={blur("compare")} aria-invalid={(shown("compare") && !!errors.compare) || undefined} />
                    {shown("compare") && errors.compare ? <FieldError>{errors.compare}</FieldError> : <FieldDescription>Optional. Shown crossed out.</FieldDescription>}
                  </Field>
                </div>
                {priceN ? (
                  <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted px-4 py-2 text-sm" aria-live="polite">
                    <span className="text-muted-foreground">Shoppers see</span>
                    <Money value={priceN} className="font-semibold" />
                    {discount !== null && compareN && <><Money value={compareN} className="text-muted-foreground line-through" /><Badge variant="destructive">{discount}% off</Badge></>}
                  </div>
                ) : null}
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle><label htmlFor="has-variants">Sizes and colours</label></CardTitle>
              <CardDescription>Turn on when shoppers pick a size or colour. Each option gets its own stock.</CardDescription>
              <CardAction><Switch id="has-variants" checked={hasVariants} onCheckedChange={edit(setHasVariants)} /></CardAction>
            </CardHeader>
            <CardContent>
              {!hasVariants ? (
                <Field data-invalid={(shown("stock") && !!errors.stock) || undefined} className="sm:max-w-60">
                  <FieldLabel htmlFor="stock">Stock</FieldLabel>
                  <Input id="stock" inputMode="numeric" value={stock} onChange={(e) => edit(setStock)(e.target.value)} onBlur={blur("stock")} aria-invalid={(shown("stock") && !!errors.stock) || undefined} />
                  {shown("stock") && errors.stock ? <FieldError>{errors.stock}</FieldError> : <FieldDescription>How many you can sell now.</FieldDescription>}
                </Field>
              ) : (
                <FieldGroup>
                  <FieldSet>
                    <FieldLegend variant="label">Sizes</FieldLegend>
                    <ToggleGroup type="multiple" variant="outline" spacing={2} value={sizes} onValueChange={edit(setSizes)} className="flex-wrap">
                      {SIZE_PRESETS.map((s) => <ToggleGroupItem key={s} value={s} className="min-w-10 px-4">{s}</ToggleGroupItem>)}
                    </ToggleGroup>
                  </FieldSet>
                  <Field>
                    <FieldLabel htmlFor="colour">Colours</FieldLabel>
                    {colours.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {colours.map((c) => (
                          <Badge key={c} variant="secondary" className="gap-1 pr-1">
                            {c}
                            <button type="button" aria-label={`Remove ${c}`} className="rounded-sm p-0.5 hover:bg-foreground/10" onClick={() => { setColours(colours.filter((x) => x !== c)); setDirty(true) }}><XIcon className="size-3" /></button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 sm:max-w-sm">
                      <Input id="colour" placeholder="e.g. Maroon" value={colourDraft} onChange={(e) => setColourDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addColour() } }} />
                      <Button type="button" variant="outline" onClick={addColour}>Add</Button>
                    </div>
                  </Field>

                  {variants.length > 0 && (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm text-muted-foreground">{variants.length} options · {totalStock} in stock</span>
                        <div className="flex items-center gap-2">
                          <Input aria-label="Stock for every option" placeholder="Stock" inputMode="numeric" className="h-8 w-20" value={bulkStock} onChange={(e) => setBulkStock(e.target.value)} />
                          <Button size="sm" variant="outline" disabled={!bulkStock} onClick={() => { setVariantStock(Object.fromEntries(variants.map((v) => [v.key, bulkStock]))); setDirty(true) }}>Apply to all</Button>
                        </div>
                      </div>
                      <div className="overflow-hidden rounded-md border">
                        <Table>
                          <TableHeader><TableRow><TableHead>Option</TableHead><TableHead className="w-36">Price</TableHead><TableHead className="w-24">Stock</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {variants.map((v) => (
                              <TableRow key={v.key}>
                                <TableCell className="font-medium">{v.label}</TableCell>
                                <TableCell><MoneyInput className="h-8" aria-label={`Price for ${v.label}`} placeholder={priceN ? String(priceN) : "0"} value={variantPrice[v.key] ?? ""} onChange={(e) => { setVariantPrice({ ...variantPrice, [v.key]: e.target.value }); setDirty(true) }} /></TableCell>
                                <TableCell><Input className="h-8" aria-label={`Stock for ${v.label}`} inputMode="numeric" placeholder="0" value={variantStock[v.key] ?? ""} onChange={(e) => { setVariantStock({ ...variantStock, [v.key]: e.target.value }); setDirty(true) }} /></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <p className="text-sm text-muted-foreground">An empty price uses the selling price.</p>
                    </div>
                  )}
                </FieldGroup>
              )}
            </CardContent>
          </Card>
        </PageColumn>

        <PageColumn>
          <Card>
            <CardHeader><CardTitle>Status</CardTitle></CardHeader>
            <CardContent className="gap-6">
              <ChoiceCardGroup<Status> name="status" aria-label="Status" value={status} onValueChange={edit(setStatus)} choices={[
                { value: "draft", title: "Draft", description: "Only you can see it." },
                { value: "active", title: "Active", description: "Live in your store." },
              ]} />
              <div className={cn("flex flex-col gap-2", status === "active" && !ready && submitted && "text-destructive")}>
                <span className="text-sm font-medium">Ready to sell</span>
                <ul className="flex flex-col gap-2">
                  {checklist.map((c) => (
                    <li key={c.label} className={cn("flex items-center gap-2 text-sm", !c.done && "text-muted-foreground")}>
                      {c.done ? <CheckCircle2Icon className="size-4 text-success" aria-hidden="true" /> : <CircleIcon className="size-4" aria-hidden="true" />}
                      {c.label}<span className="sr-only">{c.done ? ", done" : ", missing"}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Shipping</CardTitle></CardHeader>
            <CardContent>
              <Field>
                <FieldLabel htmlFor="weight">Weight with packaging</FieldLabel>
                <InputGroup>
                  <InputGroupInput id="weight" inputMode="numeric" value={weight} onChange={(e) => edit(setWeight)(e.target.value)} />
                  <InputGroupAddon align="inline-end"><InputGroupText>g</InputGroupText></InputGroupAddon>
                </InputGroup>
                <FieldDescription>Couriers charge more above 1 kg.</FieldDescription>
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Collections</CardTitle><CardDescription>Groups shoppers browse, like Eid collection.</CardDescription></CardHeader>
            <CardContent>
              <FieldGroup className="gap-4">
                <FieldSet>
                  <FieldLegend className="sr-only">Collections</FieldLegend>
                  <div className="flex flex-col gap-2">
                    {collections.map((c) => (
                      <Field key={c} orientation="horizontal">
                        <Checkbox id={`col-${c}`} checked={picked.includes(c)} onCheckedChange={(v) => { setPicked(v ? [...picked, c] : picked.filter((x) => x !== c)); setDirty(true) }} />
                        <FieldLabel htmlFor={`col-${c}`} className="font-normal">{c}</FieldLabel>
                      </Field>
                    ))}
                  </div>
                </FieldSet>
                <form className="flex gap-2" onSubmit={(e) => {
                  e.preventDefault()
                  const v = newCollection.trim()
                  if (v && !collections.includes(v)) { setCollections([...collections, v]); setPicked([...picked, v]); setDirty(true) }
                  setNewCollection("")
                }}>
                  <Input aria-label="New collection name" placeholder="New collection" value={newCollection} onChange={(e) => setNewCollection(e.target.value)} />
                  <Button type="submit" variant="outline">Create</Button>
                </form>
              </FieldGroup>
            </CardContent>
          </Card>
        </PageColumn>
      </PageGrid>

      <MobileSaveBar dirty={dirty} onDiscard={() => setConfirmDiscard(true)} onSave={save} />

      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard this product?</AlertDialogTitle>
            <AlertDialogDescription>Your photos and details are not saved. Save as Draft to keep them.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={reset}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  )
}
