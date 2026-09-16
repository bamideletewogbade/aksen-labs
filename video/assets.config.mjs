/**
 * What the videos need generated, and why each one is generated rather than
 * photographed.
 *
 * The rule this file follows: generate the thing that cannot be photographed
 * honestly. A texture, a backdrop, an abstract field behind a headline, a room
 * with nobody identifiable in it. Those are fine.
 *
 * What is never generated: a person presented as a customer of ours. A launch
 * film is exactly where that temptation shows up, because a smiling shop owner
 * saying the product changed their life is the easiest frame in advertising and
 * the only one here that would be a lie. Aksen has not got that customer yet.
 * The film has a slot for a real person instead, recorded in OBS.
 *
 * Anything depicting a person or a place carries `label`, which is stamped on
 * the frame. Hands and rooms are atmosphere and say so. Faces are not used.
 *
 * `key` is the filename and the cache key. Change a prompt and you must change
 * the key, or the pipeline will keep serving the old file.
 */
/**
 * Appended to every image prompt.
 *
 * These are not style preferences, they are defects seen in real output from
 * this pipeline. The first batch came back with a painted white border inside
 * the frame, which shows as letterboxing once the image is used full bleed, and
 * with a scribbled artist signature in the corner, which is a fabricated credit
 * to a person who does not exist sitting on a company's marketing asset.
 *
 * Saying it once here beats remembering it in every prompt.
 */
const HOUSE =
  ' Fills the entire frame edge to edge with no border, no white margin, no inner frame and no vignette. No signature, no watermark, no artist mark, no caption, no letters or numbers anywhere in the image.';

export const assets = [
  {
    key: 'backdrop-hero-vertical',
    kind: 'image',
    aspectRatio: '9:16',
    prompt:
      'An abstract backdrop for a title card. Soft pale sage green paper texture, a faint network of thin connected lines and small nodes drifting across it, deep forest green accents. No text, no letters, no logos, no people, no user interface. Calm, matte, print-like, heavily negative space in the upper two thirds.',
  },
  {
    key: 'backdrop-close-dark',
    kind: 'image',
    aspectRatio: '9:16',
    prompt:
      'An abstract backdrop for a closing card. Very dark forest green, almost black, with a faint dot grid and one soft pool of lime green light in the lower right. No text, no letters, no logos, no people. Matte, calm, heavily negative space.',
  },
  {
    key: 'shopfront-texture',
    kind: 'image',
    aspectRatio: '9:16',
    label: 'Illustration',
    prompt:
      'A warm illustrated interior of a small West African retail shop at dusk, shelves of stock, soft lamplight, seen from a distance, painterly and slightly abstract. No recognisable faces, no text, no signage, no logos.',
  },
  // The problem card. A counter at closing time with the day's mess still on it
  // says "it is late and this is not finished" without a person in frame.
  {
    key: 'late-counter',
    kind: 'image',
    aspectRatio: '9:16',
    label: 'Illustration',
    prompt:
      'A small shop counter at night after closing, seen from above at a slight angle. A phone face down, a notebook with handwriting, a calculator, a cold cup of tea. Warm lamplight, deep shadows, painterly illustration. No people, no faces, no hands, no text, no logos, no readable writing.',
  },
  // The relief card, deliberately the same room in daylight. The pair does the
  // before and after without a word of copy claiming it.
  {
    key: 'morning-counter',
    kind: 'image',
    aspectRatio: '9:16',
    label: 'Illustration',
    prompt:
      'The same small shop counter in clear morning light, tidy and clear, one neat stack of packed orders ready to go, a plant, an open shutter behind. Painterly illustration, calm, warm, sage and cream tones. No people, no faces, no text, no logos.',
  },
  // Nigeria friends kit, September 2026. One room per industry, lit and empty,
  // so a post can say "what we could build for a place like this" without
  // implying the place is a client. Every one is labelled and has no faces.
  ...[
    ['ng-boutique', 'a small Lagos fashion boutique, colourful ankara fabrics on rails, folded parcels tied for dispatch on the counter, a ring light switched off'],
    ['ng-restaurant', 'a busy small Nigerian restaurant kitchen pass at lunchtime, takeaway packs of jollof rice lined up with order tickets, steam and warm light'],
    ['ng-pharmacy', 'a clean neighbourhood pharmacy counter in Abuja, neat shelves of medicine boxes without readable labels, a small prescription tray'],
    ['ng-realestate', 'a bright empty modern apartment living room in Lekki being prepared for a viewing, keys and a folder on a kitchen island, city light through tall windows'],
    ['ng-school', 'an empty private school classroom in Nigeria in morning light, wooden desks, a whiteboard with no writing, school bags on hooks'],
    ['ng-salon', 'a small hair and beauty salon interior, styling chairs, mirrors, braiding hair extensions arranged on a shelf, soft afternoon light'],
    ['ng-logistics', 'a dispatch rider bay at dawn in Lagos, delivery motorcycles with boxes parked in a row, parcels stacked on a table, orange sky'],
    ['ng-events', 'an elegant event hall being set up for a Nigerian wedding reception, round tables with gold chairs and flowers, soft uplighting, no guests'],
    ['ng-minimart', 'a tidy supermarket aisle in a Nigerian mini mart, stocked shelves of groceries without readable brands, a stock clipboard on a crate'],
  ].map(([key, scene]) => ({
    key,
    kind: 'image',
    aspectRatio: '9:16',
    label: 'Illustration',
    prompt: `A rich editorial illustration of ${scene}. Painterly, warm, slightly stylised, deep forest green and warm amber tones with lime highlights, strong depth, room for a headline in the top third. No people, no faces, no hands, no text, no signage, no logos, no readable writing.`,
  })),
  {
    key: 'ng-backdrop-lime',
    kind: 'image',
    aspectRatio: '9:16',
    prompt:
      'An abstract backdrop. Deep forest green, almost black, with flowing thin lime green light lines like a circuit that curve into the shape of a river delta, faint dot grid, one bright glow at the lower centre. No text, no letters, no logos, no people. Matte, bold, heavily negative space in the top half.',
  },
].map((asset) => ({ ...asset, prompt: asset.prompt + HOUSE }));

/**
 * Clips. Slow and the expensive part of the pipeline, so they are excluded
 * unless you pass --clips.
 *
 * Audio is never requested. Seedance will score a clip if you let it, and the
 * first clip this workspace submitted failed after 52 seconds on
 * "the output audio may be related to copyright restrictions". Every clip here
 * is scored in the edit anyway.
 */
export const clips = [
  {
    key: 'opening-drift',
    kind: 'video',
    aspectRatio: '9:16',
    duration: 4,
    prompt:
      'Slow push in on an abstract field of pale sage green paper texture with faint thin connected lines and small softly glowing nodes. Gentle parallax, no camera shake, no cuts. No text, no people, no interface, no logos.',
  },
  {
    key: 'hands-phone',
    kind: 'video',
    aspectRatio: '9:16',
    duration: 4,
    label: 'Illustration',
    prompt:
      'Close overhead shot of a single pair of hands setting a phone down on a wooden shop counter and sliding it away, warm evening light. Hands only, no face, no screen content visible, no text, no logos. Slow, calm, one continuous take.',
  },
];
