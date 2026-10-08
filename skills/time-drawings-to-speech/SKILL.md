---
name: time-drawings-to-speech
description: >-
  Binds whiteboard marks and camera moves to spoken phrases in board/lesson.js.
  Use when drawings should appear with the words that explain them, when a
  cue misses a phrase, or when the camera should zoom into a branch and return.
---

# Time drawings to the spoken phrase

Edit cues in `board/lesson.js`. Leave the narration wording and the export command alone.

## Phrase windows

Build every mark with `windowFor(narration, phrase)`. It takes the first case-insensitive index and throws when the phrase is missing. Pick a phrase that occurs once inside that beat, because a repeat binds the earlier hit. A hand-written cue keeps `start` and `end` inside 0 to 1. `validateLesson` rejects an end past 1.

## What appears with which words

A label, ring, or link starts at the phrase that introduces that word. A visit camera starts at the phrase for that branch and frames the parent plus the children already placed for it. The parent gets no extra ring on that visit. Child rings stay. A later phrase returns the camera to the full map at scale 1.

## Check

Run `npm test` in this package. Stop when the narration strings are unchanged. Speech files stay as they are.
