import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SAMPLE_ORDERS, type Order } from "@/data/orders"
import { CheckoutPage } from "@/pages/checkout-page"
import { OrdersPage } from "@/pages/orders-page"

function useHashRoute() {
  const [route, setRoute] = useState(() => window.location.hash.replace("#", "") || "/orders")
  useEffect(() => {
    const on = () => setRoute(window.location.hash.replace("#", "") || "/orders")
    window.addEventListener("hashchange", on)
    return () => window.removeEventListener("hashchange", on)
  }, [])
  return route
}

export default function App() {
  const route = useHashRoute()
  const [orders, setOrders] = useState<Order[]>(SAMPLE_ORDERS)
  const toConfirm = orders.filter((o) => o.status === "confirm").length

  return (
    <TooltipProvider>
      {route === "/checkout" ? (
        <CheckoutPage />
      ) : (
        <SidebarProvider>
          <AppSidebar toConfirm={toConfirm} />
          <SidebarInset>
            <OrdersPage orders={orders} setOrders={(fn) => setOrders(fn)} />
          </SidebarInset>
        </SidebarProvider>
      )}
      <Toaster position="bottom-center" />
    </TooltipProvider>
  )
}
