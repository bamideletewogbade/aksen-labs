# Aksen Labs website refinement — 7 September 2026

## Direction
Aksen Labs remains a digital transformation agency serving African business ambition, based in Ghana and open to other markets. AI is a useful capability within that broader work.

## Review findings and changes
- Homepage: removed long company/engagement/product explanations, duplicated full process, duplicated industry journey and unsupported TFS delivery claims. Kept a concise services overview and contextual links to deeper pages.
- Hero: stable headline and company positioning; three user-controlled visual views (People, Systems, Intelligence), each with a relevant destination. Replaced Gemini's cartoon-like hero assets with generated photography and detailed graphite/glass imagery.
- Navigation: Examples is now Industries; Insights is now Blog. Existing URLs are preserved. Mobile navigation closes on selection or Escape and marks the active route, including nested pages.
- Services: four compact capability rows. Removed repeated descriptions, deliverable lists and unconfirmed delivery timelines.
- Approach: four stages, a short output for each, and three working principles. This is the home of the full process.
- Industries: a compact five-industry explorer and three-step workflow replaces the long repeated cards and journey. All scenarios are explicitly illustrative.
- About: purpose, agency/product direction and geographic openness. Removed claims of existing customers across several countries.
- AI examples and workspace demo: aligned page introductions with the main site while preserving the functional demonstration and catalogue.
- Blog: retained database-backed publishing. Local editorial fallback articles now match their URLs; unknown URLs return 404 instead of showing an unrelated article.
- Enquiries: updated labels and fallback language, covered new-business/other answers, bounded recommendation waiting, and preserved compatibility with old payloads while storing new goal/market/setup answers meaningfully.
- Footer: a shared invitation replaces oversized repeated CTA sections. Desktop under-page reveal and progressive opacity are inspired by Motion's public footer-reveal example. Mobile and reduced-motion layouts use normal document flow.

## Assets
Three generated 1536 × 1024 originals are retained in assets/agency-refresh-2026-09-07. The website uses 1440 px and 768 px WebP variants, with appropriate loading priority and responsive selection. Five existing industry photographs also have WebP variants. Original asset files were preserved.

## Validation
- Production build passed.
- TypeScript passed.
- Targeted lint passed after fixing navigation and semantic markup findings.
- Non-browser HTTP checks: homepage, all nav destinations, AI example index/detail, contact flow, workspace demo and all three fallback blog URLs returned 200.
- Invalid article and AI example URLs returned 404.
- Invalid empty requests to chat, recommendation and enquiry endpoints returned 400 without creating test enquiries.
- No live model call, submitted customer enquiry or browser/device visual test was performed.
- Responsive rules cover small phones, tablets and desktop; reduced motion disables transforms and decorative transitions.

## Reference
- https://motion.dev/examples/react-footer-reveal
- https://motion.dev/docs/react-accessibility

A pre-refinement snapshot of app, components and lib was retained outside the site checkout in backups/pre-refinement-20260907.
