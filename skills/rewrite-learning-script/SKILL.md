---
name: rewrite-learning-script
description: >-
  Rewrites whiteboard narration in board/lesson.js to a learning-preferences
  arc after a census of the source's own mental models. Use when the user
  asks to rewrite the script, match learning preferences, walk through a
  book or chapter set, or change what the video says.
---

# Rewrite the learning script

Edit narration in `board/lesson.js`. Leave cue fractions, rendering, and export alone.

## Models before prose

Read the source the user named. List the models that source itself uses to organize the material, including a closing synthesis when it has one. A model is the spine only when the chapters you will mention sit under it. If a candidate does not parent those chapters, drop it and use the source's own grouping.

## Preferences

When the user does not name a different preferences source, read `../../preferences.md` and follow that file. Fetch a Notion page only when the user names one. The named page wins when it conflicts with `preferences.md`.
