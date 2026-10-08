import { existsSync } from "node:fs"
import path from "node:path"

export function resolveLayout({ engineRoot, projectRoot } = {}) {
  const engine = path.resolve(engineRoot ?? import.meta.dirname)
  const project = path.resolve(projectRoot ?? process.cwd())
  return {
    engineRoot: engine,
    projectRoot: project,
    lessonFile: path.join(project, "board", "lesson.js"),
    envFile: path.join(project, ".env"),
    outDir: path.join(project, "out"),
    preferencesFile: path.join(engine, "preferences.md"),
    fileForUrl(urlPath) {
      const pathname = decodeURIComponent(new URL(urlPath, "http://127.0.0.1").pathname)
      const relative = pathname === "/" ? "/board/index.html" : pathname
      if (relative.split("/").includes("..")) return null
      if (relative === "/board/lesson.js") return contained(project, path.join(project, "board", "lesson.js"))
      if (relative.startsWith("/out/")) return contained(project, path.join(project, relative.slice(1)))
      if (relative.startsWith("/board/")) {
        return contained(engine, path.join(engine, "board", relative.slice("/board/".length)))
      }
      if (relative.startsWith("/node_modules/")) {
        const tail = relative.slice(1)
        const inProject = path.join(project, tail)
        if (existsSync(inProject)) return contained(project, inProject)
        return contained(engine, path.join(engine, tail))
      }
      return null
    },
  }
}

function contained(root, candidate) {
  const resolved = path.resolve(candidate)
  const base = path.resolve(root)
  if (resolved !== base && !resolved.startsWith(base + path.sep)) return null
  return resolved
}
