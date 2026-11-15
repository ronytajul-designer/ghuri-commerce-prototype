import { useEffect, useState } from "react"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider, useAppTheme } from "@/components/mode-toggle"
import { AppShell } from "@/components/app/app-shell"
import { SAMPLE_ORDERS, type Courier, type Order, codDue, taka } from "@/data/orders"
import { CheckoutPage } from "@/pages/checkout-page"
import { OrderDetailPage, type OrderActions } from "@/pages/order-detail-page"
import { OrdersListPage } from "@/pages/orders-list-page"
import { ProductFormPage } from "@/pages/product-form-page"
import { HomePage } from "@/pages/home-page"

// Routes are plain hash names (#home, #orders, #order-1011, #product-new, #checkout) so they also work inside a Claude artifact.
function useHashRoute() {
  const read = () => window.location.hash.replace("#", "") || "home"
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const on = () => { setRoute(read()); window.scrollTo(0, 0) }
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

  const update = (id: number, fn: (o: Order) => Order) => setOrders((all) => all.map((o) => (o.id === id ? fn(o) : o)))
  const log = (o: Order, text: string): Order => ({ ...o, log: [{ when: "Just now", text }, ...o.log] })
  const book = (ids: number[], courier: Courier) =>
    setOrders((all) => all.map((o) => {
      if (!ids.includes(o.id)) return o
      const cid = `${courier.slice(0, 2).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`
      return log({ ...o, status: "transit", courier, consignment: cid }, `Booked with ${courier}, ${cid} (by Tajul)`)
    }))
  const actions: OrderActions = {
    confirm: (id) => update(id, (o) => log({ ...o, status: "ship" }, "Confirmed by phone (by Tajul)")),
    noAnswer: (id) => update(id, (o) => log({ ...o, noAnswer: o.noAnswer + 1 }, `Call attempt ${o.noAnswer + 1}: no answer (by Tajul)`)),
    cancel: (id, reason) => update(id, (o) => log({ ...o, status: "cancelled", cancelReason: reason }, `Cancelled: ${reason} (by Tajul)`)),
    book,
    delivered: (id) => update(id, (o) => log({ ...o, status: "delivered" }, `Delivered, ${taka(codDue(o))} to be settled by ${o.courier}`)),
    returned: (id) => update(id, (o) => log({ ...o, status: "returned", history: { ...o.history, returned: o.history.returned + 1 } }, "Marked returned (by Tajul)")),
    note: (id, text) => update(id, (o) => log(o, `Note: ${text}`)),
  }
  const toConfirm = orders.filter((o) => o.status === "confirm").length
  const orderMatch = route.match(/^order-(\d+)$/)

  let content: React.ReactNode
  if (route === "checkout") content = <CheckoutPage />
  else if (route === "product-new") content = <AppShell active="products" badges={{ orders: toConfirm }}><ProductFormPage /></AppShell>
  else if (orderMatch) content = <AppShell active="orders" badges={{ orders: toConfirm }}><OrderDetailPage order={orders.find((o) => o.id === Number(orderMatch[1]))} actions={actions} /></AppShell>
  else if (route === "orders") content = <AppShell active="orders" badges={{ orders: toConfirm }}><OrdersListPage orders={orders} onBook={book} /></AppShell>
  else content = <AppShell active="home" badges={{ orders: toConfirm }}><HomePage orders={orders} /></AppShell>

  return (
    <TooltipProvider>
      {content}
      <Toaster position="bottom-center" theme={theme} />
    </TooltipProvider>
  )
}
