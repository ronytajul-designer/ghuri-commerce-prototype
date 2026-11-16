// Turns the single-file Vite build into an Artifact page fragment (no doctype/html/head/body).
// Uses the LAST </head>, <body> and </body>, because the bundled JS can contain those strings (e.g. iframe srcDoc).
import fs from "fs"
const html = fs.readFileSync("dist-artifact/index.html", "utf8")
const headStart = html.indexOf("<head>") + "<head>".length
const headEnd = html.lastIndexOf("</head>")
const bodyStart = html.indexOf(">", html.lastIndexOf("<body")) + 1
const bodyEnd = html.lastIndexOf("</body>")
const head = html.slice(headStart, headEnd)
const body = html.slice(bodyStart, bodyEnd)
const keep = head.replace(/<meta[^>]*>/g, "").replace(/<title>[\s\S]*?<\/title>/, "").replace(/<link rel="icon"[^>]*>/g, "")
const out = `<title>${process.env.ARTIFACT_TITLE || "Ghuri Commerce Redesign"}</title>\n${keep.trim()}\n${body.trim()}\n`
if (!out.includes('<div id="root"></div>')) throw new Error("root element missing from fragment")
fs.writeFileSync("dist-artifact/ghuri-commerce-redesign.html", out)
console.log("bytes", out.length)
