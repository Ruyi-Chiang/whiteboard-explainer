import { lesson } from "./lesson.js"
import { getBoardStateAt } from "./timeline.js"
import { paint, themes } from "./render.js"

const board = document.querySelector("#board")
const audio = document.querySelector("#audio")
const params = new URLSearchParams(location.search)
const exporting = params.has("export")
let theme = params.get("theme") === "dark" ? themes.dark : themes.white
if (exporting) document.body.classList.add("export")
else audio.src = "/out/narration.m4a"

const compiled = await fetch("/out/compiled.json").then((response) => response.json())
const refs = document.querySelector("#refs")
for (const source of lesson.sources) {
  const item = document.createElement("li")
  item.textContent = source.title
  refs.append(item)
}

function renderAt(timeMs) {
  paint(board, getBoardStateAt(compiled, timeMs), theme)
}

window.renderAt = renderAt
renderAt(0)

if (!exporting) {
  audio.addEventListener("timeupdate", () => renderAt(audio.currentTime * 1000))
  audio.addEventListener("seeked", () => renderAt(audio.currentTime * 1000))
  document.querySelector("#play").addEventListener("click", () => {
    if (audio.paused) audio.play()
    else audio.pause()
  })
  document.querySelector("#replay").addEventListener("click", () => {
    audio.currentTime = 0
    renderAt(0)
    audio.play()
  })
  const themeButton = document.querySelector("#theme")
  themeButton.textContent = theme === themes.dark ? "White" : "Dark"
  themeButton.addEventListener("click", () => {
    theme = theme === themes.dark ? themes.white : themes.dark
    themeButton.textContent = theme === themes.dark ? "White" : "Dark"
    const next = new URL(location.href)
    next.searchParams.set("theme", theme === themes.dark ? "dark" : "white")
    history.replaceState(null, "", next)
    renderAt(audio.currentTime * 1000)
  })
}
