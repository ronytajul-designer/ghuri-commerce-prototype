import { Button } from "@/components/ui/button"

/** Fixed bottom bar on phones for long forms. Desktop puts the same actions in the PageHeader. */
export function MobileSaveBar({ dirty, onDiscard, onSave }: { dirty: boolean; onDiscard: () => void; onSave: () => void }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-2 border-t bg-background px-4 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] md:hidden">
      <span className="flex-1 text-sm text-muted-foreground">{dirty ? "Unsaved changes" : "No changes"}</span>
      <Button variant="outline" disabled={!dirty} onClick={onDiscard}>Discard</Button>
      <Button onClick={onSave}>Save</Button>
    </div>
  )
}
