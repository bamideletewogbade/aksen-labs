# Design Decisions: Dhope Connect

**Client:** Dhope Connect. Friend of the founder. Imported ready-to-wear menswear, resale.
**Market:** Accra, Ghana. GHS.
**Current channel:** Instagram plus WhatsApp DMs. No website.
**Code:** `C:\Users\HP\Desktop\dhope-connect`
**Status:** Phase 1 storefront built against these decisions. Client facts still unconfirmed, see section 7.
**Date:** 2026-09-11

---

## 1. Why the design brief is different for resale

He does not own the goods' design. Anyone with an import contact can stock the same
pieces. That has one consequence that drives every visual decision:

**The brand equity cannot live in the product. It has to live in the curation and the
shop's own voice.**

A product-led design (big product, small brand) makes him interchangeable with every
other importer. A voice-led design (strong typographic identity, dated drops, an
editorial point of view about what got selected and why) makes the shop the reason to
buy. That is the defensible position available to a reseller.

## 2. The constraint nobody plans for

His photography will be inconsistent. Phone shots, different rooms, different light,
mixed backgrounds, shot over months. This is the real design constraint, not taste.

The system must make uneven photography look deliberate:
- Fixed aspect ratio on every product image (4:5), enforced at upload, never free-form.
- A visible hairline frame around each image so varied backgrounds read as "framed
  plate" rather than "sloppy crop".
- Generous negative space and a warm ground, so a slightly grey phone photo sits
  inside the palette instead of fighting it.
- No full-bleed edge-to-edge hero photography. It magnifies exactly the flaws his
  images have.

## 3. Competitive read (Accra)

| Reference | What they do | The gap |
|---|---|---|
| [The Lotte Accra](https://thelotteaccra.com/collections/men) | Closest premium comparable. Minimal neutral Shopify build, clean grid, prices in USD, sizes S to XXL and waist 32 to 42 | **No size chart and no fit guidance at all.** Prices in USD, which reads as diaspora-facing, not Accra-facing |
| Instagram thrift and import pages (e.g. [Thrift by JieJorm](https://www.instagram.com/thrift_by_jiejorm/), ~97K followers) | High follower counts, drop-led, entirely in-feed. All commerce in DMs | No catalogue, no stock truth, no search, nothing persists past the feed |
| Ghanaian brand houses (Free The Youth, Atto Tetteh, Abrantie, [Hazza](https://growyourclothingbrand.com/blog/clothing-brands-by-country/top-ghanaian-clothing-brands-you-should-know/)) | Strong brand-led identity, own product | Not his competitive set, but they set the visual bar local buyers now expect |

The near-black, thin-serif, minimal look is already the default of every Accra thrift
and import page. Copying it means arriving invisible.

## 4. Directions considered

**A. Kiosk Editorial (SELECTED)**
Warm bone ground, ink anchor, one restrained accent. Heavy grotesque display for
wordmark and section heads, plain legible sans for UI. Framed 4:5 product plates,
dated drops, sold items kept visible with a SOLD stamp.

**B. Gallery Minimal (rejected)**
Pure white, true black, hairline serif, edge-to-edge imagery. Rejected on two counts:
it is the local default so it differentiates nothing, and it is the least forgiving
possible container for phone photography. Thin serif hairlines also break up on cheap
Android panels at low brightness in daylight.

**C. Street Drop (held in reserve)**
High contrast, acid accent, dense grid, ticker rail, aggressive type. Correct if his
customer is 18 to 25 buying streetwear. Wrong if the customer is a 28 to 40
professional buying smart casual. **Revisit once the customer age and price band are
confirmed.**

## 5. The decision

**Direction A, Kiosk Editorial.**

**Palette**
- Ground: warm bone / oat, not white. Warm neutrals flatter phone photography shot
  under Ghanaian daylight and tungsten. Cold grey exposes every white-balance error.
- Anchor: deep ink, not pure black. Pure black next to a photo's soft black makes the
  photo look faded.
- Accent: a single saturated tone used only for price, stock state and the primary
  action. One accent, used sparingly, reads as considered. Two reads as a template.
- Full token values to be set once the wordmark exists.

**Typography**
- Display: a grotesque with real weight and character. Explicitly not Playfair
  Display, which is the overused default and whose hairlines fail on low-end screens.
- UI: a neutral, highly legible sans at a generous base size. Most traffic is
  one-handed Android in variable light.

**Layout rules**
- Two columns on mobile, never one. A one-column mobile grid makes a shallow resale
  catalogue look empty.
- Drops are dated and named. The unit of browsing is the drop, not the category.
- Sold items stay visible with a SOLD stamp. In resale, sold-out is social proof and
  it makes a thin catalogue look busy. It also feeds the restock waitlist.
- Every product carries measured garment dimensions, not just a label size.

**Performance budget**
Mobile-first on Android over variable data. Hard limits, checked at build: images
served as AVIF/WebP at fixed dimensions, no hero video, no web font above two
families and four weights total.

## 6. Why, in one line each

| Decision | Why |
|---|---|
| Voice-led, not product-led | He resells. Curation is the only thing competitors cannot copy off him |
| Warm bone ground | Flatters inconsistent phone photography. Cold white punishes it |
| Framed fixed-ratio plates | Turns uneven source images into a deliberate system |
| Not near-black minimal | It is the local default. Arriving as the default is arriving invisible |
| Dated drops as the browsing unit | Creates recurrence and scarcity where the goods themselves carry no brand |
| SOLD kept visible | Social proof, catalogue density, and demand signal for the next buying run |
| Measured dimensions on every item | Imported sizing is inconsistent across origins. The label size is not trustworthy |
| Two-column mobile grid | A shallow catalogue in one column reads as an empty shop |

## 7. Resolved since, and what is still open

**Resolved**

| Item | Decision | Confidence |
|---|---|---|
| Brand name | Dhope Connect. Rendered as `DHOPE.CONNECT`, the stop set in the accent colour | Confirmed by client contact |
| Wordmark | None exists. Set in Archivo 800 as the interim mark | Ours to revisit |
| Stock depth | Size runs, not one-of-one. Product plus variants plus stock ledger | **Assumed.** The founder said "I believe", so it is not verified |
| Source visibility | Supplier and cost are admin-only, never rendered. Enforced in the type system, not by convention | Confirmed by client contact |
| Checkout in phase 1 | Yes. Ghana is mobile-money native, Paystack's second-largest market, so a MoMo checkout is expected rather than premature | Ours, backed by research |

**Still open, and what each one blocks**

1. **Price band per piece in GHS, and customer age.** The client said "let's do
   the best stuff", which is a sourcing statement, not a position. Every
   reseller says they sell the best stuff. What decides the design is what a man
   pays. Seed data currently assumes GH₵220 to GH₵890 and a 28 to 40 customer.
   **If the real customer is 18 to 25 streetwear, direction C replaces A.**
2. Drop size and cadence. Affects whether the drop rail on the home page is
   honest or decorative.
3. Whether the exchange policy published on `/delivery` is one he will honour.
   The site currently promises seven days and a free swap when our measurements
   were wrong. **That is a commitment he has not agreed to.**
4. Delivery fees. The zone table is invented and needs his real dispatch costs.
5. Paid engagement or favour. Unanswered. It sets the reference price he gets
   quoted back on client four.

## 8. Standing house rules applied

No em dashes and no AI-stock phrasing in any copy, UI string or document on this
account.
