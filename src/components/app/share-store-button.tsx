import { toast } from "sonner"
import { CopyIcon, MessageCircleIcon, Share2Icon, ThumbsUpIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useApp } from "@/store/store"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


/** Store link with the three places BD sellers actually share it. */
export function ShareStoreButton({ variant = "outline", size }: { variant?: "outline" | "default"; size?: "sm" | "default" }) {
  const { state, set } = useApp()
  const host = state.domain?.status === "connected" ? state.domain.name : `${state.store.handle}.ghuri.store`
  const STORE_URL = `https://${host}`
  const shared = () => set((s) => (s.shared ? s : { ...s, shared: true }))
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size}><Share2Icon />Share store</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal text-muted-foreground">{host}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => { navigator.clipboard?.writeText(STORE_URL).catch(() => {}); shared(); toast("Store link copied") }}><CopyIcon />Copy link</DropdownMenuItem>
        <DropdownMenuItem asChild><a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(STORE_URL)}`} target="_blank" rel="noreferrer" onClick={shared}><ThumbsUpIcon />Post on Facebook</a></DropdownMenuItem>
        <DropdownMenuItem asChild><a href={`https://wa.me/?text=${encodeURIComponent(STORE_URL)}`} target="_blank" rel="noreferrer" onClick={shared}><MessageCircleIcon />Send on WhatsApp</a></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
