# a personalized TL;DR video to digest information

What if a source you keep rereading became a short video in the order you want?

I built this skill for that. [Andrej Karpathy](https://x.com/karpathy/status/2105819303471976479) named the format I wanted:

> Explainer videos. The output format I am most bullish on is fully custom / bespoke explainer videos generated on any arbitrary topic. Experiment with things like "Create a 3b1b style video explainer on X. Use my ElevenLabs API key for audio narration". This is actually starting to work!

An agent reads a source, speaks a short version in the order I want, draws it on a whiteboard, and exports an MP4 I can replay.

Install the skill in an agent, then ask that agent to export a lesson video. Watch the finished example first.

## Watch the example

The source is Scott H. Young's *The Complete Guide to Motivation*. GPT-5.6 Sol wrote the narration. ElevenLabs is the voice. The file in this repo is [examples/motivation-five-forces-whiteboard.mp4](examples/motivation-five-forces-whiteboard.mp4).

I needed this skill for this book. The book opens with a long history of schools of thought about motivation. I picked it up to answer a different question. I procrastinated for four days. This video explains the book in the order I prefer. I then read the chapter that helps me most. The board draws five ideas from Young's closing section. Those ideas are Rewards, Framing, Loops, Competition, and Hidden forces.

https://github.com/user-attachments/assets/abcc35f8-48b8-4705-93ab-2031e00c09be

You should see a white board, handwritten labels, and speech. The file is about 6 MB.

## Install with a prompt

Open Cursor, Claude Code, or Codex. Paste this prompt.

```text
Install the whiteboard-explainer skill. Clone https://github.com/Ruyi-Chiang/whiteboard-explainer into the skills directory for this agent and run npm install inside it. Do not put an API key in that folder.
```

You should see a `whiteboard-explainer` folder with `SKILL.md` in it, and npm should finish without an error. Pick the path for your agent.

1. Cursor, every project: `~/.cursor/skills/whiteboard-explainer`
2. Cursor, one project: `.cursor/skills/whiteboard-explainer`
3. Claude Code: `~/.claude/skills/whiteboard-explainer`
4. Codex: `~/.codex/skills/whiteboard-explainer`

For more than one agent, clone it once to `~/.agents/skills/whiteboard-explainer` and symlink that folder into each path above.

Speech and export need Google Chrome at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`.

ChatGPT in the browser cannot load those local folders. Attach this repository, then paste the quoted prompt under "Ask the agent to make the video."

## Add a speech key and a lesson

The lesson project is a separate directory. It holds `board/lesson.js`, `.env`, and `out/`. Create that directory, then copy `.env.example` from this skill to the project's `.env` and set `ELEVENLABS_API_KEY`. Keep the key out of the skill folder, and do not print the key.

`preferences.md` in this skill is the default order. Replace that file, or give the agent your own note, when you want a different order.

## Ask the agent to make the video

Open the lesson project in the agent. Paste this prompt.

> "/whiteboard-explainer for [an attached file or a website URL] to [serve a learning goal, for example: give me an overview, answer why it's hard to stay motivated when a feedback loop is long.]"

Put an attached file, or a page URL, in the first brackets. Put the question you want the video to answer in the second. The motivation example used a question like the one in that prompt.

The agent should edit `board/lesson.js`, then write `out/<lesson.outputName>-whiteboard.mp4`. The motivation example used the name `motivation-five-forces`, so its file was `out/motivation-five-forces-whiteboard.mp4`.

The skill runs these three files in order.

1. `skills/rewrite-learning-script/SKILL.md` rewrites the narration.
2. `skills/time-drawings-to-speech/SKILL.md` times each drawing to the phrase that introduces it.
3. `skills/export-whiteboard-mp4/SKILL.md` rebuilds speech when the narration changed, then writes the MP4.

Ask for one step when you want only that step. The agent stops after it.

## Run the export yourself

From the lesson project, run `node` on the installed skill. Change the path if you cloned the skill somewhere else.

```bash
node ~/.cursor/skills/whiteboard-explainer/scripts/build-audio.mjs
node ~/.cursor/skills/whiteboard-explainer/scripts/export-mp4.mjs
```

`scripts/build-audio.mjs` requires `ELEVENLABS_API_KEY` before it looks at saved audio. When it finishes, `out/compiled.json` is newer than `board/lesson.js`.

`scripts/export-mp4.mjs` writes `out/<lesson.outputName>-whiteboard.mp4`. Set `lesson.outputName` from the topic. Add `dark` after the script path when you want the dark file. Run `scripts/serve.mjs` and open port 4173 when you want to watch the board before a long export.
