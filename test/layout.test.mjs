import assert from "node:assert/strict"
import path from "node:path"
import test from "node:test"
import { resolveLayout } from "../layout.mjs"

test("the lesson and the key stay in the project, and the renderer stays in the skill", () => {
  const layout = resolveLayout({ engineRoot: "/engine", projectRoot: "/project" })
  assert.equal(layout.fileForUrl("/board/lesson.js"), path.resolve("/project/board/lesson.js"))
  assert.equal(layout.fileForUrl("/board/player.js"), path.resolve("/engine/board/player.js"))
  assert.equal(layout.fileForUrl("/board/index.html"), path.resolve("/engine/board/index.html"))
  assert.equal(layout.fileForUrl("/out/compiled.json"), path.resolve("/project/out/compiled.json"))
  assert.equal(layout.fileForUrl("/"), path.resolve("/engine/board/index.html"))
  assert.equal(layout.envFile, path.resolve("/project/.env"))
  assert.equal(layout.lessonFile, path.resolve("/project/board/lesson.js"))
  assert.equal(layout.fileForUrl("/board/../../.env"), null)
  assert.equal(layout.fileForUrl("/out/../.env"), null)
})
