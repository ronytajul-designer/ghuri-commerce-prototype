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

// Simple phonetic Bangla to Latin map for web addresses (শাড়ি ঘর -> shari-ghor).
const BN_CONS: Record<string, string> = {
  "ক": "k", "খ": "kh", "গ": "g", "ঘ": "gh", "ঙ": "ng", "চ": "ch", "ছ": "chh", "জ": "j", "ঝ": "jh", "ঞ": "n",
  "ট": "t", "ঠ": "th", "ড": "d", "ঢ": "dh", "ণ": "n", "ত": "t", "থ": "th", "দ": "d", "ধ": "dh", "ন": "n",
  "প": "p", "ফ": "f", "ব": "b", "ভ": "bh", "ম": "m", "য": "j", "র": "r", "ল": "l", "শ": "sh", "ষ": "sh",
  "স": "s", "হ": "h", "\u09DC": "r", "\u09DD": "rh", "\u09DF": "y", "ৎ": "t",
}
const BN_VOWEL: Record<string, string> = { "অ": "o", "আ": "a", "ই": "i", "ঈ": "i", "উ": "u", "ঊ": "u", "ঋ": "ri", "এ": "e", "ঐ": "oi", "ও": "o", "ঔ": "ou" }
const BN_SIGN: Record<string, string> = { "া": "a", "ি": "i", "ী": "i", "ু": "u", "ূ": "u", "ৃ": "ri", "ে": "e", "ৈ": "oi", "ো": "o", "ৌ": "ou" }
const BN_MARK: Record<string, string> = { "ং": "ng", "ঃ": "h", "ঁ": "" }

/** Transliterates Bangla letters; Latin text passes through unchanged. */
export function transliterate(text: string) {
  const chars = Array.from(toLatinDigits(text.normalize("NFC")).replace(/\u09A1\u09BC/g, "\u09DC").replace(/\u09A2\u09BC/g, "\u09DD").replace(/\u09AF\u09BC/g, "\u09DF").replace(/\u09CD\u09AF/g, ""))
  let out = ""
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i]
    if (BN_CONS[c] !== undefined) {
      out += BN_CONS[c]
      const n = chars[i + 1]
      if (n === "\u09CD") { i++; continue }
      if (n && BN_SIGN[n] !== undefined) { out += BN_SIGN[n]; i++; continue }
      const atEnd = !n || !/[\u0980-\u09FF]/.test(n) || BN_MARK[n] !== undefined && !chars[i + 2]
      if (!atEnd && c !== "ৎ") out += "o"
    } else if (BN_VOWEL[c] !== undefined) out += BN_VOWEL[c]
    else if (BN_SIGN[c] !== undefined) out += BN_SIGN[c]
    else if (BN_MARK[c] !== undefined) out += BN_MARK[c]
    else if (c === "\u09CD") continue
    else out += c
  }
  return out
}

export function slugify(title: string, fallbackSeed: string) {
  const latin = transliterate(title).toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-")
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
