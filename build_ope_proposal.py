import sys
from pathlib import Path
from datetime import date

# Import existing design helpers from build_client_documents
from build_client_documents import (
    setup_document,
    add_cover,
    add_kicker,
    heading,
    body,
    callout,
    add_table,
    list_item,
    page,
    ASSETS,
    OUT,
    OBSIDIAN,
    FOREST,
    EMERALD,
    PALE,
    LINE,
    font,
    rgb,
)

TFS_DOCS = Path(r"C:\Users\HP\Desktop\Side Hustle\The-Frame-Shop\docs")

def build_proposal():
    doc, bullets, numbers = setup_document(
        "The Frame Shop — Digital Infrastructure & AI Sales Growth Proposal",
        "E-commerce flagship, dual-journey experience & 24/7 AI WhatsApp sales concierge",
        "The Frame Shop / Proposal",
        preset="compact",
    )

    # 1. Cover Page
    add_cover(
        doc,
        "The Frame Shop",
        "Digital Flagship, Dual-Journey Commerce & 24/7 AI WhatsApp Sales Concierge",
        "Opeoluwa, Founder — The Frame Shop, TFS Gallery & Ope's Decor Haul",
        "September 2026",
        image_path=ASSETS / "aksen-hero-green-v2.png",
        note="Confidential Commercial Proposal • Prepared by Aksen Labs",
    )

    # 2. Executive Summary & The Problem
    page(doc)
    add_kicker(doc, "Executive Summary")
    heading(doc, "From manual WhatsApp backlog to 24/7 digital flagship", 1)
    body(
        doc,
        "Across @theframe_shop, @tfs_gallery, and @decors_store, you have built an engaged community of over 62,000 followers and established a reputation as one of Lagos's premier wall framing and decor destinations. Yet today, all commercial demand funnels into a single WhatsApp number (+234 816 857 2880), creating a manual bottleneck where staff must answer every size query, quote request, and payment confirmation."
    )
    callout(
        doc,
        "The Core Challenge",
        "Customer enquiries arriving at 10 PM or on weekends wait hours for a reply, resulting in lost sales. High-ticket hotel commissions sit in the exact same chat backlog as ₦15,000 ornament enquiries."
    )

    heading(doc, "The integrated solution", 2)
    for item in [
        "One unified web flagship under The Frame Shop, folding in all three brands while preserving your Instagram feeds.",
        "Two tailored buyer journeys: an instant retail Shop (decor, art, frames with card checkout) and a bespoke Projects Studio (hotel/interior designer portfolios and quote requests).",
        "24/7 AI WhatsApp Sales Concierge: instantly replies day or night, shares product links, answers sizing questions, and sends secure Paystack payment links in chat.",
        "Self-serve admin dashboard allowing Ope and her team to manage inventory, view orders, and update project installations.",
    ]:
        list_item(doc, item, bullets)

    # 3. Two Journeys & AI Concierge Detail
    page(doc)
    add_kicker(doc, "System Architecture")
    heading(doc, "Two distinct journeys for two distinct buyers", 1)
    add_table(
        doc,
        ["Journey", "Target Audience", "Customer Motion", "Payment / Fulfilment"],
        [
            ("01. The Retail Shop", "Individual decor buyers, gifts, home art", "Browse catalogue, select frame size & finish, instant mobile checkout", "Instant card/transfer checkout via Paystack / Flutterwave"),
            ("02. Projects Studio", "Hotels, short-lets, interior designers, architects", "Browse installation gallery, view material specs, structured quote request", "Direct consultation, bespoke invoicing & scoped installation"),
        ],
        [2200, 2200, 2500, 2460],
        font_size=9.0,
    )

    heading(doc, "The 24/7 AI WhatsApp Sales Concierge", 2)
    body(
        doc,
        "Running on your official WhatsApp business number, the AI concierge handles high-frequency repetitive tasks without losing the personal touch of your brand:"
    )
    for item in [
        "Sub-10-second response time 24 hours a day, 7 days a week.",
        "Understands your frame catalogue, sizes (e.g. 36x70 inch), finishes, and pricing rules.",
        "Generates secure Paystack payment links right inside the chat for customers ready to buy.",
        "Smooth hand-off: routes complex custom commissions and VIP hotel inquiries to human staff with a summarized brief.",
    ]:
        list_item(doc, item, bullets)

    # 4. Investment & Packages
    page(doc)
    add_kicker(doc, "Commercial Options")
    heading(doc, "Founding Partner package options", 1)
    body(
        doc,
        "As a Founding Client and flagship partner for Aksen Labs in Lagos, the packages below reflect a 50% to 58% reduction from our standard commercial agency rates in exchange for a verified post-launch case study."
    )

    add_table(
        doc,
        ["Deliverable / Feature", "01. Shopfront", "02. Shopfront + Projects (Recommended)", "03. Whole Operation"],
        [
            ("E-commerce Storefront (Paystack)", "Yes", "Yes", "Yes"),
            ("Self-serve Admin Dashboard", "Yes", "Yes", "Yes"),
            ("Projects Portfolio & Quote Flow", "No", "Yes", "Yes"),
            ("All 3 Brands Folded In", "The Frame Shop only", "All Three Brands", "All Three Brands"),
            ("AI WhatsApp Sales Concierge", "Basic FAQ & Handoff", "Full Sales & Payment Links", "Full Sales & Payment Links"),
            ("Internal Staff AI Copilot", "No", "No", "Yes"),
            ("Standard Agency Price", "₦650,000", "₦950,000", "₦1,250,000"),
            ("Founding Partner Rate", "₦280,000", "₦420,000", "₦580,000"),
            ("Delivery Schedule", "4–5 weeks", "6–7 weeks", "8–10 weeks"),
        ],
        [3200, 2000, 2260, 1900],
        font_size=8.8,
    )

    callout(
        doc,
        "Clear Unit Economics",
        "A single 36x70 frame retails at ₦85,000. Package 02 (₦420,000) pays for itself completely with just 5 frames sold. Capturing just 2 late-night orders a month that would have gone cold covers this investment immediately."
    )

    heading(doc, "Ongoing Care & Peace of Mind", 2)
    add_table(
        doc,
        ["Care Tier", "Monthly Fee", "What is Included"],
        [
            ("Post-Launch Warranty", "FREE (First 30 Days)", "Included in build: live monitoring, early transaction review, prompt fine-tuning"),
            ("Essential Care (Partner Rate)", "₦35,000 / month", "High-speed cloud hosting, SSL, daily backups, up to 500 AI conversations/mo, 1 hr updates"),
            ("Growth Care", "₦65,000 / month", "Up to 1,500 AI conversations/mo, weekly conversation reviews, prompt tuning, 3 hrs updates"),
        ],
        [2400, 2200, 4760],
        font_size=8.9,
    )
    body(
        doc,
        "Note: ₦35,000/month is less than half the salary of a junior store assistant, while delivering a tireless 24/7 sales agent that works weekends, midnight hours, and public holidays."
    )

    # 5. Roadmap, Terms & Sign-off
    page(doc)
    add_kicker(doc, "Implementation & Sign-off")
    heading(doc, "Milestones, commercial terms and approval", 1)
    add_table(
        doc,
        ["Stage", "Timing", "Deliverables", "Client Gate"],
        [
            ("1. Intake & Design", "Weeks 1–2", "Catalogue taxonomy, photo intake, brand palette, wireframes", "Content handover & design approval"),
            ("2. Build & Integrations", "Weeks 3–4", "Storefront build, Paystack checkout, WhatsApp API & AI training", "Internal testing & staging feedback"),
            ("3. Review & Training", "Weeks 5–6", "Mobile walkthrough, test card transactions, staff orientation", "Sign-off on live staging"),
            ("4. Go Live", "Week 7", "Public domain connection, live payments, 30-day warranty starts", "Handover milestone balance (50%)"),
        ],
        [1800, 1200, 3660, 2700],
        font_size=8.8,
    )

    heading(doc, "Commercial terms", 2)
    for item in [
        "Payment terms: 50% deposit to initiate work; 50% balance upon handover (defined strictly as the site being live on domain and processing test card payments).",
        "Zero hidden markups: Third-party domain (~₦12,000/yr) and Paystack transaction fees (1.5% capped at ₦2,000) are paid directly to providers.",
        "Founding Partner commitment: Ope agrees to participate in a brief 3-month performance review and permits Aksen Labs to feature the build in its client portfolio.",
    ]:
        list_item(doc, item, bullets)

    heading(doc, "Confirmation of engagement", 2)
    add_table(
        doc,
        ["Client (The Frame Shop)", "Aksen Labs"],
        [
            ("Name: Opeoluwa", "Name: ______________________________"),
            ("Title: Founder & Creative Director", "Title: Lead Partner"),
            ("Signature: ___________________________", "Signature: ___________________________"),
            ("Date: _______________________________", "Date: _______________________________"),
        ],
        [4680, 4680],
        font_size=9.5,
        header_fill=OBSIDIAN,
    )
    callout(doc, "Proposal Validity", "This founding partner proposal is valid until 25 September 2026.")

    OUT.mkdir(parents=True, exist_ok=True)
    out_path1 = OUT / "The-Frame-Shop-Client-Proposal.docx"
    doc.save(out_path1)

    TFS_DOCS.mkdir(parents=True, exist_ok=True)
    out_path2 = TFS_DOCS / "The-Frame-Shop-Client-Proposal.docx"
    doc.save(out_path2)

    print(f"Generated successfully:\n  {out_path1}\n  {out_path2}")
    return out_path1, out_path2

if __name__ == "__main__":
    build_proposal()
