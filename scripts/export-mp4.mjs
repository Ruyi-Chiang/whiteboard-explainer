import { spawn } from "node:child_process"
import path from "node:path"
import { createRequire } from "node:module"
import puppeteer from "puppeteer-core"
import { resolveLayout } from "../layout.mjs"

const require = createRequire(import.meta.url)
const ffmpeg = require("ffmpeg-static")
const layout = resolveLayout()
const fps = 24
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
const requested = process.argv[2] || "white"
if (requested !== "white" && requested !== "dark") throw new Error("Theme must be white or dark.")
const theme = requested

const server = spawn(process.execPath, [path.join(layout.engineRoot, "scripts", "serve.mjs")], {
  cwd: layout.projectRoot,
  env: { ...process.env, PORT: "4173" },
  stdio: "inherit",
})
await new Promise((resolve) => setTimeout(resolve, 400))

const compiled = await fetch("http://127.0.0.1:4173/out/compiled.json").then((response) => response.json())
const frames = Math.round((compiled.totalDurationMs / 1000) * fps)
const output = path.join(layout.outDir, theme === "dark" ? "motivation-whiteboard-dark.mp4" : "motivation-whiteboard.mp4")

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ["--hide-scrollbars"],
})
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 })
await page.goto(`http://127.0.0.1:4173/board/index.html?export=1&theme=${theme}`, { waitUntil: "networkidle0" })
await page.waitForFunction(() => typeof window.renderAt === "function")
await page.evaluate(() => document.fonts.ready)

const encoder = spawn(ffmpeg, [
  "-y",
  "-f", "image2pipe",
  "-framerate", String(fps),
  "-vcodec", "mjpeg",
  "-i", "pipe:0",
  "-i", path.join(layout.outDir, "narration.m4a"),
  "-c:v", "libx264",
  "-pix_fmt", "yuv420p",
  "-r", String(fps),
  "-c:a", "aac",
  "-b:a", "160k",
  "-shortest",
  output,
], { stdio: ["pipe", "inherit", "inherit"] })

for (let frame = 0; frame < frames; frame += 1) {
  const timeMs = (frame / fps) * 1000
  await page.evaluate((time) => window.renderAt(time), timeMs)
  const jpeg = await page.screenshot({ type: "jpeg", quality: 85, clip: { x: 0, y: 0, width: 1280, height: 720 } })
  if (!encoder.stdin.write(jpeg)) {
    await new Promise((resolve) => encoder.stdin.once("drain", resolve))
  }
  if (frame % 48 === 0) console.log(`frame ${frame}/${frames} at ${Math.round(timeMs)}ms`)
}
encoder.stdin.end()
const code = await new Promise((resolve) => encoder.on("exit", resolve))
await browser.close()
server.kill()
if (code !== 0) throw new Error(`ffmpeg exited ${code}`)
console.log(output)
