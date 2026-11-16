import { useEffect, useState, useSyncExternalStore } from "react"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"

/**
 * In-app unsaved-changes guard for the hash router.
 * Pages call useUnsavedGuard(dirty). App.tsx passes every hashchange to interceptHashChange;
 * when a registered page is dirty the old hash is restored and UnsavedGuardDialog asks first.
 */
const dirtyPages = new Set<object>()
let skipNext = false
let pending: string | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function useUnsavedGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return
    const token = {}
    dirtyPages.add(token)
    return () => { dirtyPages.delete(token) }
  }, [dirty])
}

/** Navigate without the guard, for example right after a successful save. */
export function navigateTo(hash: string) {
  skipNext = true
  dirtyPages.clear()
  window.location.hash = hash
}

/** Returns true when the change may go ahead; false when it was blocked and the dialog opened. */
export function interceptHashChange(e: HashChangeEvent): boolean {
  if (skipNext) { skipNext = false; return true }
  if (dirtyPages.size === 0) return true
  pending = new URL(e.newURL).hash.replace("#", "")
  history.replaceState(history.state, "", e.oldURL)
  emit()
  return false
}

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }

export function UnsavedGuardDialog() {
  const target = useSyncExternalStore(subscribe, () => pending)
  const [, force] = useState(0)
  const close = () => { pending = null; emit(); force((n) => n + 1) }
  return (
    <AlertDialog open={target !== null} onOpenChange={(o) => { if (!o) close() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
          <AlertDialogDescription>Your changes on this page will be lost. Stay to save them first.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Stay</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => { const t = target ?? "home"; close(); navigateTo(t) }}>Leave</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
