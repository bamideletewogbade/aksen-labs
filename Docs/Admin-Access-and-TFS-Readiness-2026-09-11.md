# Admin access and TFS readiness

Updated 11 September 2026. This supersedes the earlier report's statement that the local admin email allowlist is unset.

## Sign-in

The local workspace now has a single-owner email/password sign-in at `/login`, using bishoptewogbade@gmail.com and the password chosen by the owner. The password is not in application source or client bundles. A salted PBKDF2-SHA256 hash is stored in the ignored local environment configuration.

Sessions are random bearer tokens in HttpOnly, SameSite=Strict cookies, with Secure added on HTTPS. Only a SHA-256 digest of each token is stored in the database. Sessions expire after eight hours and sign-out removes the database session. Changing the configured password hash or administrator email invalidates existing sessions. Ten login attempts are allowed per fixed fifteen-minute window through a persistent shared counter; this is a single-owner limit, not a per-IP abuse service.

When password sign-in is configured, the previous Sites local sign-in identity cannot bypass it. The existing internal owner key is retained so that the five saved prospects, client workspaces, operation drafts and campaign ownership remain accessible. No broad ownership migration or record deletion was performed.

To change the password, use `scripts/configure-admin.mjs` with the new password through standard input. It saves only a fresh salted hash. The script is currently specific to the owner's email and retained workspace identity. Expired session rows are rejected on access; automated session-row retention cleanup is not implemented.

This setup is configured locally. No production deployment or hosted secret update occurred. Hosting requires the corresponding administrator configuration and database credentials on the deployed runtime, followed by a hosted sign-in test. The owner-selected password is a temporary credential; replace it with a stronger one before exposing password login publicly.

## Checks completed

- Correct credentials successfully created a database session.
- Wrong-password, wrong-account, malformed hash, duplicate-cookie, origin rejection, rate-limit gate and HTTPS cookie flag tests passed.
- Authenticated requests accessed the existing five prospects and readiness endpoint.
- Signing out revoked the session; reusing the same cookie returned 403.
- All 17 admin pages and five read APIs returned 200 under the new login.
- A live authenticated OpenRouter connection test returned the correct fictional GHS 450 response, with request tracking recorded.
- Database session migration was additive. Existing business records were preserved.
- TypeScript, targeted lint and support/tracking regressions passed. The final production build also passed.

These checks validate routes, authentication, backend behaviour and compilation. They do not constitute a browser visual review or exhaustive interaction testing of every admin control.

## TFS project record

No existing TFS project record was found. The owner-reported implementation was recorded as:

- Project: TFS — implementation and client alignment.
- Client: The Frame Shop (TFS).
- Stage: In delivery.
- Health: Watch.
- Next gate: Contact the client and confirm priorities, scope, approval and commercial terms before further commitments.

The objective records that implementation has started while client approval, scope, commercial terms and payment remain unconfirmed. No invoice, payment, client acceptance or percentage of completed work was invented. The report was captured in the activity log.

The reviewable outreach draft is in `TFS-Client-Alignment-Draft-2026-09-11.md`. No email or other client message was sent.

## Remaining operating dependencies

Internal admin work, prospect review, project tracking and AI drafting can proceed. Resend still needs its API key and verified sender before outbound emails can be sent. Live WhatsApp, provider payment verification and order fulfilment remain separate integrations; their demos do not establish live readiness. Marketing campaign and unsubscribe processing remain unconnected.

For TFS, the immediate next step is client alignment using a truthful walkthrough of implemented, illustrative and planned elements, followed by an agreed scope and commercial arrangement.
