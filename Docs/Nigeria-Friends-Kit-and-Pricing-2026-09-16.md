# Nigeria friends kit and entry pricing

Recorded 16 September 2026. Friends in Nigeria have offered to share Aksen with people they know. This file sets the entry prices they can quote, the reasoning behind them, and where the shareable assets live.

**Status: founder decision, draft prices.** These prices are proposed, not published on the site. They change here first.

**This goes against section 6 of the operating brief** ("no Nigeria expansion"). The founder decided on 16 September to test Nigeria through friends' referrals. It is logged in the brief's decision log. It is a referral test, not a market launch: no ads budget, no new sector pages.

---

## 1. What the kit has to do

One job: show what Aksen can build, across industries people recognise, and get the viewer into a **free discovery call** on WhatsApp.

- We are not a website shop. The call works out the best place to start: getting more customers, running the business better inside, or both.
- Every example is a **fictional business** and says so. No results, no testimonials, no "trusted by".
- AI prepares, a person decides. That line appears in the kit because it is what we actually sell.

## 2. The money in naira

Rate used: **GHS 1 = ₦119** (Wise mid-market, checked 16 September 2026). The site's currency table uses ₦120.

Loaded delivery cost stays at the brief's placeholder, GHS 120/hour, which is about **₦14,300/hour**.

Low prices only keep a margin if the hours are small. So every entry offer below is **fixed scope, built from a template, and capped in hours**. Anything outside the scope is a quote after the discovery call, never a discount.

| Offer | Price | What they get | Hour cap | Est. cost | Margin |
| --- | --- | --- | --- | --- | --- |
| Discovery call | **Free** | 20 minutes on WhatsApp. We recommend one first step. | 0.5 | ₦7,150 | Sales cost |
| Lead Pack | **₦29,900** | 30 checked businesses in your niche and city, sources shown, 3 message drafts you send yourself | 1.0 | ₦15,300 (incl. ~₦1,000 AI) | 49% |
| Business Check | **₦49,900** | 60-minute session, a one-page plan, a priced recommendation. Fully credited to a build within 30 days | 1.5 | ₦21,450 | 57% |
| Starter Page | **₦99,000** | One-page site with WhatsApp order or booking button, Google Business Profile set up | 3.0 | ₦44,900 (incl. domain) | 55% |
| WhatsApp Order Desk | **₦149,000** + ₦19,900/mo | Catalogue, quick replies, an order form that writes every order to one dashboard your team can see | 4.5 | ₦64,350 | 57% |
| Bookings and Reminders | **₦179,000** + ₦19,900/mo | Online booking, reminders before the appointment, a daily list for staff | 5.5 | ₦78,650 | 56% |
| Custom build | **From ₦450,000** | Internal tools, dashboards, portals, integrations. Quoted only after the discovery call or Business Check | Quoted | Floor rule | 50%+ |
| Care | **From ₦19,900/mo** | Hosting, small edits, a monthly check. Hours and response times written in the proposal | 1.0/mo | ₦14,300 | 28% floor, rises with bundles |

Margins are estimates on the placeholder hour cost. The first three delivered jobs must be timed. If an offer runs over its cap twice, the price or the scope changes, not the margin.

Care at ₦19,900 is thin on its own. It is priced to keep the client, and it earns its margin because it rides on setup work already done. Do not sell care without setup.

### Market reference

Vendor offers, not proof of what people will pay:

- Basic business websites in Nigeria: ₦200,000 to ₦500,000; e-commerce ₦800,000 to ₦3,000,000 (Nexoris, September 2026).
- Chatbot subscriptions: ₦10,000 to ₦80,000 a month, setup ₦10,000 to ₦20,000 (Lura, June 2026).

Our entry offers sit well under the website band and inside the chatbot band. That is deliberate: the job is to start conversations, and the margin comes from scope discipline.

## 3. The pricing strategy, in plain terms

1. **Free front door.** The discovery call costs nothing, so nobody has to decide on price before they talk to us.
2. **A tiny paid step.** The ₦29,900 Lead Pack is easy to say yes to, runs on a tool we already have (Lead Scout), and turns a stranger into a paying client within a couple of days. Paying once makes paying again easier.
3. **Anchor against the market.** Quote the ₦99,000 Starter Page next to the ₦200,000+ market band, stated as market rates, not as a competitor attack.
4. **Credit, not discount.** The Business Check fee is credited to a build within 30 days. Money feels safe, and it pushes a decision.
5. **Bundle up, never down.** Starter Page plus Order Desk is **₦219,000** (saves ₦29,000). A bundle raises the order value while the hours stay templated.
6. **Founding-client price lock.** The first 10 Nigerian clients keep their care price for 12 months. A real deadline, honestly stated, with a count we update.
7. **Split payment.** 50% to start, 50% at handover. Bank transfer or Paystack. Third-party fees (WhatsApp Business API messages, domain, paid tools) are outside the price and shown on the quote.
8. **Friends earn for referrals.** 10% of the client's first payment, paid when that payment clears. Each friend gets a code, written in the prefilled WhatsApp message, so attribution needs no tracking.

## 4. What friends can and cannot say

**Can say:** what Aksen builds, the prices above, that the call is free, that the examples are illustrations.

**Cannot say:** that we have clients or results in Nigeria, that anything is guaranteed, that AI "runs the business", or any price not in the table.

## 5. Where the kit lives

| Path | What |
| --- | --- |
| `marketing/nigeria-kit/README.md` | How to use and rebuild the kit |
| `marketing/nigeria-kit/config.mjs` | Prices, WhatsApp number, link (currently aksen-labs.bishoptewogbade.workers.dev). Change it here when the domain arrives |
| `marketing/nigeria-kit/captions.md` | Captions for WhatsApp, Instagram, TikTok and the friend share message |
| `marketing/nigeria-kit/out/` | Finished images, by format |
| `video/src/compositions/NaijaShowcase.tsx` | The industry reels and the offer reel |
| `video/out/nigeria/` | Rendered videos |
| `video/public/generated/ng-*.png` | Generated illustrations, with provenance in the manifest |
