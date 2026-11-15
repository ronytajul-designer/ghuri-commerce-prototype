import { ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Product } from "@/store/types"

/** Product photo, or a tinted tile with the product's initial when there is no photo yet. */
export function ProductThumb({ product, className }: { product: Pick<Product, "title" | "photos" | "tint">; className?: string }) {
  const src = product.photos[0]
  return (
    <div className={cn("relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border text-sm font-medium text-foreground/60", className)} style={src ? undefined : { background: product.tint }}>
      {src ? <img src={src} alt="" className="size-full object-cover" /> : product.title ? product.title[0].toUpperCase() : <ImageIcon className="size-4" aria-hidden="true" />}
    </div>
  )
}
