export const BOARD = { width: 1280, height: 720 }

const ACTIONS = new Set(["text", "line", "circle", "formula", "highlight", "delete", "clear", "camera"])
const DRAW = new Set(["text", "line", "circle", "formula"])

export function validateLesson(lesson) {
  const errors = []
  const sourceIds = new Set((lesson.sources || []).map((source) => source.id))
  const beatIds = new Set()
  const cueIds = new Set()
  const elementIds = new Set()
  const known = new Set()

  if (!lesson.beats?.length) errors.push("lesson has no beats")

  for (const beat of lesson.beats || []) {
    if (!beat.id || beatIds.has(beat.id)) errors.push(`duplicate beat ${beat.id}`)
    beatIds.add(beat.id)
    for (const sourceId of beat.sourceIds || []) {
      if (!sourceIds.has(sourceId)) errors.push(`${beat.id} cites missing source ${sourceId}`)
    }
    for (const cue of beat.cues || []) {
      if (!cue.id || cueIds.has(cue.id)) errors.push(`duplicate cue ${cue.id}`)
      cueIds.add(cue.id)
      if (!ACTIONS.has(cue.action)) errors.push(`${cue.id} has unknown action ${cue.action}`)
      if (!(cue.start >= 0 && cue.end <= 1 && cue.end >= cue.start)) {
        errors.push(`${cue.id} has an invalid fraction`)
      }
      if (DRAW.has(cue.action)) {
        if (!cue.elementId || elementIds.has(cue.elementId)) {
          errors.push(`duplicate element ${cue.elementId}`)
        }
        elementIds.add(cue.elementId)
        known.add(cue.elementId)
        errors.push(...geometryErrors(cue))
      }
      if (cue.action === "highlight") {
        if (!cue.elementId || elementIds.has(cue.elementId)) {
          errors.push(`duplicate element ${cue.elementId}`)
        }
        elementIds.add(cue.elementId)
        if (!known.has(cue.targetId)) errors.push(`${cue.id} highlights missing ${cue.targetId}`)
        errors.push(...boxErrors(cue))
      }
      if (cue.action === "delete" && !known.has(cue.targetId)) {
        errors.push(`${cue.id} deletes missing ${cue.targetId}`)
      }
      if (cue.action === "camera") {
        if (!(cue.scale >= 0.5 && cue.scale <= 3)) errors.push(`${cue.id} has a bad zoom`)
        errors.push(...pointErrors(cue.id, cue.cx, cue.cy))
      }
    }
  }
  return errors
}

function geometryErrors(cue) {
  if (cue.action === "text" || cue.action === "formula") {
    return pointErrors(cue.id, cue.x, cue.y)
  }
  if (cue.action === "line") {
    return [
      ...pointErrors(cue.id, cue.x1, cue.y1),
      ...pointErrors(cue.id, cue.x2, cue.y2),
    ]
  }
  if (cue.action === "circle") {
    const errors = []
    if (cue.cx - cue.r < 0 || cue.cx + cue.r > BOARD.width) errors.push(`${cue.id} circle leaves the board`)
    if (cue.cy - cue.r < 0 || cue.cy + cue.r > BOARD.height) errors.push(`${cue.id} circle leaves the board`)
    return errors
  }
  return []
}

function boxErrors(cue) {
  const errors = [...pointErrors(cue.id, cue.x, cue.y)]
  if (cue.x + cue.w > BOARD.width || cue.y + cue.h > BOARD.height) errors.push(`${cue.id} highlight leaves the board`)
  return errors
}

function pointErrors(id, x, y) {
  if (x < 0 || y < 0 || x > BOARD.width || y > BOARD.height) return [`${id} is off the board`]
  return []
}

export function compileTimeline(lesson, durationsByBeat, gapMs = 280) {
  const errors = validateLesson(lesson)
  if (errors.length) throw new Error(errors.join("\n"))
  const beats = []
  const cues = []
  let cursor = 0
  for (const beat of lesson.beats) {
    const durationMs = durationsByBeat[beat.id]
    if (!(durationMs > 0)) throw new Error(`missing duration for ${beat.id}`)
    const startMs = cursor
    const endMs = cursor + durationMs
    beats.push({
      id: beat.id,
      startMs,
      endMs,
      durationMs,
      narration: beat.narration,
      caption: beat.caption,
      sourceIds: beat.sourceIds,
    })
    for (const cue of beat.cues) {
      cues.push({
        ...cue,
        beatId: beat.id,
        startMs: startMs + cue.start * durationMs,
        endMs: startMs + cue.end * durationMs,
      })
    }
    cursor = endMs + gapMs
  }
  if (beats.length) cursor = beats[beats.length - 1].endMs
  cues.sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs)
  return {
    title: lesson.title,
    beats,
    cues,
    totalDurationMs: cursor,
    gapMs,
    width: BOARD.width,
    height: BOARD.height,
  }
}

function cueProgress(cue, timeMs) {
  if (timeMs < cue.startMs) return 0
  if (cue.endMs <= cue.startMs) return 1
  return Math.min(1, Math.max(0, (timeMs - cue.startMs) / (cue.endMs - cue.startMs)))
}

export function getBoardStateAt(compiled, timeMs) {
  const map = new Map()
  let caption = ""
  let view = { cx: 640, cy: 300, scale: 1 }
  for (const beat of compiled.beats) {
    if (timeMs >= beat.startMs) caption = beat.caption
  }
  for (const cue of compiled.cues) {
    if (timeMs < cue.startMs) break
    const progress = cueProgress(cue, timeMs)
    if (cue.action === "camera") {
      const t = ease(progress)
      view = {
        cx: view.cx + (cue.cx - view.cx) * t,
        cy: view.cy + (cue.cy - view.cy) * t,
        scale: view.scale + (cue.scale - view.scale) * t,
      }
      continue
    }
    if (cue.action === "clear") {
      if (progress >= 1) map.clear()
      else for (const element of map.values()) element.opacity *= 1 - progress
      continue
    }
    if (cue.action === "delete") {
      const element = map.get(cue.targetId)
      if (!element) continue
      if (progress >= 1) map.delete(cue.targetId)
      else element.opacity = 1 - progress
      continue
    }
    const writing = cue.action === "text" || cue.action === "formula" || cue.action === "line" || cue.action === "circle"
    map.set(cue.elementId, {
      id: cue.elementId,
      kind: cue.action,
      progress,
      opacity: cue.action === "highlight" ? progress : writing ? (progress > 0 ? 1 : 0) : Math.min(1, progress / 0.35),
      action: cue.action,
      text: cue.text,
      parts: cue.parts,
      x: cue.x,
      y: cue.y,
      w: cue.w,
      h: cue.h,
      width: cue.width,
      size: cue.size,
      weight: cue.weight,
      color: cue.color,
      align: cue.align,
      x1: cue.x1,
      y1: cue.y1,
      x2: cue.x2,
      y2: cue.y2,
      strokeWidth: cue.strokeWidth,
      arrow: cue.arrow,
      cx: cue.cx,
      cy: cue.cy,
      r: cue.r,
      targetId: cue.targetId,
    })
  }
  return {
    timeMs,
    caption,
    view,
    elements: [...map.values()],
  }
}

function ease(t) {
  return t * t * (3 - 2 * t)
}
