export type OrderStatus = "confirm" | "ship" | "transit" | "delivered" | "returned" | "cancelled"
export type Courier = "Pathao" | "Steadfast" | "RedX" | "Other"
export type PayMethod = "COD" | "bKash paid" | "Nagad paid"

export type OrderItem = { productId?: string; title: string; variant?: string; qty: number; price: number }

export type Order = {
  id: number
  createdAt: number
  name: string
  phone: string
  district: string
  thana: string
  address: string
  items: OrderItem[]
  fee: number
  pay: PayMethod
  advancePaid?: number
  status: OrderStatus
  noAnswer: number
  courier?: Courier
  consignment?: string
  cancelReason?: string
  note?: string
  log: { at: number; text: string }[]
  /** Derived by the store from other orders with the same phone. */
  history: { orders: number; delivered: number; returned: number }
}

export type ProductStatus = "active" | "draft" | "archived"
export type Variant = { key: string; label: string; price?: number; stock: number }

export type Product = {
  id: string
  title: string
  slug: string
  description: string
  photos: string[]
  /** Placeholder tint for products without a photo in the prototype. */
  tint: string
  price: number
  compareAt?: number
  status: ProductStatus
  sizes: string[]
  colours: string[]
  variants: Variant[]
  stock: number
  weight: number
  collectionIds: string[]
  sold: number
}

export type Collection = { id: string; title: string; description: string; visible: boolean }

export type Zone = { id: string; name: string; districts: "dhaka" | "rest"; fee: number; eta: string }

export type Payments = {
  cod: boolean
  advanceDelivery: boolean
  bkash: { enabled: boolean; number: string; type: "personal" | "merchant" }
  nagad: { enabled: boolean; number: string; type: "personal" | "merchant" }
}

export type StoreInfo = {
  name: string
  handle: string
  phone: string
  whatsapp: string
  facebook: string
  address: string
  returnPolicy: string
}

export type ThemeSettings = {
  announcement: string
  heroTitle: string
  heroSubtitle: string
  heroCta: string
  showCollections: boolean
  edited: boolean
}

export type Member = { id: string; name: string; contact: string; role: "Owner" | "Admin" | "Staff"; pending?: boolean }

export type Domain = { name: string; status: "pending" | "verifying" | "connected" } | null

export type CartLine = { productId: string; variantKey?: string; qty: number }

export type AppState = {
  version: 3
  account: { name: string; phone: string; email: string } | null
  store: StoreInfo
  products: Product[]
  collections: Collection[]
  orders: Order[]
  zones: Zone[]
  freeDeliveryOver: number | null
  payments: Payments
  theme: ThemeSettings
  team: Member[]
  domain: Domain
  aiConnected: string[]
  shared: boolean
  cart: CartLine[]
  customerNotes: Record<string, string>
}
