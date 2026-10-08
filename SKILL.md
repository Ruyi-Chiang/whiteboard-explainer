---
name: whiteboard-explainer
description: >-
  Sequences a whiteboard explainer from script, to phrase timing, to MP4.
  Use when the user asks for the full pass, a new lesson video, or to run
  the whiteboard skills in order. Copy this folder into an agent skills
  directory. The lesson project is a separate directory.
disable-model-invocation: true
---

# Whiteboard explainer

This folder is the package. It holds the renderer, the scripts, and the step skills. The lesson project is the current working directory. It holds `board/lesson.js`, `.env`, and `out/`.

If `board/lesson.js` is missing, stop. Ask for a lesson project. Do not invent one inside this folder.

Copy `.env.example` to the project's `.env` when speech is needed. Read `ELEVENLABS_API_KEY` from the environment or from that project file. Do not print the key. Do not put a key in this folder.

Read `preferences.md` in this folder for the default delivery order. Fetch a Notion page only when the user names one.

Read each skill and follow it. Paths below are relative to this file. Stop after a skill when the user asked for only that step.

1. `skills/rewrite-learning-script/SKILL.md`
2. `skills/time-drawings-to-speech/SKILL.md`
3. `skills/export-whiteboard-mp4/SKILL.md`

This repository is the package. Run `npm install` here once. Run `npm test` here. From the lesson project, run `node` on `scripts/build-audio.mjs`, `scripts/export-mp4.mjs`, `scripts/serve.mjs`, and `scripts/export-script.mjs` in this folder.
