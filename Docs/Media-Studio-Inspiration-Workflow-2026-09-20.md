# Media Studio: reference videos to original Aksen episodes

20 September 2026. This records the product intent and the current local implementation. It does not imply that the app has watched a YouTube video, published a post, or rendered a final MP4.

## The requests in this conversation

1. Make agent work visible: queued, working, completed, skipped, failed, and handed to the next step. Completion must describe an actual completed action.
2. Implement more of the Media Studio roadmap while keeping Jev at bounded decisions, not prose generation or publishing authorization.
3. Let the founder start from a YouTube video that sparks an idea, then combine it with the founder's own interpretation or an Aksen implementation.
4. Find commercially useful extensions to this flow, tested on Aksen's own series before selling it to clients.

## First principles

The URL is a pointer to a source and a way to play it. It is not the user's original idea, a licence to reuse footage, or proof that our system knows the full contents. A compelling episode needs a clear audience problem, the founder's own judgment, a useful example, and checked claims. The system should preserve these separately so a reviewer can see where each sentence came from.

YouTube's Data API can return public metadata with an API key. Its official caption download endpoint requires permission to edit the video. The current workflow therefore asks for the user's notes or a transcript they provide. It never silently scrapes captions or downloads someone else's footage. The embedded player remains a reference only.

## Current local workflow

1. The **Reference reader** validates the YouTube URL and reads public metadata when `YOUTUBE_API_KEY` is configured. Otherwise it uses the title supplied by the founder.
2. The **Idea mapper** uses the supplied metadata, notes, and the founder's own take to return three different original directions. Each includes a hook, business example, source connection, and a check needed before making a factual claim.
3. **Jev** optionally evaluates which direction appears to add the strongest original Aksen perspective. This runs in shadow mode. Its output never chooses for the founder, certifies a claim, or approves publishing. When `TYPESAFE_API_KEY` is absent, the stage visibly says skipped.
4. The founder chooses an angle. The **Script architect** drafts a 60–80 second script and scene plan. The result is handed to the editable episode planner as an unsaved draft, with the source URL and an open proof check attached.

The episode planner now has a proof board. A check stays open until the founder marks it verified with an HTTPS evidence URL or marks the scripted example clearly illustrative. Open checks block the review transition. Removing a check is a human edit, and the review still requires the founder's explicit action.

The agent rail shows each transition and any failure. There is no background task persistence or resume after closing the page yet. The existing episode database migration and the newer channel-copy/proof-check migration still need to be applied to the intended database and verified in the deployed environment.

Server configuration: `OPENROUTER_API_KEY` enables the two drafting agents, `YOUTUBE_API_KEY` enables official public metadata lookup, and `TYPESAFE_API_KEY` enables the optional Jev shadow signal. Keep these keys server-side. A missing YouTube key falls back to the founder's title; a missing TypeSafe key produces a visible skipped stage. Neither key was used in a live run during this implementation.

## Next product opportunities

| Opportunity | Practical first version | Value to test |
| --- | --- | --- |
| Compare two source videos | Map agreements, differences and the founder's independent judgment, with exact source notes. | Stronger point of view; less derivative content. |
| Timestamped insight cards | Founder saves a timecode, a short note, and what they would test. Link back to the video player. | Faster capture while watching. |
| Claim and proof board | Give each factual sentence a source, date checked, owner and status. Recheck time-sensitive facts before review. | Trustworthy production for Aksen and future clients. |
| Implementation challenge | Turn an idea into a small, measurable experiment for an African business; report what was actually observed later. | Bridges marketing content and Aksen's service work. |
| Series builder | Cluster repeated themes from saved references and founder notes into a sequence of episodes with distinct questions. | Consistent publishing without repetitive scripts. |
| Response loop | With approved channel access, group audience questions into candidate follow-up episodes; retain the original comment context. | Audience-led ideas and qualified conversations. |
| Content compiler | Produce a video, LinkedIn post, carousel, article and email from one approved claim set. | More output from each researched idea without fact drift. |
| Conversion path | Pair each episode with a relevant checklist, diagnostic or demo and tracked link. Measure enquiries separately from views. | A sellable outcome for client work. |

## Architecture and monetization

Keep separate objects for `reference`, `founder_note`, `angle`, `claim`, `script`, `scene`, `asset`, `rendition`, `approval`, `channel_post`, and `outcome`. Each generated output keeps the version and inputs that produced it. This allows a failed scene to be retried, a claim to be corrected across formats, and an approval to be revoked when the content changes.

The first service offer to test is a founder-expertise series: research support, scripts, consented avatar production, human approval, distribution and a learning report. Later workspaces can add teams, approvals, budgets, licences and analytics. Charge for the reliable production process and measurable learning, rather than a generic model wrapper.

## External references checked

- [YouTube videos.list](https://developers.google.com/youtube/v3/docs/videos/list)
- [YouTube captions.download](https://developers.google.com/youtube/v3/docs/captions/download)
- [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference)
- [TypeSafe Jev on Cloudflare](https://developers.cloudflare.com/ai/models/typesafe/jev/)
- [Jev thresholds and evaluation](https://vercel.com/i/jev-probabilities-and-thresholds)
