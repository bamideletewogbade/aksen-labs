# Media Studio creator journey and distribution review

20 September 2026. This is a product and implementation plan, not a claim that account connections or publishing are live.

## Current local state

- `/admin/studio` has an episode planner plus a separate image/video generator. The planner saves a script, scene descriptions, rough seconds and source URLs. There is no episode-to-render linkage, timeline preview, audio, caption track, final composition, or platform-ready export.
- OpenRouter visual generation is still a single prompt with image references. Video job tracking and a protected preview were added locally, but generated output has no permanent Aksen-controlled object storage.
- `/admin/social` saves public profile URLs and reusable AI context, and generates editable platform drafts. It has no OAuth connection, token store, publishing job, schedule, platform receipt, or performance collection. YouTube is not represented. A URL is not an authenticated connection.
- The Media Studio migration and the new code remain local until the intended database and deployment are verified. No live platform login or paid avatar render has been tested.

## Target creator journey

One episode is the canonical workspace object. A creator sees these stages, with a clear current stage and next action:

1. **Idea**: add a thought, link, transcript, or saved topic. The system suggests an angle and identifies what is verified, missing, or time-sensitive.
2. **Script**: draft a hook, explanation, example and close; show estimated spoken duration, reading level, citations, and the exact words the avatar would speak. Founder edits and approves the text.
3. **Storyboard**: arrange presenter, demonstration, original footage, licensed asset, image, and generated video scenes. Each scene has narration, duration, asset, source, provider and cost estimate.
4. **Produce**: submit selected scenes to a provider; show cost before submission, job status, previews, failures and retry only for failed scenes. Save completed assets into controlled storage.
5. **Edit**: timeline preview; trim, reorder, captions, music, visual safe zones, lower thirds, thumbnail, and cuts for 9:16, 16:9 or square. Keep the episode master and exports separate.
6. **Review**: check factual claims, pronunciation, face/voice fidelity, third-party rights, platform constraints and AI-generated-content disclosure. Founder approves the final asset and each channel version.
7. **Distribute**: connect accounts through official OAuth; publish now or schedule the approved version. Show queue, final platform metadata, platform acknowledgement, final post URL and failures. Stop a scheduled post if the approval is revoked or the content changes.
8. **Learn**: collect available native metrics plus tracked site visits, replies and enquiries. Record actual creation time, generation spend, acceptance rate and publication success; use those observations for the next idea.

The main UI should lead with an **episode library** and one active episode, with a stage rail and preview. A compact **Asset Lab** remains available for standalone images and clips. Social Hub becomes **Channels & Publishing**. Avoid two unrelated long forms on the same screen.

## Agentic assistance with human control

An editorial agent can monitor approved sources, cluster related topics, propose an angle, draft a script and identify claims needing a source. A production agent can turn an approved script into candidate scene directions, select a model per scene within a budget and retry a failed render. A distribution agent can adapt an approved master to each channel, validate format and scope, and prepare a proposed schedule. The owner approves the words, likeness output and channel payload before any queued auto-publishing.

Jev from TypeSafe AI is a **typed decision model**, not a video, voice or script model. A narrow pilot could score or classify: `needs_source`, `contains_unverified_business_claim`, `best_review_queue`, `needs_human_rights_check`, and `platform_fit`. Use code for fixed rules, a generative model for writing or source extraction, and Jev only for bounded decisions where its output can be evaluated against labeled examples. Run it in shadow mode first. Its probabilities do not certify a claim or grant permission to publish.

## Official connector design

Each provider adapter should implement `connect`, `refresh`, `disconnect`, `capabilities`, `validateMedia`, `preparePost`, `publish`, `checkStatus`, and `readInsights`. Store tokens encrypted on the server, scoped to a workspace and account, with expiry and revocation handling. Use OAuth state, least-needed scopes, and a visible connection status. Store an immutable approved payload hash, scheduled time, idempotency key, provider job/post ID, result URL and error record. A scheduled worker must compare the payload hash and current approval before posting. Do not store social passwords.

| Channel | Current documented route | Product implication |
| --- | --- | --- |
| LinkedIn | OAuth and `w_member_social` for member posting; organization posting has separate permissions and page-role rules. Posts API supports video. | Start with founder profile, then add Aksen company page when the permissions and role are confirmed. |
| Instagram | Official API supports publishing for professional accounts. Reels use media creation then publish; media must be reachable by Meta. Instagram Login offers `instagram_business_content_publish`. | Validate account type, media format and accessible storage. Public URL and app keys alone are insufficient. |
| TikTok | Content Posting API supports Direct Post and draft upload. `video.publish` approval is needed; an unaudited client is restricted to private posts. | Build a creator-facing export screen with the platform-required controls and an explicit final authorization. Use draft export as an initial fallback. |
| YouTube | OAuth `videos.insert` uploads video. Unverified API projects created after July 2020 are restricted to private uploads until audit. The API exposes `status.containsSyntheticMedia`. | Support private upload first, then public publishing after project verification and review of metadata/disclosure. |

All platform rules and permissions need live re-checking during implementation and app review. Publishing status must be taken from the provider, not inferred from an HTTP success alone.

## Priority order

1. Connect the episode planner to assets: canonical episode ID, scene IDs, output versions, and a real preview. Add controlled object storage, since provider URLs are temporary and Instagram needs accessible media.
2. Add captions and one export path for the first vertical episode. Test the founder's consented avatar and actual voice before expanding model choices.
3. Add review states and per-channel post payloads. Include source/rights notes and realistic-AI disclosure controls.
4. Integrate LinkedIn founder posting, then YouTube private upload. Add Instagram professional account publishing and TikTok draft/direct post once app permissions and audit status are known.
5. Add scheduled delivery, retries, receipts, and analytics only after manual publication succeeds end to end.
6. Pilot Jev against a small labeled set of editorial decisions; keep it out of the publishing authorization path.

## Business hypothesis to test

The first sellable offer is a managed **founder expertise to approved content** service: research, scripts, a consented avatar, editing, distribution and measurement. Aksen's own series tests the workflow before client promises. Later product tiers could add multiple brands, team approvals, account connections, calendars, asset libraries and reporting. Charge for reliable production and governance rather than access to a model. Do not claim ROI or time saved until measured.

Track: hours from idea to approved post; cost per approved minute; rejected render rate; posts published successfully; profile visits; tracked site visits; replies; qualified conversations; booked meetings. Views alone are not enough to establish business value.

## References checked on 20 September 2026

- [TypeSafe Jev introduction](https://docs.typesafe.ai/introduction) and [Vercel Jev model page](https://vercel.com/ai-gateway/models/jev)
- [LinkedIn API access](https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access) and [Posts API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api)
- [Meta's official Instagram API collection](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api) and [Reels publishing](https://www.postman.com/meta/workspace/instagram/documentation/23987686-9386f468-7714-490f-9bfc-9442db5c8f00)
- [TikTok Direct Post](https://developers.tiktok.com/docs/en/content-posting-api-reference-direct-post) and [TikTok AI-content labels](https://support.tiktok.com/en/using-tiktok/creating-videos/ai-generated-content)
- [YouTube video upload](https://developers.google.com/youtube/v3/docs/videos/insert), [video status fields](https://developers.google.com/youtube/v3/docs/videos), and [AI disclosure](https://support.google.com/youtube/answer/14328491)
