// Sample courier settlement figures for Home. The courier integration does not exist yet, so this stays sample data.

export const COURIER_CASH = [
  { courier: "Pathao", amount: 18200, parcels: 13, settles: "Tue, Nov 17" },
  { courier: "Steadfast", amount: 14600, parcels: 10, settles: "Wed, Nov 18" },
  { courier: "RedX", amount: 5600, parcels: 4, settles: "Thu, Nov 19" },
]

export const pctChange = (now: number, prev: number) => Math.round(((now - prev) / prev) * 100)
