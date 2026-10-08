import { spawn } from "node:child_process"
import { mkdir, writeFile, readFile, access } from "node:fs/promises"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { createRequire } from "node:module"
import { compileTimeline } from "../board/timeline.js"
import { resolveLayout } from "../layout.mjs"

const require = createRequire(import.meta.url)
const ffmpeg = require("ffmpeg-static")
const layout = resolveLayout()
const audioDir = path.join(layout.outDir, "audio")
const gapMs = 280

let lesson
try {
  ;({ lesson } = await import(pathToFileURL(layout.lessonFile).href))
} catch (error) {
  throw new Error(`Add board/lesson.js to the lesson project (${layout.projectRoot}).`, { cause: error })
}

await loadEnv(layout.envFile)
const voiceId = process.env.ELEVENLABS_VOICE_ID || "Xb7hH8MSUJpSbSDYk0k2"
const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2"
const apiKey = process.env.ELEVENLABS_API_KEY
if (!apiKey) throw new Error("Add ELEVENLABS_API_KEY to .env before generating speech.")

await mkdir(audioDir, { recursive: true })

const durations = {}
const wavs = []
for (const beat of lesson.beats) {
  const mp3 = path.join(audioDir, `${beat.id}.mp3`)
  const wav = path.join(audioDir, `${beat.id}.wav`)
  const stamp = path.join(audioDir, `${beat.id}.txt`)
  const cached = await readFile(stamp, "utf8").catch(() => "")
  const hasAudio = await access(mp3).then(() => true).catch(() => false)
  if (cached === beat.narration && hasAudio) console.log(`${beat.id} cached`)
  else {
    await writeSpeech(apiKey, beat.narration, mp3)
    await writeFile(stamp, beat.narration)
  }
  await run(ffmpeg, ["-y", "-i", mp3, "-ar", "44100", "-ac", "1", wav])
  durations[beat.id] = await mediaDurationMs(wav)
  wavs.push(wav)
  console.log(`${beat.id} ${durations[beat.id]}ms`)
}

const gap = path.join(audioDir, "gap.wav")
await run(ffmpeg, ["-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", "0.280", gap])
const listPath = path.join(audioDir, "list.txt")
const list = []
for (let index = 0; index < wavs.length; index += 1) {
  list.push(`file '${wavs[index]}'`)
  if (index < wavs.length - 1) list.push(`file '${gap}'`)
}
await writeFile(listPath, list.join("\n"))
const narration = path.join(layout.outDir, "narration.m4a")
await run(ffmpeg, ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c:a", "aac", "-b:a", "128k", narration])

const compiled = compileTimeline(lesson, durations, gapMs)
compiled.audioDurationMs = await mediaDurationMs(narration)
compiled.voice = "elevenlabs"
await writeFile(path.join(layout.outDir, "compiled.json"), JSON.stringify(compiled, null, 2))
console.log(`timeline ${compiled.totalDurationMs}ms audio ${compiled.audioDurationMs}ms`)

async function loadEnv(file) {
  let raw = ""
  try {
    raw = await readFile(file, "utf8")
  } catch {
    return
  }
  for (const line of raw.split("\n")) {
    const match = line.match(/^([A-Za-z0-9_]+)=(.*)$/)
    if (!match || process.env[match[1]]) continue
    process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "")
  }
}

async function writeSpeech(key, text, file) {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: {
      "xi-api-key": key,
      "content-type": "application/json",
      accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: { stability: 0.35, similarity_boost: 0.8, style: 0.2, use_speaker_boost: true },
    }),
  })
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`ElevenLabs ${response.status}: ${detail.slice(0, 300)}`)
  }
  await writeFile(file, Buffer.from(await response.arrayBuffer()))
}

function mediaDurationMs(file) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpeg, ["-i", file, "-f", "null", "-"], { stdio: ["ignore", "ignore", "pipe"] })
    let stderr = ""
    child.stderr.on("data", (chunk) => {
      stderr += chunk
    })
    child.on("exit", (code) => {
      const match = stderr.match(/Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/)
      if (!match) {
        reject(new Error(`no duration for ${file} (exit ${code})`))
        return
      }
      const ms = (Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3])) * 1000
      resolve(Math.round(ms))
    })
  })
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" })
    child.on("exit", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} exited ${code}`))
    })
  })
}
