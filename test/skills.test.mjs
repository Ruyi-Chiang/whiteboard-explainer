import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const root = new URL("../", import.meta.url)
const pkg = "."

async function skill(relative, name) {
  const text = await readFile(new URL(relative, root), "utf8")
  const nameLine = text.match(/^name: (.+)$/m)
  const description = text.match(/^description: >-\n([\s\S]*?)\n---/m)
  assert.ok(nameLine, `${name} has a name`)
  assert.equal(nameLine[1], name)
  assert.ok(description && description[1].trim().length > 0, `${name} has a description`)
  return text
}

test("orchestrator points at skills inside the package", async () => {
  const text = await skill(`${pkg}/SKILL.md`, "whiteboard-explainer")
  for (const step of [
    "skills/rewrite-learning-script/SKILL.md",
    "skills/time-drawings-to-speech/SKILL.md",
    "skills/export-whiteboard-mp4/SKILL.md",
  ]) {
    assert.ok(text.includes(step), step)
  }
  assert.equal(text.includes(".cursor/skills/rewrite-learning-script"), false)
  assert.equal(text.includes("app.notion.com"), false)
  assert.ok(text.includes("preferences.md"))
  assert.equal(text.includes("windowFor"), false)
  assert.equal(text.includes("mental model"), false)
  assert.equal(text.includes("npm run"), false)
})

test("each skill keeps another skill's decision out", async () => {
  const script = await skill(`${pkg}/skills/rewrite-learning-script/SKILL.md`, "rewrite-learning-script")
  const timing = await skill(`${pkg}/skills/time-drawings-to-speech/SKILL.md`, "time-drawings-to-speech")
  const exporter = await skill(`${pkg}/skills/export-whiteboard-mp4/SKILL.md`, "export-whiteboard-mp4")
  assert.equal(script.includes("windowFor"), false)
  assert.equal(script.includes("npm run"), false)
  assert.equal(script.includes("app.notion.com"), false)
  assert.ok(script.includes("preferences.md"))
  assert.equal(timing.includes("mental model"), false)
  assert.equal(timing.includes("npm run export"), false)
  assert.equal(exporter.includes("windowFor"), false)
  assert.equal(exporter.includes("mental model"), false)
  assert.ok(exporter.includes("ELEVENLABS_API_KEY"))
})
