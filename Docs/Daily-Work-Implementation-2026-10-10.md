# Simpler daily work: first implementation

10 October 2026. Local source changes following the founder's priority: sales, delivery, money and follow-up.

## What changed

- **Today:** replaced the long dashboard with three useful shortcuts and a short next-step list. Overdue follow-ups, overdue invoice balances and delivery blockers come first. Three actions appear initially; filters and an expansion control reveal the rest. Each action explains its reason and links to the relevant record.
- **Navigation:** Today, Sales, Work, Money, Marketing, Company and Settings are directly available. Existing tools remain accessible through the work area they serve. The mobile menu retains labels, closes on navigation and supports Escape.
- **Sales:** a link from Today opens the specific enquiry and its history. A control returns to the full loaded list. Ten matching open enquiries appear initially, with more available on demand.
- **Work:** a link from Today opens the specific project. Project creation has its own tab, leaving the initial page for delivery. Eight matching projects appear initially. Requested project IDs are prioritised by the owner-scoped query so an older project does not disappear behind the list limit.
- **Money:** a compact cross-client overview shows recorded collections and unpaid invoice balances separately for each currency. The previous dashboard labelled an all-time receipt total as monthly; the new view explicitly labels its coverage. Draft and void receipts are excluded. No unpaid invoices does not imply that every client agreement is settled.
- **Financial links:** an invoice link can open both its client and its financial document. Missing client or document IDs produce an explanation instead of silently choosing another client.
- **Phone actions:** the inherited mobile rule hiding header links is overridden for Today and Money, keeping their primary actions visible.

The existing payment, invoice, project and client records remain the source. This pass adds no new schema, payment provider or sending workflow. It does not mark work accepted, infer unknown balances or equate recorded collections with verified bank payments.

## Checks

- Daily-action regression tests pass: priority order, closed/future exclusions, undated work, invalid dates, build completion versus acceptance, and encoded record links.
- Real SQL tests pass using transaction-local temporary tables: ownership boundaries, all-time issued receipts, draft/void exclusions, partial invoice balances, separate currencies and unfinished delivery dates.
- All **24 admin routes** pass the browser smoke check for rendering and hydration.
- Eight workspace routes pass horizontal-overflow and navigation checks at **320, 390, 768, 1024 and 1440 pixels**, totalling **40 route/width combinations**.
- A focused follow-up checks the final phone actions on Today and Money, correct financial-document selection, missing-record handling and signed-out access. It passes without submitting any business form or provider action.
- Existing client links retain their recorded settlement distinctions: a full-settlement record remains Paid; a collection against an unknown total remains Payment recorded.
- The targeted lint run passes for the changed pages, navigation, daily-action component and query helpers. `components/business-workspace.tsx` retains two pre-existing synchronous-effect lint errors in its loading/reset pattern.
- The broad regression suite initially passed 31/38 files. Three failed temporary-table database tests passed when rerun after connection resets. Two migration checks and two payment-provider checks remain unresolved from that broad run; they are not evidence of a verified provider flow.
- The final production build and TypeScript check both pass. The focused diff check is clean.

Private screenshots are under `platform/outputs/workspace-review/`, including `today-390.png`, `today-1440.png` and `money-desktop.png`. They contain internal records and are not public marketing assets.

## Scope still ahead

This completes an initial local daily-work pass, not the company-wide overhaul. The larger proposal remains in `Application-Overhaul-Proposal-2026-10-10.md`.

Next work should follow actual operating friction: make scope, client review, handover and ongoing care easier to complete in the connected client record; then address the public enquiry journey and reconcile branch/product facts. Cost and time tracking, client access and additional integrations remain proposed work, not delivered features.

No deployment was performed. Browser verification covers the local application with existing records. It does not verify production deployment, payment-provider delivery, client acceptance or public enquiry notifications.
