// Bangladesh helpers: phone numbers, districts, Bangla digits, URL slugs.

const BN: Record<string, string> = { "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4", "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9" }
export const toLatinDigits = (s: string) => s.replace(/[০-৯]/g, (c) => BN[c])

/** Normalises 01711-223344, +8801711223344, ০১৭১১২২৩৩৪৪ to 01711223344. */
export function cleanPhone(raw: string) {
  let s = toLatinDigits(raw).replace(/[\s\-()]/g, "")
  if (s.startsWith("+880")) s = "0" + s.slice(4)
  else if (s.startsWith("880")) s = "0" + s.slice(3)
  return s
}
export const isValidBdPhone = (p: string) => /^01[3-9]\d{8}$/.test(p)

export function slugify(title: string, fallbackSeed: string) {
  const latin = title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-")
  return latin || (title.trim() ? `item-${fallbackSeed}` : "")
}

// Districts with thanas for the prototype. A real build uses all 64 districts and 495 upazilas.
export const DISTRICTS: { name: string; thanas: string[] }[] = [
  { name: "Dhaka", thanas: ["Dhanmondi", "Mirpur", "Gulshan", "Uttara", "Mohammadpur", "Motijheel", "Badda", "Tejgaon"] },
  { name: "Gazipur", thanas: ["Gazipur Sadar", "Tongi", "Kaliakair", "Sreepur"] },
  { name: "Narayanganj", thanas: ["Narayanganj Sadar", "Siddhirganj", "Rupganj"] },
  { name: "Chattogram", thanas: ["Kotwali", "Panchlaish", "Double Mooring", "Halishahar"] },
  { name: "Sylhet", thanas: ["Sylhet Sadar", "Beanibazar", "Golapganj"] },
  { name: "Rajshahi", thanas: ["Boalia", "Rajpara", "Paba"] },
  { name: "Khulna", thanas: ["Khulna Sadar", "Sonadanga", "Daulatpur"] },
  { name: "Barishal", thanas: ["Barishal Sadar", "Bakerganj"] },
  { name: "Rangpur", thanas: ["Rangpur Sadar", "Mithapukur"] },
  { name: "Mymensingh", thanas: ["Mymensingh Sadar", "Trishal"] },
  { name: "Cumilla", thanas: ["Cumilla Sadar", "Laksam", "Chandina"] },
  { name: "Bogura", thanas: ["Bogura Sadar", "Sherpur"] },
]
export const thanasOf = (district: string) => DISTRICTS.find((d) => d.name === district)?.thanas ?? []
