// Sample business data for the Home prototype. Not real figures.

export type DayPoint = { date: string; label: string; orders: number; sales: number }

// 30 days of orders with a weekly rhythm (Friday peak) and a slow upward trend. Deterministic.
export const DAILY: DayPoint[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(2026, 9, 17 + i) // Oct 17 to Nov 15, 2026
  const weekday = d.getDay()
  const base = 3 + Math.round(i / 10)
  const bump = weekday === 5 ? 4 : weekday === 6 ? 2 : weekday === 4 ? 1 : 0
  const wobble = [0, 1, -1, 0, 2, -1, 1][i % 7]
  const orders = Math.max(1, base + bump + wobble)
  return {
    date: d.toISOString().slice(0, 10),
    label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    orders,
    sales: orders * 1290,
  }
})

export const KPIS = {
  sales: { value: 184350, prev: 164600 },
  orders: { value: 142, prev: 131 },
  deliveryRate: { value: 86, prev: 88 }, // delivered / (delivered + returned), %
  codWithCouriers: { value: 38400, parcels: 27 },
}

export const COURIER_CASH = [
  { courier: "Pathao", amount: 18200, parcels: 13, settles: "Tue, Nov 17" },
  { courier: "Steadfast", amount: 14600, parcels: 10, settles: "Wed, Nov 18" },
  { courier: "RedX", amount: 5600, parcels: 4, settles: "Thu, Nov 19" },
]

export const TOP_PRODUCTS = [
  { title: "Cotton Panjabi", sold: 38, revenue: 45600 },
  { title: "Cotton three-piece", sold: 24, revenue: 34800 },
  { title: "Hijab, jersey", sold: 41, revenue: 10250 },
]

export const LOW_STOCK = [
  { title: "Cotton Panjabi", variant: "L / White", left: 2 },
  { title: "Kids kurti", variant: "6Y", left: 1 },
]

export const SETUP_STEPS = [
  { key: "product", title: "Add your first product", description: "Photos, price and stock. Takes about 2 minutes.", action: "Add product", href: "#product-new" },
  { key: "delivery", title: "Set delivery charges", description: "Inside Dhaka and outside Dhaka. Without this, every order ships free.", action: "Set charges", href: "#home" },
  { key: "payment", title: "Add bKash or Nagad", description: "Let customers pay the delivery charge in advance. Cuts fake orders.", action: "Add payment", href: "#home" },
  { key: "homepage", title: "Edit your homepage", description: "Replace the sample banner text and add your logo.", action: "Edit homepage", href: "#home" },
  { key: "share", title: "Share your store link", description: "Post it on your Facebook page and WhatsApp.", action: "Share link", href: "#home" },
] as const

export const pctChange = (now: number, prev: number) => Math.round(((now - prev) / prev) * 100)
