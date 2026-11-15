// Turns the single-file Vite build into an Artifact page fragment (no doctype/html/head/body).
import fs from "fs"
const html = fs.readFileSync("dist-artifact/index.html", "utf8")
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1]
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1]
const keep = head.replace(/<meta[^>]*>/g, "").replace(/<title>[\s\S]*?<\/title>/, "").replace(/<link rel="icon"[^>]*>/g, "")
const out = `<title>Ghuri Commerce Redesign</title>\n${keep.trim()}\n${body.trim()}\n`
fs.writeFileSync("dist-artifact/ghuri-commerce-redesign.html", out)
console.log("bytes", out.length)
