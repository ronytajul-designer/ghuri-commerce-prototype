// Order helpers shared by components. Data lives in the app store (src/store).
export type { Courier, Order, OrderStatus } from "@/store/types"
export { codDue, orderTotal as total, riskOf, subtotal, taka } from "@/store/store"
export { isValidBdPhone } from "@/lib/bd"
import type { OrderStatus } from "@/store/types"

export const STAGES: OrderStatus[] = ["confirm", "ship", "transit", "delivered", "returned", "cancelled"]
