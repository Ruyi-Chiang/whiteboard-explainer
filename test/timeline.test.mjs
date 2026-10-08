import assert from "node:assert/strict"
import test from "node:test"
import { compileTimeline, getBoardStateAt } from "../board/timeline.js"

const lesson = {
  sources: [{ id: "s", title: "Section" }],
  beats: [
    {
      id: "b",
      sourceIds: ["s"],
      caption: "Section",
      narration: "Hello",
      cues: [
        { id: "t", action: "text", elementId: "word", start: 0, end: 0.2, x: 10, y: 10, text: "Hello", size: 20, width: 100 },
        { id: "k", action: "text", elementId: "keep", start: 0.3, end: 0.4, x: 10, y: 40, text: "Keep", size: 20, width: 100 },
        { id: "d", action: "delete", targetId: "word", start: 0.5, end: 0.7 },
        { id: "c", action: "clear", start: 0.8, end: 0.9 },
        { id: "n", action: "text", elementId: "next", start: 0.92, end: 1, x: 20, y: 20, text: "Next", size: 20, width: 100 },
      ],
    },
  ],
}

function compiled() {
  return compileTimeline(lesson, { b: 1000 }, 0)
}

test("seeking backward restores a deleted element", () => {
  const timeline = compiled()
  const before = getBoardStateAt(timeline, 400)
  const after = getBoardStateAt(timeline, 750)
  const back = getBoardStateAt(timeline, 400)
  assert.ok(before.elements.some((element) => element.id === "word"))
  assert.equal(after.elements.some((element) => element.id === "word"), false)
  assert.ok(after.elements.some((element) => element.id === "keep"))
  assert.deepEqual(back, before)
})

test("the same timestamp paints the same state twice", () => {
  const timeline = compiled()
  assert.deepEqual(getBoardStateAt(timeline, 100), getBoardStateAt(timeline, 100))
})

test("a clear removes earlier elements and keeps a later one", () => {
  const timeline = compiled()
  const during = getBoardStateAt(timeline, 850)
  const cleared = getBoardStateAt(timeline, 910)
  const after = getBoardStateAt(timeline, 1000)
  assert.ok(during.elements.some((element) => element.id === "keep"))
  assert.equal(cleared.elements.some((element) => element.id === "keep"), false)
  assert.deepEqual(after.elements.map((element) => element.id), ["next"])
})

test("cue boundaries land on empty and complete", () => {
  const timeline = compiled()
  const start = getBoardStateAt(timeline, 0)
  const done = getBoardStateAt(timeline, 200)
  assert.equal(start.elements[0].progress, 0)
  assert.equal(done.elements[0].progress, 1)
})

test("a delete of an unknown element fails validation", () => {
  const broken = structuredClone(lesson)
  broken.beats[0].cues.push({ id: "bad", action: "delete", targetId: "missing", start: 0.1, end: 0.2 })
  assert.throws(() => compileTimeline(broken, { b: 1000 }, 0), /missing/)
})
