export type OrderStatus = "confirm" | "ship" | "transit" | "delivered" | "returned" | "cancelled"
export type Courier = "Pathao" | "Steadfast" | "RedX" | "Other"

export type Order = {
  id: number
  name: string
  phone: string
  district: string
  thana: string
  address: string
  items: { title: string; qty: number; price: number }[]
  fee: number
  pay: "COD" | "bKash paid" | "Nagad paid"
  status: OrderStatus
  age: string
  history: { orders: number; delivered: number; returned: number }
  noAnswer: number
  courier?: Courier
  consignment?: string
  cancelReason?: string
  log: { when: string; text: string }[]
}

export const STATUS: Record<OrderStatus, { label: string; tone: Tone }> = {
  confirm: { label: "To confirm", tone: "warning" },
  ship: { label: "To ship", tone: "info" },
  transit: { label: "In transit", tone: "info" },
  delivered: { label: "Delivered", tone: "success" },
  returned: { label: "Returned", tone: "destructive" },
  cancelled: { label: "Cancelled", tone: "muted" },
}
export const STAGES: OrderStatus[] = ["confirm", "ship", "transit", "delivered", "returned", "cancelled"]
export type Tone = "warning" | "info" | "success" | "destructive" | "muted"

export const taka = (n: number) => "৳" + n.toLocaleString("en-IN")
export const subtotal = (o: Order) => o.items.reduce((s, i) => s + i.qty * i.price, 0)
export const total = (o: Order) => subtotal(o) + o.fee
export const codDue = (o: Order) => (o.pay === "COD" ? total(o) : 0)
export const isValidBdPhone = (p: string) => /^01[3-9]\d{8}$/.test(p)

export type Risk = { tone: Tone; text: string; high: boolean } | null
export function riskOf(o: Order): Risk {
  const h = o.history
  if (!isValidBdPhone(o.phone)) return { tone: "destructive", text: "Invalid phone", high: true }
  if (h.orders >= 2 && h.returned / h.orders >= 0.5) return { tone: "destructive", text: `${h.returned} of ${h.orders} returned`, high: true }
  if (h.orders === 1 && h.delivered === 0) return { tone: "muted", text: "New customer", high: false }
  if (h.delivered >= 2) return { tone: "success", text: `${h.delivered} delivered before`, high: false }
  return null
}

// Sample data for the prototype. Not real customers.
export const SAMPLE_ORDERS: Order[] = [
  { id: 1012, name: "Rahima Akter", phone: "01711223344", district: "Dhaka", thana: "Mirpur", address: "House 8, Road 3, Mirpur 10, near Mirpur 10 circle", items: [{ title: "Cotton three-piece, M", qty: 1, price: 1450 }], fee: 80, pay: "COD", status: "confirm", age: "12 min ago", history: { orders: 3, delivered: 3, returned: 0 }, noAnswer: 0, log: [{ when: "12 min ago", text: "Order placed from storefront" }] },
  { id: 1011, name: "Sabbir Hossain", phone: "01819876543", district: "Chattogram", thana: "Panchlaish", address: "Flat 4B, Rose View, O.R. Nizam Road", items: [{ title: "Panjabi, L", qty: 2, price: 1200 }], fee: 150, pay: "COD", status: "confirm", age: "40 min ago", history: { orders: 4, delivered: 1, returned: 3 }, noAnswer: 1, log: [{ when: "35 min ago", text: "Call attempt 1: no answer (by Tajul)" }, { when: "40 min ago", text: "Order placed from storefront" }] },
  { id: 1010, name: "Nusrat Jahan", phone: "01922334455", district: "Gazipur", thana: "Tongi", address: "Cherag Ali, beside Tongi Pharmacy", items: [{ title: "Kids kurti, 6Y", qty: 1, price: 650 }, { title: "Hijab, black", qty: 2, price: 250 }], fee: 150, pay: "bKash paid", status: "confirm", age: "1 hr ago", history: { orders: 1, delivered: 0, returned: 0 }, noAnswer: 0, log: [{ when: "1 hr ago", text: "bKash payment received" }, { when: "1 hr ago", text: "Order placed from storefront" }] },
  { id: 1009, name: "Tanvir Ahmed", phone: "01611002233", district: "Dhaka", thana: "Dhanmondi", address: "House 21, Road 9/A, Dhanmondi", items: [{ title: "Polo shirt, XL", qty: 1, price: 890 }], fee: 80, pay: "COD", status: "ship", age: "3 hr ago", history: { orders: 2, delivered: 2, returned: 0 }, noAnswer: 0, log: [{ when: "2 hr ago", text: "Confirmed by phone (by Tajul)" }, { when: "3 hr ago", text: "Order placed from storefront" }] },
  { id: 1008, name: "Farzana Islam", phone: "01555667788", district: "Sylhet", thana: "Sylhet Sadar", address: "Zindabazar, opposite Al-Hamra Shopping City", items: [{ title: "Cotton three-piece, L", qty: 1, price: 1450 }], fee: 150, pay: "COD", status: "ship", age: "5 hr ago", history: { orders: 5, delivered: 5, returned: 0 }, noAnswer: 0, log: [{ when: "4 hr ago", text: "Confirmed by phone (by Tajul)" }, { when: "5 hr ago", text: "Order placed from storefront" }] },
  { id: 1007, name: "Mehedi Hasan", phone: "01788990011", district: "Dhaka", thana: "Uttara", address: "Sector 7, Road 18, House 5", items: [{ title: "Panjabi, M", qty: 1, price: 1200 }], fee: 80, pay: "COD", status: "transit", courier: "Steadfast", consignment: "SF-2284731", age: "Yesterday", history: { orders: 1, delivered: 0, returned: 0 }, noAnswer: 0, log: [{ when: "Today 10:12", text: "Picked up by Steadfast, SF-2284731" }, { when: "Yesterday", text: "Booked with Steadfast (by Tajul)" }, { when: "Yesterday", text: "Confirmed by phone" }] },
  { id: 1006, name: "Sharmin Sultana", phone: "01912121212", district: "Dhaka", thana: "Gulshan", address: "Road 45, House 12, Gulshan 2", items: [{ title: "Hijab, maroon", qty: 3, price: 250 }], fee: 80, pay: "COD", status: "delivered", courier: "Pathao", consignment: "PT-99120", age: "2 days ago", history: { orders: 6, delivered: 6, returned: 0 }, noAnswer: 0, log: [{ when: "2 days ago", text: "Delivered, ৳830 collected by Pathao" }] },
  { id: 1005, name: "Arif Chowdhury", phone: "01313131313", district: "Chattogram", thana: "Kotwali", address: "Anderkilla, near Shahi Jame Masjid", items: [{ title: "Panjabi, XL", qty: 1, price: 1200 }], fee: 150, pay: "COD", status: "returned", courier: "RedX", consignment: "RX-55102", age: "3 days ago", history: { orders: 3, delivered: 1, returned: 2 }, noAnswer: 0, log: [{ when: "2 days ago", text: "Returned by RedX: customer refused" }] },
  { id: 1001, name: "Test Buyer", phone: "abc", district: "Dhaka", thana: "", address: "House 1, Road 2", items: [{ title: "TEST Product (checkout test)", qty: 1, price: 500 }], fee: 0, pay: "COD", status: "cancelled", age: "Nov 15", history: { orders: 1, delivered: 0, returned: 0 }, noAnswer: 0, cancelReason: "Test order", log: [{ when: "Nov 15", text: "Cancelled: Test order" }, { when: "Nov 15", text: "Order placed from storefront" }] },
]
