import { useEffect, useState } from "react"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider, useAppTheme } from "@/components/mode-toggle"
import { AppShell, type NavKey } from "@/components/app/app-shell"
import { AppProvider, useApp } from "@/store/store"
import { CheckoutPage } from "@/pages/checkout-page"
import { OrderDetailPage } from "@/pages/order-detail-page"
import { OrdersListPage } from "@/pages/orders-list-page"
import { ProductFormPage } from "@/pages/product-form-page"
import { ProductsPage } from "@/pages/products-page"
import { HomePage } from "@/pages/home-page"
import { CollectionFormPage, CollectionsPage } from "@/pages/collections-page"
import { CustomerDetailPage, CustomersPage } from "@/pages/customers-page"
import { ThemePage } from "@/pages/theme-page"
import {
  AccountSettingsPage, AiSettingsPage, DomainSettingsPage, GeneralSettingsPage, PaymentsSettingsPage, ShippingSettingsPage, TeamSettingsPage,
} from "@/pages/settings-pages"
import { CartPage, StoreHomePage, StoreProductPage } from "@/pages/storefront-pages"
import { LoginPage, SignupPage } from "@/pages/auth-pages"

/**
 * Routes are plain hash names so they also work inside a Claude artifact:
 * admin:      #home #orders #order-1011 #products #product-new #product-p1 #collections #collection-new #collection-c1
 *             #customers #customer-01711223344 #theme #settings-general|shipping|payments|team|domains|ai|account
 * storefront: #store #store-p-p1 #cart #checkout   auth: #login #signup
 */
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
  return (
    <ThemeProvider>
      <AppProvider>
        <Shell />
      </AppProvider>
    </ThemeProvider>
  )
}

function Shell() {
  const { theme } = useAppTheme()
  const route = useHashRoute()
  const { state } = useApp()
  const toConfirm = state.orders.filter((o) => o.status === "confirm").length
  const admin = (active: NavKey, page: React.ReactNode) => <AppShell active={active} badges={{ orders: toConfirm }}>{page}</AppShell>
  const m = (re: RegExp) => route.match(re)?.[1]

  let content: React.ReactNode
  if (route === "login") content = <LoginPage />
  else if (route === "signup") content = <SignupPage />
  else if (route === "store") content = <StoreHomePage />
  else if (m(/^store-p-(.+)$/)) content = <StoreProductPage key={route} id={m(/^store-p-(.+)$/)!} />
  else if (route === "cart") content = <CartPage />
  else if (route === "checkout") content = <CheckoutPage />
  else if (route === "orders") content = admin("orders", <OrdersListPage />)
  else if (m(/^order-(\d+)$/)) content = admin("orders", <OrderDetailPage key={route} id={Number(m(/^order-(\d+)$/))} />)
  else if (route === "products") content = admin("products", <ProductsPage />)
  else if (route === "product-new") content = admin("products", <ProductFormPage key={route} />)
  else if (m(/^product-(.+)$/)) content = admin("products", <ProductFormPage key={route} id={m(/^product-(.+)$/)} />)
  else if (route === "collections") content = admin("collections", <CollectionsPage />)
  else if (route === "collection-new") content = admin("collections", <CollectionFormPage key={route} />)
  else if (m(/^collection-(.+)$/)) content = admin("collections", <CollectionFormPage key={route} id={m(/^collection-(.+)$/)} />)
  else if (route === "customers") content = admin("customers", <CustomersPage />)
  else if (m(/^customer-(.+)$/)) content = admin("customers", <CustomerDetailPage key={route} phone={m(/^customer-(.+)$/)!} />)
  else if (route === "theme") content = admin("theme", <ThemePage />)
  else if (route === "settings" || route === "settings-general") content = admin("settings", <GeneralSettingsPage />)
  else if (route === "settings-shipping") content = admin("settings", <ShippingSettingsPage />)
  else if (route === "settings-payments") content = admin("settings", <PaymentsSettingsPage />)
  else if (route === "settings-team") content = admin("settings", <TeamSettingsPage />)
  else if (route === "settings-domains") content = admin("settings", <DomainSettingsPage />)
  else if (route === "settings-ai") content = admin("settings", <AiSettingsPage />)
  else if (route === "settings-account") content = admin("settings", <AccountSettingsPage />)
  else content = admin("home", <HomePage />)

  return (
    <TooltipProvider>
      {content}
      <Toaster position="bottom-center" theme={theme} />
    </TooltipProvider>
  )
}
