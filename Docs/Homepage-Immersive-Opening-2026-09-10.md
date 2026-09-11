# Homepage immersive opening — 10 September 2026

The home header and hero fill at least one stable viewport (100svh, with vh fallback). Header height is accounted for: 89px desktop including border and 73px on mobile. Content may grow beyond one screen on small/short devices or at larger text sizes to preserve readability and prevent clipping.

The stable headline and agency positioning remain. Three stories rotate every seven seconds: Commerce, Intelligence and People, using existing responsive WebP assets and crossfades. Manual selection pauses the rotation. A play/pause control is included; reduced-motion preferences disable automatic motion. Visibility and focus/hover controls pause automatic changes. Decorative connections and subtle node pulses sit behind the imagery and are hidden from assistive technology.

Mobile uses a compact single image without the overlapping people card or AI chip. Primary actions remain in the copy. Controls have 44px targets and visible keyboard focus. No new dependencies, remote images or AI inference calls are used for this effect.

Validation: TypeScript and targeted lint passed; homepage and all six responsive images returned HTTP 200. Browser viewport and interaction QA was not performed in this pass.
