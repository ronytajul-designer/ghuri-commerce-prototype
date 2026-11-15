import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider, useAppTheme } from "@/components/mode-toggle"
import { SAMPLE_ORDERS, type Order } from "@/data/orders"
import { CheckoutPage } from "@/pages/checkout-page"
import { OrdersPage } from "@/pages/orders-page"
import { ProductFormPage } from "@/pages/product-form-page"

function useHashRoute() {
  const [route, setRoute] = useState(() => window.location.hash.replace("#", "") || "orders")
  useEffect(() => {
    const on = () => setRoute(window.location.hash.replace("#", "") || "orders")
    window.addEventListener("hashchange", on)
    return () => window.removeEventListener("hashchange", on)
  }, [])
  return route
}

export default function App() {
  return <ThemeProvider><Shell /></ThemeProvider>
}

function Shell() {
  const { theme } = useAppTheme()
  const route = useHashRoute()
  const [orders, setOrders] = useState<Order[]>(SAMPLE_ORDERS)
  const toConfirm = orders.filter((o) => o.status === "confirm").length

  return (
    <TooltipProvider>
      {route === "checkout" ? (
        <CheckoutPage />
      ) : (
        <SidebarProvider>
          <AppSidebar toConfirm={toConfirm} route={route} />
          <SidebarInset>
            {route === "product-new" ? <ProductFormPage /> : <OrdersPage orders={orders} setOrders={(fn) => setOrders(fn)} />}
          </SidebarInset>
        </SidebarProvider>
      )}
      <Toaster position="bottom-center" theme={theme} />
    </TooltipProvider>
  )
}
