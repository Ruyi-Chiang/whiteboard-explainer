import { execSync } from "node:child_process"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { resolveLayout } from "../layout.mjs"

const layout = resolveLayout()
let lesson
try {
  ;({ lesson } = await import(pathToFileURL(layout.lessonFile).href))
} catch (error) {
  throw new Error(`Add board/lesson.js to the lesson project (${layout.projectRoot}).`, { cause: error })
}
const model = process.argv[2]
if (!model) throw new Error("Usage: npm run script -- <model-name>")

const words = (text) => text.trim().split(/\s+/).length
const now = new Date()
const commit = execSync("git rev-parse --short HEAD", { cwd: layout.projectRoot }).toString().trim()
const compiled = JSON.parse(await readFile(path.join(layout.outDir, "compiled.json"), "utf8").catch(() => "null"))
const audioFresh = compiled && lesson.beats.every((beat) => compiled.beats.some((b) => b.id === beat.id && b.narration === beat.narration))

const beats = lesson.beats.map((beat) => ({
  id: beat.id,
  caption: beat.caption,
  sources: beat.sourceIds.map((id) => lesson.sources.find((source) => source.id === id).title),
  labels: beat.cues.filter((cue) => cue.action === "text").map((cue) => cue.text.replace(/\n/g, " ")),
  words: words(beat.narration),
  narration: beat.narration,
}))

const meta = {
  model,
  generatedAt: now.toISOString(),
  commit,
  title: lesson.title,
  goal: lesson.goal,
  authorship: lesson.authorship,
  source: "Scott H. Young, The Complete Guide to Motivation",
  preferences: "preferences.md",
  totalWords: beats.reduce((sum, beat) => sum + beat.words, 0),
  beatWords: Object.fromEntries(beats.map((beat) => [beat.id, beat.words])),
  durationMs: audioFresh ? compiled.totalDurationMs : null,
}

const yaml = Object.entries(meta)
  .map(([key, value]) =>
    typeof value === "object" && value !== null
      ? `${key}:\n${Object.entries(value).map(([k, v]) => `  ${k}: ${v}`).join("\n")}`
      : `${key}: ${JSON.stringify(value)}`,
  )
  .join("\n")

const body = beats
  .map((beat) =>
    [
      `## ${beat.id}: ${beat.caption}`,
      `- Sources: ${beat.sources.join("; ")}`,
      `- Drawn labels: ${beat.labels.join(", ") || "none"}`,
      `- Words: ${beat.words}`,
      "",
      beat.narration,
    ].join("\n"),
  )
  .join("\n\n")

const stamp = now.toISOString().slice(0, 16).replace(/[:T]/g, "-")
const slug = model.toLowerCase().replace(/[^a-z0-9.]+/g, "-")
const dir = path.join(layout.projectRoot, "scripts-compare")
const file = path.join(dir, `${stamp}_${slug}.md`)
await mkdir(dir, { recursive: true })
await writeFile(file, `---\n${yaml}\n---\n\n# ${lesson.title}\n\n${body}\n`)
console.log(file)
