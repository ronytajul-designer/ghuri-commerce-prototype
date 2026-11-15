import { toast } from "sonner"
import { CopyIcon, MessageCircleIcon, Share2Icon, ThumbsUpIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const STORE_URL = "https://tajul-1.ghuri.store"

/** Store link with the three places BD sellers actually share it. */
export function ShareStoreButton({ variant = "outline" }: { variant?: "outline" | "default" }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant}><Share2Icon />Share store</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal text-muted-foreground">tajul-1.ghuri.store</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => { navigator.clipboard?.writeText(STORE_URL).catch(() => {}); toast("Store link copied") }}><CopyIcon />Copy link</DropdownMenuItem>
        <DropdownMenuItem asChild><a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(STORE_URL)}`} target="_blank" rel="noreferrer"><ThumbsUpIcon />Post on Facebook</a></DropdownMenuItem>
        <DropdownMenuItem asChild><a href={`https://wa.me/?text=${encodeURIComponent(STORE_URL)}`} target="_blank" rel="noreferrer"><MessageCircleIcon />Send on WhatsApp</a></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
