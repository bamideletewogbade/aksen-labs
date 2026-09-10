# Admin and product cleanup — 9 September 2026

## Admin
- Grouped navigation into Daily work, Website & products, and Review & activity; used shorter page names and matching browser titles.
- Preserved the existing admin authentication guard and sign-out path. Added an admin-content landmark and keyboard skip link.
- Introduced a scoped dark-green presentation with clearer type, stronger form contrast, consistent panel spacing and responsive navigation. Financial print styles remain separate.
- Added text search and stage filters for the records already loaded on Enquiries and Projects. Counts and clear-filter states explain the result. The existing 30-record limits remain visible in the page descriptions.
- Product links can open the enquiries page with an initial search term. Folio uses its product name to find its enquiries within the loaded records.
- Kept existing save endpoints and approval/billing actions. Text controls remount from the saved value after a failed optimistic save to avoid displaying stale edits.
- Collapsed the overview's explanatory workspace map so real records take priority.
- Added an authenticated, read-only Products overview sourced from the same catalogue as the website. It explicitly states that catalogue changes are made in the site source.

## Public products
- Converted the product collection to two compact cards on desktop and a single column on mobile.
- Removed duplicate summaries and made capability lists expandable.
- Simplified the Folio enquiry section while retaining its development status and existing form.

## Checks and limits
- TypeScript and targeted lint checks passed.
- Products and Folio returned HTTP 200.
- All 11 admin routes, including the new Products overview, returned the expected authentication redirect (307) to an unauthenticated request.
- No authenticated browser visual pass, record mutation, invoice operation, approval or publishing action was performed.
