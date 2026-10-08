---
name: export-whiteboard-mp4
description: >-
  Rebuilds out/compiled.json when lesson timing is stale, skips cached
  ElevenLabs speech, and writes the whiteboard MP4. Use when the user asks
  to export, regenerate, or refresh the mp4.
---

# Export the mp4

Leave narration and phrase choice alone. The speech script reads `.env` from the lesson project after it starts. Do not print `ELEVENLABS_API_KEY`. Do not copy a key into the skill folder.

## When to rebuild audio

From the lesson project, run `node` on this package's `scripts/build-audio.mjs` when `board/lesson.js` is newer than `out/compiled.json`, or when any `out/audio/<beat-id>.txt` differs from that beat's narration. Matching stamps skip synthesis. The same command recompiles `out/compiled.json` with the 280 ms gap. Skip that command when the lesson file is older than `out/compiled.json` and every stamp matches.

## Render

From the lesson project, run `node` on this package's `scripts/export-mp4.mjs`. It writes `out/motivation-whiteboard.mp4`. Run `node` on `scripts/export-mp4.mjs dark` only when the user asks for the dark file. The script serves the lesson project on port 4173, opens `/board/index.html?export=1`, waits for `renderAt` and `document.fonts.ready`, and pipes frames through `ffmpeg-static`. It kills its server on a clean finish. If Chrome closes early, the server can stay up. Free port 4173, then run the export again. Leave `scripts/serve.mjs` stopped unless the user asked for a preview.

## Before a long export

When this package's `board/render.js` or `board/index.html` is newer than the project's mp4, screenshot one in-phrase frame and the last frame on the export page first. Continue the full export when those frames show the marks that the cues name.
