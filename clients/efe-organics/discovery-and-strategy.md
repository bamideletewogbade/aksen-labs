# Discovery & Strategy: Efe Organics

**Client:** Efe Organics ("Life & Organics")  
**HQ:** Accra, Ghana  
**Industry:** Organic Skincare & Haircare Formulation (African Black Soap, Shea Butter, Botanical Extracts)  
**Established:** 2012  

---

## 1. The Commercial Opportunity

Efe Organics is an established artisanal cosmetics brand with high organic retention and proven formulations. However, the business suffered from severe distribution and technology bottlenecks:

1. **Rented Distribution (ColoursBay Dependency)**:
   - The brand possessed no direct digital storefront. Products were sold exclusively through a third-party reseller (`coloursbay.com`), meaning customer relationships, behavioral data, and margin were being siphoned.
   - The reseller’s catalog structure was disorganized: 22 products were arbitrarily lumped into a generic `bodycare` bucket while `african-black-soap` held only 2 items. Slugs were duplicated (`bodycare` vs `body-care`).
2. **Mobile Money Dominance in Ghana**:
   - Skincare and personal care shopping in Accra is overwhelmingly mobile-first, transacted via MTN Mobile Money and Telecel Cash.
   - Without an automated Paystack MoMo integration, prospective buyers were forced into manual WhatsApp back-and-forth, causing significant cart abandonment during peak evening and weekend browsing.
3. **Wholesale vs. Retail Concurrency**:
   - Efe serves both individual consumers buying 350ml bath gels (GH₵70.00) and industrial formulators ordering **250kg Raw African Black Soap Crumble** (`GH₵13,750.00`).
   - These two channels require distinct presentation, checkout requirements, and stock accounting.

---

## 2. Brand Repositioning & Design Strategy

Aksen Labs rebuilt the brand's digital identity from its authentic 2026 circular gold packaging monogram:

- **Color Harmony**:
  - `Obsidian` (`#0d0d0e`): Authentic black plate from the monogram, replacing generic muddy forest greens.
  - `Gold` (`#7a5d27` shadow to `#c9a84c` mid to `#f0e5b9` highlight): Premium signaling reflecting African craftsmanship.
  - `Olive` (`#607a1b`): Derived directly from the tea leaf in the logo artwork.
  - `Paper` (`#f7f6f2`): Warm editorial backdrop ensuring WCAG AA contrast for readability on mobile screens.
- **Mobile-First UX**:
  - Target audience browses on mid-range Android devices over 3G/4G cellular networks.
  - Heavy video banners and bulky JavaScript libraries are replaced by CSS-first hardware-accelerated animations and AVIF/WebP image compression.

---

## 3. Transformation Blueprint

```
ColoursBay Reseller (Disorganized 42 SKUs)
       │
       ▼  Aksen Scrape & Curation Engine
Normalized Relational Model (28 Products, 42 Variants)
       │
       ▼  Next.js 16 Storefront on Vercel
Direct Ghanaian MoMo Checkout (Paystack) + Live Stock Ledger
       │
       ▼  Phase 4 & 5 Roadmap
AI WhatsApp Skincare Agent + Blotato Marketing Automation
```
