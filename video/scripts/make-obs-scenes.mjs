import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

/**
 * Writes an OBS scene collection for recording the human shots in the film.
 *
 * Generated rather than hand-written. A scene collection is a graph: every scene
 * is itself a source, it holds `items` that reference other sources by name and
 * id, the ids have to be unique and consistent, and OBS will silently drop a
 * scene whose item references something that is not there. Typing that by hand
 * produces a file that imports and is quietly half empty.
 *
 * The canvas is 1080x1920. A camera shot recorded landscape and cropped later
 * loses most of its resolution and all of its framing, and the film this feeds
 * is vertical first.
 *
 * The camera device is deliberately left blank. Device ids are specific to the
 * machine, and guessing one produces a source that looks configured and shows
 * nothing. OBS prompts on first use.
 */

const OUT = 'obs';
const CANVAS = { width: 1080, height: 1920 };

const ids = new Map();
const uuid = (name) => {
  if (!ids.has(name)) ids.set(name, randomUUID());
  return ids.get(name);
};

/** The common envelope every source needs, whatever kind it is. */
const source = (name, id, settings, { audio = false } = {}) => ({
  prev_ver: 537001986,
  name,
  uuid: uuid(name),
  id,
  versioned_id: id,
  settings,
  mixers: audio ? 255 : 0,
  sync: 0,
  flags: 0,
  volume: 1.0,
  balance: 0.5,
  enabled: true,
  muted: false,
  'push-to-mute': false,
  'push-to-mute-delay': 0,
  'push-to-talk': false,
  'push-to-talk-delay': 0,
  hotkeys: {},
  deinterlace_mode: 0,
  deinterlace_field_order: 0,
  monitoring_type: 0,
  private_settings: {},
});

/** A placed source inside a scene. bounds_type 2 is "scale to inner bounds",
 *  which is what keeps a 16:9 camera sane on a 9:16 canvas. */
let itemId = 0;
const item = (name, { x, y, w, h, crop = {} }) => ({
  name,
  id: ++itemId,
  source_uuid: uuid(name),
  visible: true,
  locked: false,
  rot: 0.0,
  pos: { x, y },
  scale: { x: 1.0, y: 1.0 },
  align: 5,
  bounds_type: 2,
  bounds_align: 0,
  bounds: { x: w, y: h },
  crop_left: crop.left ?? 0,
  crop_top: crop.top ?? 0,
  crop_right: crop.right ?? 0,
  crop_bottom: crop.bottom ?? 0,
  scale_filter: 'disable',
  blend_method: 'default',
  blend_type: 'normal',
  show_transition: { duration: 0 },
  hide_transition: { duration: 0 },
  private_settings: {},
});

const scene = (name, items) =>
  source(name, 'scene', { id_counter: items.length, custom_size: false, items });

// The four shots worth having a scene for. Named with numbers because OBS sorts
// them the way you list them and a hotkey order that matches the shot order is
// one less thing to think about while recording.
const scenes = [
  // The shot the film actually needs: head and shoulders, filling a vertical
  // frame. The camera is cropped to 9:16 rather than letterboxed.
  scene('01 To camera', [
    item('Backdrop', { x: 0, y: 0, w: CANVAS.width, h: CANVAS.height }),
    item('Camera', {
      x: 0,
      y: 0,
      w: CANVAS.width,
      h: CANVAS.height,
      // A 1920x1080 feed cropped to the middle 607px of width gives 9:16.
      crop: { left: 656, right: 657 },
    }),
  ]),
  // Talking over the product. Camera small and low left, screen filling the top
  // two thirds where a phone viewer is actually looking.
  scene('02 Screen and camera', [
    item('Backdrop', { x: 0, y: 0, w: CANVAS.width, h: CANVAS.height }),
    item('Browser capture', { x: 0, y: 360, w: CANVAS.width, h: 608 }),
    item('Camera', {
      x: 60,
      y: 1180,
      w: 400,
      h: 400,
      crop: { left: 420, right: 420 },
    }),
  ]),
  // No face, just the product being used.
  scene('03 Screen only', [
    item('Backdrop', { x: 0, y: 0, w: CANVAS.width, h: CANVAS.height }),
    item('Browser capture', { x: 0, y: 656, w: CANVAS.width, h: 608 }),
  ]),
  // For pointing a phone at a phone: the WhatsApp side of the story, which the
  // headless browser capture cannot produce.
  scene('04 Phone in hand', [
    item('Backdrop', { x: 0, y: 0, w: CANVAS.width, h: CANVAS.height }),
    item('Camera', { x: 0, y: 0, w: CANVAS.width, h: CANVAS.height }),
  ]),
];

const collection = {
  name: 'Aksen Labs',
  DesktopAudioDevice1: source('Desktop Audio', 'wasapi_output_capture', {
    device_id: 'default',
  }, { audio: true }),
  AuxAudioDevice1: source('Microphone', 'wasapi_input_capture', {
    device_id: 'default',
  }, { audio: true }),
  sources: [
    // A flat brand ground behind everything, so a scene is never transparent
    // and a crop never shows the desktop.
    source('Backdrop', 'color_source_v3', {
      // OBS stores colour as ABGR. #062319 with full alpha.
      color: 0xff192306,
      width: CANVAS.width,
      height: CANVAS.height,
    }),
    source('Camera', 'dshow_input', {
      res_type: 1,
      resolution: '1920x1080',
      video_device_id: '',
      audio_output_mode: 0,
    }),
    source('Microphone', 'wasapi_input_capture', { device_id: 'default' }, { audio: true }),
    source('Browser capture', 'window_capture', {
      method: 2,
      cursor: true,
      client_area: true,
    }),
    ...scenes,
  ],
  groups: [],
  scene_order: scenes.map((s) => ({ name: s.name })),
  current_scene: scenes[0].name,
  current_program_scene: scenes[0].name,
  current_transition: 'Fade',
  transition_duration: 250,
  transitions: [],
  quick_transitions: [],
  saved_projectors: [],
  preview_locked: false,
  scaling_enabled: false,
  scaling_level: 0,
  scaling_off_x: 0.0,
  scaling_off_y: 0.0,
  'virtual-camera': {},
  modules: {},
  version: 3,
};

mkdirSync(OUT, { recursive: true });
const path = `${OUT}/Aksen-Labs.json`;
writeFileSync(path, `${JSON.stringify(collection, null, 2)}\n`);

// Parsed back and checked, because the only thing worse than no scene collection
// is one that imports and is quietly missing half its scenes.
const back = JSON.parse(readFileSync(path, 'utf8'));
const sceneNames = back.sources.filter((s) => s.id === 'scene').map((s) => s.name);
const referenced = new Set(
  back.sources
    .filter((s) => s.id === 'scene')
    .flatMap((s) => s.settings.items.map((i) => i.name)),
);
const available = new Set(back.sources.map((s) => s.name));
const missing = [...referenced].filter((name) => !available.has(name));

console.log(`Wrote ${path}`);
console.log(`  canvas   ${CANVAS.width}x${CANVAS.height}`);
console.log(`  scenes   ${sceneNames.join(', ')}`);
console.log(
  missing.length
    ? `  BROKEN   scenes reference missing sources: ${missing.join(', ')}`
    : '  checked  every scene item resolves to a real source',
);
console.log(
  '\nImport it in OBS: Scene Collection > Import > choose this file, then pick your camera on the Camera source.',
);
