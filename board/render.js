import rough from "/node_modules/roughjs/bundled/rough.esm.js"

const SVG = "http://www.w3.org/2000/svg"
const FONT = "'Virgil', cursive"

export const themes = {
  white: {
    paper: "#ffffff",
    ink: "#1e1e1e",
    caption: "#1e1e1e",
    footer: "#868e96",
    nib: "#1e1e1e",
    highlight: "240,140,0",
    colors: {
      "#f7f1e4": "#1e1e1e",
      "#79c3c0": "#1971c2",
      "#f2d48a": "#f08c00",
      "#e6b15a": "#f08c00",
      "#e07a5f": "#e03131",
    },
  },
  dark: {
    paper: "#1b1e27",
    ink: "#f7f1e4",
    caption: "#d5d0c6",
    footer: "#8b93a7",
    nib: "#f2d48a",
    highlight: "242,212,138",
    colors: {
      "#f7f1e4": "#f7f1e4",
      "#79c3c0": "#79c3c0",
      "#f2d48a": "#f2d48a",
      "#e6b15a": "#f2d48a",
      "#e07a5f": "#e07a5f",
    },
  },
}

let active = themes.white

export function paint(board, state, theme = themes.white) {
  active = theme
  board.style.background = theme.paper
  board.replaceChildren()
  const view = state.view || { cx: 640, cy: 300, scale: 1 }
  const anchorY = view.scale > 1.15 ? 240 : 310
  const world = document.createElement("div")
  world.style.cssText = "position:absolute;inset:0;overflow:hidden"
  const inner = document.createElement("div")
  inner.style.cssText = `position:absolute;left:0;top:0;width:1280px;height:720px;transform-origin:0 0;transform:translate(640px, ${anchorY}px) scale(${view.scale}) translate(${-view.cx}px, ${-view.cy}px)`
  const svg = document.createElementNS(SVG, "svg")
  svg.setAttribute("width", "1280")
  svg.setAttribute("height", "720")
  svg.style.cssText = "position:absolute;inset:0"
  const layer = document.createElement("div")
  layer.style.cssText = "position:absolute;inset:0"
  const pen = rough.svg(svg)
  const order = { highlight: 0, line: 1, circle: 2, text: 3, formula: 4 }
  const elements = [...state.elements].sort((a, b) => order[a.kind] - order[b.kind])
  for (const element of elements) {
    if (element.kind === "line") drawLine(svg, pen, element)
    else if (element.kind === "circle") drawCircle(svg, pen, element)
    else if (element.kind === "highlight") drawHighlight(layer, element)
    else if (element.kind === "text") drawText(layer, element)
    else if (element.kind === "formula") drawFormula(layer, element)
  }
  const scrim = document.createElement("div")
  scrim.style.cssText = `position:absolute;left:0;right:0;bottom:0;height:108px;background:linear-gradient(transparent, ${theme.paper} 32px, ${theme.paper})`
  const caption = document.createElement("div")
  caption.textContent = state.caption || ""
  caption.style.cssText =
    `position:absolute;left:64px;right:64px;bottom:42px;font:20px 'Avenir Next', 'Segoe UI', sans-serif;color:${theme.caption}`
  const footer = document.createElement("div")
  footer.textContent =
    "Scott H. Young, The Complete Guide to Motivation. Section titles only. Not a page citation."
  footer.style.cssText =
    `position:absolute;left:64px;right:64px;bottom:16px;font:16px 'Avenir Next', 'Segoe UI', sans-serif;color:${theme.footer}`
  inner.append(svg, layer)
  world.append(inner)
  board.append(world, scrim, caption, footer)
}

function drawLine(svg, pen, element) {
  const drawable = pen.generator.line(element.x1, element.y1, element.x2, element.y2, sketchOptions(element))
  drawSketch(svg, pen, drawable, element)
}

function drawCircle(svg, pen, element) {
  const drawable = pen.generator.circle(element.cx, element.cy, element.r * 2, sketchOptions(element))
  drawSketch(svg, pen, drawable, element)
}

function sketchOptions(element) {
  const width = element.strokeWidth && element.strokeWidth <= 4 ? 1.75 : 2.25
  return {
    stroke: penColor(element.color),
    strokeWidth: width,
    roughness: 1.2,
    bowing: 1,
    seed: seedFor(element),
  }
}

function drawSketch(svg, pen, drawable, element) {
  const group = pen.draw(drawable)
  group.setAttribute("opacity", element.opacity)
  for (const path of group.querySelectorAll("path")) {
    path.setAttribute("stroke-linecap", "round")
    path.setAttribute("stroke-linejoin", "round")
    path.setAttribute("pathLength", "1")
    path.setAttribute("stroke-dasharray", "1")
    path.setAttribute("stroke-dashoffset", String(1 - element.progress))
  }
  svg.append(group)
}

function penColor(color) {
  if (!color || color === "#f7f1e4") return active.ink
  return active.colors[color] || color
}

function seedFor(element) {
  const key = String(element.id || "")
  let hash = 7
  for (let index = 0; index < key.length; index += 1) hash = (Math.imul(hash, 33) + key.charCodeAt(index)) >>> 0
  return hash % 2147483646 || 1
}

function drawHighlight(layer, element) {
  const box = document.createElement("div")
  box.style.cssText = `position:absolute;left:${element.x}px;top:${element.y}px;width:${element.w}px;height:${element.h}px;border-radius:12px;background:rgba(${active.highlight},${0.16 * element.opacity});box-shadow:inset 0 0 0 2px rgba(${active.highlight},${element.opacity});opacity:${element.opacity}`
  layer.append(box)
}

function drawText(layer, element) {
  const text = element.text || ""
  const node = document.createElement("div")
  node.style.cssText = `position:absolute;left:${element.x}px;top:${element.y}px;width:${element.width || 1080}px;font:${element.size || 36}px ${FONT};color:${penColor(element.color)};opacity:${element.opacity};line-height:1.05;white-space:pre-line;text-align:${element.align || "left"}`
  const { done, current, fraction } = splitWrite(text, element.progress)
  const doneNode = document.createElement("span")
  doneNode.textContent = done
  node.append(doneNode)
  if (current) {
    const partial = document.createElement("span")
    partial.textContent = current
    partial.style.display = "inline-block"
    partial.style.clipPath = `inset(0 ${(1 - fraction) * 100}% 0 0)`
    node.append(partial)
  }
  layer.append(node)
  drawNib(layer, element, done + (current && fraction > 0 ? current : ""))
}

function drawFormula(layer, element) {
  const full = (element.parts || []).join("  ")
  const shown = written(full, element.progress)
  const row = document.createElement("div")
  row.textContent = shown
  row.style.cssText = `position:absolute;left:${element.x}px;top:${element.y}px;width:${element.width || 1100}px;opacity:${element.opacity};font:${element.size || 40}px ${FONT};color:${penColor(element.color)};line-height:1.15`
  layer.append(row)
  drawNib(layer, element, shown)
}

function splitWrite(text, progress) {
  const position = Math.min(text.length, Math.max(0, progress * text.length))
  const doneCount = Math.floor(position)
  return {
    done: text.slice(0, doneCount),
    current: doneCount < text.length ? text[doneCount] : "",
    fraction: position - doneCount,
  }
}

function written(text, progress) {
  const { done, current, fraction } = splitWrite(text, progress)
  return done + (current && fraction > 0 ? current : "")
}

function drawNib(layer, element, shown) {
  if (!(element.progress > 0) || element.progress >= 1 || !shown) return
  const probe = document.createElement("canvas").getContext("2d")
  const size = element.size || 36
  probe.font = `${size}px Virgil, cursive`
  const lines = shown.split("\n")
  const last = lines[lines.length - 1]
  const lineWidth = probe.measureText(last).width
  const box = element.width || 1080
  const left = element.align === "center" ? element.x + Math.max(0, (box - lineWidth) / 2) : element.x
  const top = element.y + (lines.length - 1) * size * 1.05
  const nib = document.createElement("div")
  nib.style.cssText = `position:absolute;left:${left + lineWidth - 3}px;top:${top + size * 0.72}px;width:8px;height:8px;border-radius:50%;background:${active.nib};opacity:${element.opacity}`
  layer.append(nib)
}
