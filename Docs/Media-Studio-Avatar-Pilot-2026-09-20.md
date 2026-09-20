# Media Studio: founder avatar pilot

Prepared 20 September 2026. These are production scripts and a test plan, not evidence that an avatar or a finished episode has been generated.

## What to record

Record one continuous 2–5 minute video of yourself speaking naturally. Use a quiet room, even light, a plain stable background, and at least 1080p at 30 fps. Frame your head, shoulders, and hands; keep gestures in frame and away from your face. Look into the lens. A vertical 9:16 take suits the first social video. Wear something you would happily appear in repeatedly. Leave a few natural pauses and expressions. Do not splice takes together for the training upload.

HeyGen's Digital Twin guidance recommends at least two minutes of continuous footage, with up to five minutes for best results. It requires a separate consent recording using the exact words shown by HeyGen during setup. The text below is **training footage**, not a substitute for that consent recording.

### Training footage script

Read this in your own voice. You can paraphrase if that sounds more like you. Keep the camera running through paragraph breaks; pause naturally and vary your expression as you would in a real conversation.

> Hi, I'm the founder of Aksen Labs. I spend a lot of time thinking about how useful technology can make work easier for people and businesses. Some days that means a website that helps customers find what they need. Other days it means a better internal process, clearer information, or a practical use of AI. What interests me is the real problem underneath the tool.
>
> Let me give you an example. Imagine a small team receiving customer questions across WhatsApp, email, and a website. They may be answering the same five questions again and again, but an important question can still get missed. Before building anything, I would ask: Where do these questions come from? Which answers change often? Who should handle the unusual cases? And how will the team know whether the new process is helping?
>
> AI can be useful there, but it needs good information and a clear role. It might draft a reply, organize an inbox, or help a person find the right answer. Someone still has to decide what the system is allowed to say or do. If a tool sounds confident while using old information, that is a problem, not a benefit.
>
> Now, a completely different question: what is an AI model? You can think of it as a system trained to recognize patterns and produce an output from an input. One model might turn speech into text. Another might generate an image. A language model can respond to a question or help draft a document. They can be impressive, but they can also be wrong, so the job and the checks around the model matter.
>
> Here is a quick comparison. If I ask a model to make a short summary, I need it to preserve the meaning. If I ask it to research a current price, I need a source and a date. If I ask it to send a message to a customer, I need to know who approved the message and what happens if the answer is uncertain. Those are three different tasks, even though they might all be described as “using AI.”
>
> I want to explain ideas like this in a simple way. We can talk about models, agents, voice, video, data, websites, and the everyday choices behind them. We can test an idea, learn what works, and change course when the evidence says we should. The point is to make technology useful, understandable, and easier to control.
>
> One last thing before we finish. A useful explanation should leave you with a question you can actually ask in your own work: what takes too long, what goes wrong most often, and what information would help you make a better decision? Start there. Then choose the tool.

At a conversational pace this is roughly 3–4 minutes. Read it once as a warm-up, then record the continuous take. If you stumble, continue naturally or restart the entire take.

## First episode: What is an AI model?

Target: about 60–70 seconds at a natural speaking pace. This is the **fixed comparison script** for avatar tests; keep the words the same across providers.

> When people say “AI model,” what are they actually talking about?
>
> Think of a model as the part of an AI system that learned patterns from examples. You give it an input, and it produces an output. Give one model speech, and it may return a transcript. Give another a prompt, and it may create an image. Give a language model a question, and it produces a response.
>
> But the model is only one part of a useful product. Say a business wants help answering customer questions. It also needs current business information, rules about what the AI may answer, and a way to pass uncertain questions to a person.
>
> So when you hear that a new model is “better,” ask: better at which task, at what cost, and with what checks? That question is much more useful than a leaderboard on its own.
>
> I'm the founder of Aksen Labs. Follow along, and we'll make these ideas practical, one minute at a time.

Shot plan: avatar for the opening question; a simple input → model → output graphic for the three examples; avatar for the business example; a customer-question mockup with a visible human handoff; avatar for the final question and close. Do not imply the mockup is a deployed Aksen customer system.

## Follow-up episode: Why does AI make things up?

Target: about 60 seconds.

> An AI answer can sound certain and still be wrong. Why?
>
> A language model is built to produce a useful response from the context it receives. That does not mean it has checked every statement against a reliable source. If a question is vague, the information is missing, or the facts have changed, it may fill the gap with something that sounds plausible.
>
> Imagine asking an AI for today's price of a service. A smooth answer is not enough. You need the actual source, when it was checked, and a way to handle a missing or conflicting price.
>
> The fix is not a magic prompt. Give the system trustworthy information, ask it to show sources where they matter, and let a person review important claims or actions.
>
> My simple rule: when the cost of being wrong rises, the strength of the check should rise too.

Shot plan: avatar hook; fabricated example price card clearly marked “example”; source/date graphic; avatar close.

## Follow-up episode: Chatbot versus AI agent

Target: about 60 seconds.

> What is the difference between an AI chatbot and an AI agent?
>
> A chatbot usually responds inside a conversation. Ask a question; it gives an answer. An agent goes further: it may use tools, look up information, and complete a sequence of steps toward a goal.
>
> For example, a chatbot might tell you how to prepare for a meeting. An agent might gather the relevant documents, draft an agenda, and put a proposed meeting time in front of you.
>
> The more an AI can do, the more clearly we need to define its limits. Which tools can it use? What information can it access? Which steps need your approval? What happens when it gets stuck?
>
> The useful question is not “Can this become an agent?” It is “Which part of this work should the system handle, and where should a person decide?”

Shot plan: avatar hook; two-column conversation/action graphic; illustrative agenda workflow; avatar close. Keep the action example conceptual until an actual Aksen implementation is verified.

## Provider comparison and acceptance

Test the first episode using the same script in (1) HeyGen's consented, video-trained Digital Twin and (2) OpenRouter's `heygen/avatar-iv` photo avatar if account/API access and rights allow. The two products should not be assumed to share a trained avatar. A Seedance visual clip can be tested separately for the supporting scene, not as a substitute for the presenter.

For each result, note: face likeness, accent and voice likeness, pronunciation of “Aksen,” lip sync, natural pauses, gestures, visual artifacts, 9:16 crop, final duration, render time, provider errors, and actual charge. Watch the entire clip before deciding. Keep all test outputs private until approved by the founder.

## Sources

- [HeyGen Digital Twin filming guidance](https://help.heygen.com/en/articles/12089286-create-your-first-digital-twin-video-avatar-with-avatar-iv)
- [HeyGen consent recording requirements](https://help.heygen.com/en/articles/12092609-recording-your-consent-video)
- [OpenRouter Avatar IV model page](https://openrouter.ai/heygen/avatar-iv)

## Local Media Studio build status (20 September 2026)

The local `/admin/studio` code now includes an episode planner with the first script as a template, editable scenes, HTTPS source links, and owner-scoped drafts. Video submissions also create owner-scoped render records. A returning user can check a job and open its video through an authenticated server route while OpenRouter still retains the output. These are local code changes, not a deployed or end-to-end tested production flow.

Activation requires the additive `platform/db/media-studio-migration.sql`. From `platform`, run `node scripts/migrate-media-studio.mjs` against the intended database only after confirming its environment and deployment target. The migration was not run during this build. No media storage destination is configured, so provider output must still be exported before the provider stops retaining it. The avatar generation and final timeline renderer await founder footage and a selected provider/storage setup.
