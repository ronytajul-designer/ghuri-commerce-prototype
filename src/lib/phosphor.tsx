import { forwardRef } from "react"
import type { Icon, IconProps } from "@phosphor-icons/react"

const cache = new Map<Icon, Icon>()

/**
 * Locks a Phosphor icon to the outline "regular" weight, even inside TuffUI
 * components that pass weight="fill" or "bold" to icons they render.
 */
export function outline(I: Icon): Icon {
  let wrapped = cache.get(I)
  if (!wrapped) {
    wrapped = forwardRef<SVGSVGElement, IconProps>((props, ref) => <I ref={ref} {...props} weight="regular" />) as Icon
    wrapped.displayName = `Outline(${I.displayName ?? "Icon"})`
    cache.set(I, wrapped)
  }
  return wrapped
}
