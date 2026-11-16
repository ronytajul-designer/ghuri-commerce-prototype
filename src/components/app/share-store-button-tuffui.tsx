import { toast } from "sonner"
import { Copy, FacebookLogo, ShareNetwork, WhatsappLogo } from "@phosphor-icons/react"
import { Button as ActionButton } from "@/components/ui/action-button"
import { Menu } from "@/components/ui/action-menu"
import { outline } from "@/lib/phosphor"
import { useApp } from "@/store/store"

const ShareIcon = outline(ShareNetwork)

/** TuffUI version of the share menu: the three places BD sellers actually share a store link. */
export function ShareStoreButtonTuffui({ variant = "secondary", size = "md" }: { variant?: "primary" | "secondary"; size?: "sm" | "md" }) {
  const { state, set } = useApp()
  const host = state.domain?.status === "connected" ? state.domain.name : `${state.store.handle}.ghuri.store`
  const url = `https://${host}`
  const shared = () => set((s) => (s.shared ? s : { ...s, shared: true }))
  const open = (href: string) => { shared(); window.open(href, "_blank", "noopener,noreferrer") }
  return (
    <Menu
      align="end"
      className="w-64"
      trigger={<ActionButton variant={variant} size={size} icon={ShareIcon}>Share store</ActionButton>}
      groups={[{
        label: host,
        items: [
          { id: "copy", label: "Copy link", icon: outline(Copy), onSelect: () => { navigator.clipboard?.writeText(url).catch(() => {}); shared(); toast("Store link copied") } },
          { id: "fb", label: "Post on Facebook", icon: outline(FacebookLogo), onSelect: () => open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`) },
          { id: "wa", label: "Send on WhatsApp", icon: outline(WhatsappLogo), onSelect: () => open(`https://wa.me/?text=${encodeURIComponent(url)}`) },
        ],
      }]}
    />
  )
}
