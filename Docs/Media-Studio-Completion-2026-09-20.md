# Media Studio completion status — 20 September 2026

## Implemented in this pass

- The configured Neon database now has `media_episodes` and `media_render_jobs`, plus `channel_posts` and `proof_checks` on episodes. The migration scripts are additive and can be rerun.
- Approved episodes can export a ZIP render kit from the planner. It contains the saved scene plan and media that the signed-in owner can fetch at export time. The browser limits kits to 150 MB.
- Scenes can be reordered and styled independently. Each has a cut or fade-in entrance, a full-frame or framed media layout, and a deep green, lime, paper, or generated-image background. These choices travel in the render kit and are applied by Remotion. Framing a recorded clip reveals a new backdrop around it; it does not remove the clip's recorded background.
- `platform/scripts/render-media-episode.mjs` validates the kit, stages media temporarily in the existing Remotion project, renders `media-episode` to H.264 MP4, then removes staged files and restores the previous manifest. Run from `platform`:

  `node scripts/render-media-episode.mjs C:\path\to\aksen-render-EPISODE_ID.zip C:\path\to\episode.mp4`

- The MP4 contains each selected scene with burned-in narration text. Audio plays from scene video clips when present. A still-image scene has no spoken audio yet; add voiceover recording or a licensed TTS pipeline before treating it as a finished speaking-avatar episode.
- An isolated one-second image scene was rendered to a nonempty MP4 with `node tests/render-media-episode.mjs`. This verifies the local render command and Remotion composition, not a full episode or production worker.

## Still required for an automated production path

1. Bind durable object storage (R2 or equivalent) and copy generated provider videos there promptly. Current hosting configuration has `r2: null`; provider media may expire. The downloaded render kit and MP4 should be backed up.
2. Add authenticated MP4 upload and a durable render worker/service. Remotion cannot run as a normal Cloudflare request handler. The current render command runs on a local machine.
3. Obtain platform developer credentials and required access, then implement OAuth token storage, refresh, per-platform media upload, publish receipts, retries, idempotency, and disconnect. No LinkedIn, Instagram, TikTok, or YouTube credentials are configured locally, so the UI must never claim accounts are connected or posts have been published.
4. Add your consented presenter footage or avatar output, and approved narration/voice audio. The current first episode has scene directions but no presenter source media.
5. Configure `YOUTUBE_API_KEY` for public YouTube metadata lookups. Configure `TYPESAFE_API_KEY` only if the optional Jev shadow suggestion is desired. Manual reference title/notes and the main OpenRouter idea pipeline remain available without these keys.
6. Test the full signed-in production flow after storage, render service, platform apps, and media are present. Local build/typecheck and an isolated render smoke test are narrower than this.

Publishing should remain a separate explicit approval per post. Episode approval approves the creative; it does not authorize social posting.
