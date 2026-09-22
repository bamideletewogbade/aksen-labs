# Media Studio voice render path

## What works locally

An approved, saved episode can export a ZIP render kit with a full-episode WAV or MP3 voiceover. The browser checks that the recording is within one second of the planned scene total and that every video clip is long enough for its scene. An explicitly silent draft remains available. Video clip audio is muted so the recording is the single narration source.

From `platform`, run `node scripts/render-media-episode.mjs <kit.zip> [output.mp4]`. The local renderer repeats audio and clip timing checks with ffprobe, validates kit paths and sizes, renders the MP4 with Remotion, and writes `<output.mp4>.json` containing episode ID, planned duration, voiceover flag, file size, and SHA-256. It takes a local lock so two renders cannot overwrite the shared Remotion manifest. The render kit and MP4 should be retained by the owner.

The voice file is selected at export time and is not persisted in the episode database. The one-second allowance only checks total runtime; caption lines are still scene-level text, not word-timed subtitles. A recording should follow the scene plan's order, with scene boundaries checked by watching the rendered MP4.

## Verification and remaining stages

The two-scene local fixture rendered an MP4 with changed backgrounds and a WAV voiceover; ffprobe found its audio stream. TypeScript checks passed for platform and video, and targeted planner lint passed. This verifies a fixture, not a signed-in production episode.

Durable object storage and a hosted render worker are still prerequisites for in-app MP4 delivery. The current hosting binding has no R2 bucket. Social OAuth credentials, platform permissions, final review, and delivery receipts are still required before publishing. The next vertical slice should be one authenticated episode through approved kit, render, human playback review, then one connected channel. Keep Jev on typed creative or quality suggestions until measured against actual episode outcomes; it should not silently override review or publish decisions.
