# Product direction: Aksen describes, products run elsewhere

Recorded 14 September 2026. This is the agreed direction and a record of what
changed, not a claim about anything built since.

## The decision

Aksen Labs is the agency. Products it builds run on their own hosting, and the
Aksen site describes them and links out. Aksen is not where anyone uses them.

The exception is free tools and demonstrations, which are marketing for the
agency rather than products, and continue to run on the site.

## What changed

**CV Forge** is the name, and it is an Aksen Labs product. It was previously
called Aksen Folio and ran inside this site at `/products/folio`, with its own
sign-in, CV storage, exports and eight API routes. All of that has been removed.

At the time of removal the database held one Folio user, which was a test
account, and zero saved CVs, so no customer work was lost. The four `folio_*`
tables still exist and were left alone.

The product has no public address yet. Its card says exactly that rather than
offering a link that goes nowhere, and the card gains a link the day there is
one to give it.

**The products page** now separates two things that were previously mixed:
products, which run elsewhere, and free tools, which run here. The free tools
are the three business agents plus the order, support and workspace
demonstrations, each labelled with what it actually is.

**The navigation** said "Free agents", which reads as freelancers. It now says
"Free tools". The page itself still explains they are agents.

## Not on the site: the job application tool

An idea, not an offering. Aggregate job leads against criteria a user sets, have
an agent submit applications, and report how many went out and how many reached
an interview.

It is recorded here and deliberately absent from the products page, because
nothing that does not exist goes in front of buyers. It earns a card when it is
built, not before.

## Open

- CV Forge needs a public address. The source is on the founder's machine at
  `2ndGenCVInsight`, package name `cv-forge`, already carrying a `vercel.json`.
- The `folio_*` tables can be dropped once there is certainty nothing is wanted
  from them. Dropping them is irreversible and was not done here.
