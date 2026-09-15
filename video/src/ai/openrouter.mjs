/**
 * A small OpenRouter client for the video workspace.
 *
 * The platform has a fuller one in lib/openrouter.ts with routing profiles,
 * telemetry and cost accounting. This does not import it: the video workspace
 * builds and renders on its own, and a render should not need the Next app to
 * exist. What it does share is the gateway and the key, so spend shows up in one
 * place on the OpenRouter dashboard.
 */
const BASE = 'https://openrouter.ai/api/v1';

export const MODELS = {
  // Writing scene copy is a judgement job, not a retrieval one, so it gets a
  // model that can hold a voice rather than the cheapest one available.
  script: 'anthropic/claude-sonnet-4.5',
  image: 'openai/gpt-image-1',
  video: 'bytedance/seedance-2.0-mini',
};

function key() {
  const value = process.env.OPENROUTER_API_KEY;
  if (!value)
    throw new Error(
      'OPENROUTER_API_KEY is not set. Copy it from platform/.env into video/.env.',
    );
  return value;
}

function headers() {
  return {
    Authorization: `Bearer ${key()}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://aksenlabs.com',
    'X-Title': 'Aksen Labs video',
  };
}

export async function chat({ system, prompt, model = MODELS.script, maxTokens = 2000 }) {
  const response = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        ...(system ? [{ role: 'system', content: system }] : []),
        { role: 'user', content: prompt },
      ],
    }),
  });
  if (!response.ok)
    throw new Error(`Chat failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content ?? '',
    model: data.model ?? model,
    cost: data.usage?.cost,
  };
}

/**
 * Image models do not all take the same aspect ratios, and asking for one they
 * do not take is a 400 rather than a best effort. gpt-image-1 accepts 1:1, 3:2,
 * 2:3 and auto, so a request for 9:16 has to become 2:3.
 *
 * assets.config.mjs states the ratio the video actually wants, because that is
 * the honest thing for it to say. The mapping lives here, next to the model that
 * imposes it. Backdrops are set with objectFit cover, so a 2:3 image fills a
 * 9:16 frame by cropping the sides, which for an abstract field costs nothing.
 */
const SUPPORTED = {
  'openai/gpt-image-1': ['1:1', '3:2', '2:3'],
};
const NEAREST = { '9:16': '2:3', '16:9': '3:2', '4:3': '3:2', '3:4': '2:3' };

function ratioFor(model, wanted) {
  if (!wanted) return undefined;
  const supported = SUPPORTED[model];
  if (!supported || supported.includes(wanted)) return wanted;
  const fallback = NEAREST[wanted];
  if (fallback && supported.includes(fallback)) {
    console.log(`    (${model} has no ${wanted}, using ${fallback} and cropping)`);
    return fallback;
  }
  return undefined;
}

export async function image({ prompt, model = MODELS.image, aspectRatio }) {
  const ratio = ratioFor(model, aspectRatio);
  const response = await fetch(`${BASE}/images`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      model,
      prompt,
      ...(ratio ? { aspect_ratio: ratio } : {}),
    }),
  });
  if (!response.ok)
    throw new Error(`Image failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  const first = data.data?.[0];
  if (!first?.b64_json) throw new Error('No image came back.');
  return {
    base64: first.b64_json,
    mediaType: first.media_type || 'image/png',
    model,
    cost: data.usage?.cost,
  };
}

/**
 * Video generation is a submit-then-poll job that runs to minutes, so this
 * blocks until it finishes or gives up. That is the right shape here: the asset
 * pipeline is a build step somebody runs deliberately, not a request serving a
 * page, and a half-generated clip is no use to anyone.
 */
export async function video({
  prompt,
  model = MODELS.video,
  aspectRatio,
  duration,
  generateAudio = false,
  timeoutMs = 10 * 60 * 1000,
}) {
  const submitted = await fetch(`${BASE}/videos`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      model,
      prompt,
      ...(aspectRatio ? { aspect_ratio: aspectRatio } : {}),
      ...(duration ? { duration } : {}),
      generate_audio: generateAudio,
    }),
  });
  if (!submitted.ok)
    throw new Error(
      `Video submission failed: ${submitted.status} ${await submitted.text()}`,
    );
  const job = await submitted.json();

  const deadline = Date.now() + timeoutMs;
  let wait = 5000;
  for (;;) {
    if (Date.now() > deadline)
      throw new Error('Video generation timed out. The job may still finish; rerun to pick it up.');
    await new Promise((resolve) => setTimeout(resolve, wait));
    // Backs off to 20s: polling a multi-minute render every five seconds is
    // hundreds of pointless requests for one clip.
    wait = Math.min(wait * 1.4, 20000);

    const polled = await fetch(job.polling_url, {
      headers: { Authorization: `Bearer ${key()}` },
    });
    if (!polled.ok) continue;
    const state = await polled.json();
    if (state.status === 'completed' || state.status === 'succeeded') {
      const url = state.unsigned_urls?.[0];
      if (!url) throw new Error('Video finished with no file.');
      const file = await fetch(url);
      if (!file.ok) throw new Error(`Could not download the video: ${file.status}`);
      return {
        buffer: Buffer.from(await file.arrayBuffer()),
        mediaType: 'video/mp4',
        model,
      };
    }
    if (state.status === 'failed' || state.error)
      throw new Error(`Video generation failed: ${state.error || 'unknown reason'}`);
    process.stdout.write('.');
  }
}
