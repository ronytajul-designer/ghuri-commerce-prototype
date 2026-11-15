import type { AppState, Order, Product } from "./types"

// Sample data for the prototype. Names, phones and orders are invented.

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

export const DEFAULT_THEME = {
  announcement: "",
  heroTitle: "Made to be worn every day",
  heroSubtitle: "Thoughtfully chosen products, delivered to your door.",
  heroCta: "Shop all",
  showCollections: true,
  edited: false,
}

/** Sample product photo: a soft tinted square with the product's initial, as an inline SVG. */
export function placeholderPhoto(tint: string, title: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="${tint}"/><text x="200" y="230" font-family="system-ui,sans-serif" font-size="120" font-weight="600" text-anchor="middle" fill="rgba(0,0,0,.35)">${title[0]}</text></svg>`
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg)
}

function product(p: Partial<Product> & Pick<Product, "id" | "title" | "price">): Product {
  const tint = p.tint ?? "oklch(0.92 0.03 60)"
  return {
    photos: [placeholderPhoto(tint, p.title)],
    slug: p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    description: "",
    tint,
    status: "active",
    sizes: [],
    colours: [],
    variants: [],
    stock: 0,
    weight: 400,
    collectionIds: [],
    sold: 0,
    ...p,
  }
}

const v = (label: string, stock: number) => ({ key: label, label, stock })

const PRODUCTS: Product[] = [
  product({ id: "p1", title: "Cotton Panjabi", price: 1200, compareAt: 1500, tint: "oklch(0.9 0.04 80)", description: "Soft cotton, regular fit. Machine wash cold.", sizes: ["M", "L", "XL"], colours: ["White", "Maroon"], variants: [v("M / White", 6), v("M / Maroon", 4), v("L / White", 2), v("L / Maroon", 7), v("XL / White", 5), v("XL / Maroon", 3)], collectionIds: ["c1", "c3"], sold: 38 }),
  product({ id: "p2", title: "Cotton three-piece", price: 1450, tint: "oklch(0.9 0.05 20)", description: "Unstitched three-piece with printed dupatta.", sizes: [], colours: ["Peach", "Mint"], variants: [v("Peach", 8), v("Mint", 6)], collectionIds: ["c1", "c4"], sold: 24 }),
  product({ id: "p3", title: "Hijab, jersey", price: 250, tint: "oklch(0.88 0.03 300)", colours: ["Black", "Maroon", "Navy"], variants: [v("Black", 20), v("Maroon", 12), v("Navy", 9)], collectionIds: ["c2"], sold: 41 }),
  product({ id: "p4", title: "Kids kurti", price: 650, compareAt: 800, tint: "oklch(0.9 0.05 150)", sizes: ["4Y", "6Y", "8Y"], variants: [v("4Y", 4), v("6Y", 1), v("8Y", 5)], collectionIds: ["c2"], sold: 12 }),
  product({ id: "p5", title: "Polo shirt", price: 890, tint: "oklch(0.9 0.04 240)", sizes: ["M", "L", "XL"], variants: [v("M", 7), v("L", 9), v("XL", 4)], collectionIds: ["c2"], sold: 15 }),
  product({ id: "p6", title: "Attar, 6 ml", price: 350, tint: "oklch(0.9 0.05 100)", stock: 30, collectionIds: ["c1"], sold: 19 }),
  product({ id: "p7", title: "Prayer mat", price: 950, status: "draft", tint: "oklch(0.9 0.03 180)", stock: 10, collectionIds: [] }),
]

const COLLECTIONS = [
  { id: "c1", title: "Eid collection", description: "Panjabi, three-piece and attar for Eid.", visible: true },
  { id: "c2", title: "New arrivals", description: "Added in the last 30 days.", visible: true },
  { id: "c3", title: "Panjabi", description: "", visible: true },
  { id: "c4", title: "Three-piece", description: "", visible: true },
]

function order(o: Partial<Order> & Pick<Order, "id" | "name" | "phone" | "district" | "items" | "status">, agoMs: number, now: number): Order {
  const createdAt = now - agoMs
  return {
    thana: "", address: "House 10, Road 5", fee: o.district === "Dhaka" ? 80 : 150, pay: "COD", noAnswer: 0,
    history: { orders: 0, delivered: 0, returned: 0 },
    log: [{ at: createdAt, text: "Order placed from storefront" }],
    ...o,
    createdAt,
  }
}

function seedOrders(now: number): Order[] {
  const i = (productId: string, title: string, qty: number, price: number, variant?: string) => ({ productId, title, variant, qty, price })
  const past: Order[] = [
    // Earlier history that drives the risk signals on today's orders.
    order({ id: 990, name: "Rahima Akter", phone: "01711223344", district: "Dhaka", thana: "Mirpur", items: [i("p3", "Hijab, jersey", 2, 250, "Black")], status: "delivered", courier: "Pathao" }, 40 * DAY, now),
    order({ id: 994, name: "Rahima Akter", phone: "01711223344", district: "Dhaka", thana: "Mirpur", items: [i("p2", "Cotton three-piece", 1, 1450, "Peach")], status: "delivered", courier: "Pathao" }, 25 * DAY, now),
    order({ id: 998, name: "Rahima Akter", phone: "01711223344", district: "Dhaka", thana: "Mirpur", items: [i("p6", "Attar, 6 ml", 1, 350)], status: "delivered", courier: "Steadfast" }, 9 * DAY, now),
    order({ id: 991, name: "Sabbir Hossain", phone: "01819876543", district: "Chattogram", thana: "Panchlaish", items: [i("p1", "Cotton Panjabi", 1, 1200, "L / White")], status: "returned", courier: "RedX", log: [{ at: now - 30 * DAY, text: "Returned by RedX: customer refused" }] }, 32 * DAY, now),
    order({ id: 995, name: "Sabbir Hossain", phone: "01819876543", district: "Chattogram", thana: "Panchlaish", items: [i("p5", "Polo shirt", 1, 890, "L")], status: "returned", courier: "RedX", log: [{ at: now - 18 * DAY, text: "Returned by RedX: customer not reachable" }] }, 20 * DAY, now),
    order({ id: 997, name: "Sabbir Hossain", phone: "01819876543", district: "Chattogram", thana: "Panchlaish", items: [i("p6", "Attar, 6 ml", 2, 350)], status: "delivered", courier: "Steadfast" }, 12 * DAY, now),
    order({ id: 999, name: "Sabbir Hossain", phone: "01819876543", district: "Chattogram", thana: "Panchlaish", items: [i("p3", "Hijab, jersey", 1, 250, "Navy")], status: "returned", courier: "RedX", log: [{ at: now - 4 * DAY, text: "Returned by RedX: customer refused" }] }, 6 * DAY, now),
    order({ id: 992, name: "Tanvir Ahmed", phone: "01611002233", district: "Dhaka", thana: "Dhanmondi", items: [i("p5", "Polo shirt", 1, 890, "XL")], status: "delivered", courier: "Pathao" }, 28 * DAY, now),
    order({ id: 993, name: "Farzana Islam", phone: "01555667788", district: "Sylhet", thana: "Sylhet Sadar", items: [i("p2", "Cotton three-piece", 1, 1450, "Mint")], status: "delivered", courier: "Steadfast" }, 27 * DAY, now),
    order({ id: 996, name: "Sharmin Sultana", phone: "01912121212", district: "Dhaka", thana: "Gulshan", items: [i("p3", "Hijab, jersey", 3, 250, "Maroon")], status: "delivered", courier: "Pathao" }, 15 * DAY, now),
  ]
  const recent: Order[] = [
    order({ id: 1012, name: "Rahima Akter", phone: "01711223344", district: "Dhaka", thana: "Mirpur", address: "House 8, Road 3, Mirpur 10, near Mirpur 10 circle", items: [i("p2", "Cotton three-piece", 1, 1450, "Mint")], status: "confirm" }, 12 * MIN, now),
    order({ id: 1011, name: "Sabbir Hossain", phone: "01819876543", district: "Chattogram", thana: "Panchlaish", address: "Flat 4B, Rose View, O.R. Nizam Road", items: [i("p1", "Cotton Panjabi", 2, 1200, "L / Maroon")], status: "confirm", noAnswer: 1, log: [{ at: now - 35 * MIN, text: "Call attempt 1: no answer (by Tajul)" }, { at: now - 40 * MIN, text: "Order placed from storefront" }] }, 40 * MIN, now),
    order({ id: 1010, name: "Nusrat Jahan", phone: "01922334455", district: "Gazipur", thana: "Tongi", address: "Cherag Ali, beside Tongi Pharmacy", items: [i("p4", "Kids kurti", 1, 650, "6Y"), i("p3", "Hijab, jersey", 2, 250, "Black")], status: "confirm", pay: "bKash paid" }, 1 * HOUR, now),
    order({ id: 1009, name: "Tanvir Ahmed", phone: "01611002233", district: "Dhaka", thana: "Dhanmondi", address: "House 21, Road 9/A, Dhanmondi", items: [i("p5", "Polo shirt", 1, 890, "XL")], status: "ship" }, 3 * HOUR, now),
    order({ id: 1008, name: "Farzana Islam", phone: "01555667788", district: "Sylhet", thana: "Sylhet Sadar", address: "Zindabazar, opposite Al-Hamra Shopping City", items: [i("p2", "Cotton three-piece", 1, 1450, "Peach")], status: "ship" }, 5 * HOUR, now),
    order({ id: 1007, name: "Mehedi Hasan", phone: "01788990011", district: "Dhaka", thana: "Uttara", address: "Sector 7, Road 18, House 5", items: [i("p1", "Cotton Panjabi", 1, 1200, "M / White")], status: "transit", courier: "Steadfast", consignment: "SF-2284731" }, 1 * DAY, now),
    order({ id: 1006, name: "Sharmin Sultana", phone: "01912121212", district: "Dhaka", thana: "Gulshan", address: "Road 45, House 12, Gulshan 2", items: [i("p3", "Hijab, jersey", 3, 250, "Maroon")], status: "delivered", courier: "Pathao", consignment: "PT-99120" }, 2 * DAY, now),
    order({ id: 1005, name: "Arif Chowdhury", phone: "01313131313", district: "Chattogram", thana: "Kotwali", address: "Anderkilla, near Shahi Jame Masjid", items: [i("p1", "Cotton Panjabi", 1, 1200, "XL / Maroon")], status: "returned", courier: "RedX", consignment: "RX-55102", log: [{ at: now - 2 * DAY, text: "Returned by RedX: customer refused" }] }, 3 * DAY, now),
  ]
  return [...recent, ...past, ...fillerOrders(now)]
}

// Steady background orders over the last 60 days from one-time buyers, so trends and charts look realistic.
function fillerOrders(now: number): Order[] {
  const names = ["Ayesha Siddika", "Rakib Hasan", "Mithila Rahman", "Fahim Khan", "Jannatul Ferdous", "Imran Hossain", "Sadia Afrin", "Nayeem Islam", "Tasnim Ahmed", "Rifat Chowdhury", "Lamia Akter", "Shakil Mahmud"]
  const districts = ["Dhaka", "Dhaka", "Dhaka", "Gazipur", "Narayanganj", "Chattogram", "Sylhet", "Rajshahi", "Khulna", "Cumilla"]
  const items: [string, string, number, string?][] = [["p1", "Cotton Panjabi", 1200, "M / White"], ["p2", "Cotton three-piece", 1450, "Peach"], ["p3", "Hijab, jersey", 250, "Black"], ["p5", "Polo shirt", 890, "L"], ["p6", "Attar, 6 ml", 350], ["p4", "Kids kurti", 650, "8Y"]]
  const out: Order[] = []
  let id = 900
  for (let day = 2; day <= 58; day++) {
    const perDay = (day % 7 === 3 ? 2 : 1) + (day < 30 ? (day % 3 === 0 ? 1 : 0) : 0) - (day % 5 === 0 ? 1 : 0)
    for (let k = 0; k < perDay; k++) {
      const n = (day * 7 + k * 3) % names.length
      const [pid, title, price, variant] = items[(day + k) % items.length]
      const returned = (day + k) % 7 === 0
      const district = districts[(day + k * 2) % districts.length]
      const at = now - day * DAY - k * 3 * HOUR
      out.push(order({
        id: id--, name: names[n], phone: `0171${String(5000000 + day * 10 + k).padStart(7, "0")}`, district,
        items: [{ productId: pid, title, variant, qty: 1, price }], status: returned ? "returned" : "delivered", courier: (["Pathao", "Steadfast", "RedX"] as const)[(day + k) % 3],
        log: [{ at: at + 2 * DAY, text: returned ? "Returned: customer refused" : "Delivered" }, { at, text: "Order placed from storefront" }],
      }, day * DAY + k * 3 * HOUR, now))
    }
  }
  return out
}

export function sampleState(now = Date.now()): AppState {
  return {
    version: 3,
    account: { name: "Tajul", phone: "01700000000", email: "" },
    store: {
      name: "Tajul 1", handle: "tajul-1", phone: "01700000000", whatsapp: "01700000000", facebook: "facebook.com/tajul1",
      address: "Mirpur 10, Dhaka", returnPolicy: "Exchange within 3 days if the size does not fit. Delivery charge is not refunded.",
    },
    products: PRODUCTS,
    collections: COLLECTIONS,
    orders: seedOrders(now),
    zones: [
      { id: "z1", name: "Inside Dhaka", districts: "dhaka", fee: 80, eta: "1 to 2 days" },
      { id: "z2", name: "Outside Dhaka", districts: "rest", fee: 150, eta: "2 to 4 days" },
    ],
    freeDeliveryOver: null,
    payments: { cod: true, advanceDelivery: false, bkash: { enabled: false, number: "", type: "personal" }, nagad: { enabled: false, number: "", type: "personal" } },
    theme: { ...DEFAULT_THEME, heroTitle: "Eid collection is here", heroSubtitle: "Cotton panjabi and three-piece. Cash on delivery all over Bangladesh.", edited: true, announcement: "Free exchange within 3 days" },
    team: [{ id: "m1", name: "Tajul", contact: "01700000000", role: "Owner" }],
    domain: null,
    aiConnected: [],
    shared: true,
    cart: [],
    customerNotes: {},
  }
}

export function emptyState(account: AppState["account"], storeName: string, handle: string): AppState {
  return {
    version: 3,
    account,
    store: { name: storeName, handle, phone: account?.phone ?? "", whatsapp: "", facebook: "", address: "", returnPolicy: "" },
    products: [],
    collections: [],
    orders: [],
    zones: [],
    freeDeliveryOver: null,
    payments: { cod: true, advanceDelivery: false, bkash: { enabled: false, number: "", type: "personal" }, nagad: { enabled: false, number: "", type: "personal" } },
    theme: { ...DEFAULT_THEME },
    team: [{ id: "m1", name: account?.name ?? "Owner", contact: account?.phone || account?.email || "", role: "Owner" }],
    domain: null,
    aiConnected: [],
    shared: false,
    cart: [],
    customerNotes: {},
  }
}
