import { createServer } from "node:http"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { resolveLayout } from "../layout.mjs"

const layout = resolveLayout()
const port = Number(process.env.PORT || 4173)
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".m4a": "audio/mp4",
  ".css": "text/css",
}

createServer(async (request, response) => {
  const file = layout.fileForUrl(request.url)
  if (!file) {
    response.writeHead(404)
    response.end()
    return
  }
  try {
    const body = await readFile(file)
    response.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" })
    response.end(body)
  } catch {
    response.writeHead(404)
    response.end()
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`http://127.0.0.1:${port}`)
})
