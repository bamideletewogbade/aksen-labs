from pathlib import Path
from datetime import date

from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.section import WD_SECTION
from docx.oxml import OxmlElement
from docx.oxml.ns import qn


ROOT = Path(r"C:\Users\HP\Desktop\Side Hustle\Aksen-Labs")
YOUTH_ROOT = Path(r"C:\Users\HP\Desktop\Side Hustle\Youth Alive")
ASSETS = ROOT / "assets"
OUT = ROOT / "Client Materials"
YOUTH_OUT = YOUTH_ROOT / "Proposal"

OBSIDIAN = "050806"
GRAPHITE = "111A14"
SIGNAL = "7CFF62"
EMERALD = "125F38"
FOREST = "173D2A"
IVORY = "F4F7F4"
WHITE = "FFFFFF"
MUTED = "66736B"
PALE = "EAF7EF"
PALE_GRAY = "F2F4F7"
LINE = "D7DED9"
INK = "17201A"
AMBER = "B7791F"

PAGE_WIDTH_DXA = 9360
TABLE_INDENT_DXA = 120


def rgb(value):
    return RGBColor.from_string(value)


def font(run, name="Arial", size=None, color=None, bold=None, italic=None):
    run.font.name = name
    rpr = run._element.get_or_add_rPr()
    rpr.rFonts.set(qn("w:ascii"), name)
    rpr.rFonts.set(qn("w:hAnsi"), name)
    if size is not None:
        run.font.size = Pt(size)
    if color:
        run.font.color.rgb = rgb(color)
    if bold is not None:
        run.bold = bold
    if italic is not None:
        run.italic = italic


def set_repeat_header(row):
    trpr = row._tr.get_or_add_trPr()
    header = OxmlElement("w:tblHeader")
    header.set(qn("w:val"), "true")
    trpr.append(header)


def set_cell_margins(cell, top=110, start=130, bottom=110, end=130):
    tcpr = cell._tc.get_or_add_tcPr()
    tcmar = tcpr.first_child_found_in("w:tcMar")
    if tcmar is None:
        tcmar = OxmlElement("w:tcMar")
        tcpr.append(tcmar)
    for side, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tcmar.find(qn(f"w:{side}"))
        if node is None:
            node = OxmlElement(f"w:{side}")
            tcmar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def shade(cell, fill):
    tcpr = cell._tc.get_or_add_tcPr()
    shd = tcpr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tcpr.append(shd)
    shd.set(qn("w:fill"), fill)


def borders(table, color=LINE, size=5):
    tblpr = table._tbl.tblPr
    el = tblpr.find(qn("w:tblBorders"))
    if el is None:
        el = OxmlElement("w:tblBorders")
        tblpr.append(el)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        node = el.find(qn(f"w:{edge}"))
        if node is None:
            node = OxmlElement(f"w:{edge}")
            el.append(node)
        node.set(qn("w:val"), "single")
        node.set(qn("w:sz"), str(size))
        node.set(qn("w:space"), "0")
        node.set(qn("w:color"), color)


def geometry(table, widths, indent=TABLE_INDENT_DXA):
    table.autofit = False
    tblpr = table._tbl.tblPr
    tblw = tblpr.find(qn("w:tblW"))
    if tblw is None:
        tblw = OxmlElement("w:tblW")
        tblpr.append(tblw)
    tblw.set(qn("w:w"), str(sum(widths)))
    tblw.set(qn("w:type"), "dxa")
    tblind = tblpr.find(qn("w:tblInd"))
    if tblind is None:
        tblind = OxmlElement("w:tblInd")
        tblpr.append(tblind)
    tblind.set(qn("w:w"), str(indent))
    tblind.set(qn("w:type"), "dxa")
    grid = table._tbl.tblGrid
    for child in list(grid):
        grid.remove(child)
    for width in widths:
        col = OxmlElement("w:gridCol")
        col.set(qn("w:w"), str(width))
        grid.append(col)
    for row in table.rows:
        cant_split = OxmlElement("w:cantSplit")
        row._tr.get_or_add_trPr().append(cant_split)
        for idx, cell in enumerate(row.cells):
            tcpr = cell._tc.get_or_add_tcPr()
            tcw = tcpr.find(qn("w:tcW"))
            if tcw is None:
                tcw = OxmlElement("w:tcW")
                tcpr.append(tcw)
            tcw.set(qn("w:w"), str(widths[idx]))
            tcw.set(qn("w:type"), "dxa")
            set_cell_margins(cell)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER


def page_number(paragraph):
    run = paragraph.add_run()
    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = "PAGE"
    separate = OxmlElement("w:fldChar")
    separate.set(qn("w:fldCharType"), "separate")
    display = OxmlElement("w:t")
    display.text = "1"
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    run._r.extend([begin, instr, separate, display, end])
    font(run, size=9, color=MUTED)


def add_numbering(doc):
    numbering = doc.part.numbering_part.element
    ids = [int(x.get(qn("w:abstractNumId"))) for x in numbering.findall(qn("w:abstractNum"))]
    abstract_bullet_id = max(ids + [0]) + 1
    abstract_num_id = abstract_bullet_id + 1

    def abstract(abstract_id, numfmt, text, left=540, hanging=280):
        node = OxmlElement("w:abstractNum")
        node.set(qn("w:abstractNumId"), str(abstract_id))
        multi = OxmlElement("w:multiLevelType")
        multi.set(qn("w:val"), "singleLevel")
        node.append(multi)
        lvl = OxmlElement("w:lvl")
        lvl.set(qn("w:ilvl"), "0")
        start = OxmlElement("w:start")
        start.set(qn("w:val"), "1")
        fmt = OxmlElement("w:numFmt")
        fmt.set(qn("w:val"), numfmt)
        txt = OxmlElement("w:lvlText")
        txt.set(qn("w:val"), text)
        jc = OxmlElement("w:lvlJc")
        jc.set(qn("w:val"), "left")
        ppr = OxmlElement("w:pPr")
        tabs = OxmlElement("w:tabs")
        tab = OxmlElement("w:tab")
        tab.set(qn("w:val"), "num")
        tab.set(qn("w:pos"), str(left))
        tabs.append(tab)
        ind = OxmlElement("w:ind")
        ind.set(qn("w:left"), str(left))
        ind.set(qn("w:hanging"), str(hanging))
        spacing = OxmlElement("w:spacing")
        spacing.set(qn("w:after"), "80")
        spacing.set(qn("w:line"), "290")
        spacing.set(qn("w:lineRule"), "auto")
        ppr.extend([tabs, ind, spacing])
        lvl.extend([start, fmt, txt, jc, ppr])
        if numfmt == "bullet":
            rpr = OxmlElement("w:rPr")
            fonts = OxmlElement("w:rFonts")
            fonts.set(qn("w:ascii"), "Arial")
            fonts.set(qn("w:hAnsi"), "Arial")
            rpr.append(fonts)
            lvl.append(rpr)
        node.append(lvl)
        numbering.append(node)

    def instance(abstract_id):
        nums = [int(x.get(qn("w:numId"))) for x in numbering.findall(qn("w:num"))]
        num_id = max(nums + [0]) + 1
        num = OxmlElement("w:num")
        num.set(qn("w:numId"), str(num_id))
        aid = OxmlElement("w:abstractNumId")
        aid.set(qn("w:val"), str(abstract_id))
        num.append(aid)
        numbering.append(num)
        return num_id

    abstract(abstract_bullet_id, "bullet", "•")
    abstract(abstract_num_id, "decimal", "%1.")
    return instance(abstract_bullet_id), instance(abstract_num_id)


def list_item(doc, text, num_id, bold_prefix=None):
    p = doc.add_paragraph()
    p.style = doc.styles["List Body"]
    ppr = p._p.get_or_add_pPr()
    numpr = OxmlElement("w:numPr")
    ilvl = OxmlElement("w:ilvl")
    ilvl.set(qn("w:val"), "0")
    numid = OxmlElement("w:numId")
    numid.set(qn("w:val"), str(num_id))
    numpr.extend([ilvl, numid])
    ppr.append(numpr)
    if bold_prefix and text.startswith(bold_prefix):
        r = p.add_run(bold_prefix)
        font(r, bold=True)
        r = p.add_run(text[len(bold_prefix):])
        font(r)
    else:
        r = p.add_run(text)
        font(r)
    return p


def setup_document(title, subtitle, running_label, preset="narrative"):
    doc = Document()
    sec = doc.sections[0]
    sec.page_width = Inches(8.5)
    sec.page_height = Inches(11)
    sec.top_margin = Inches(0.82)
    sec.bottom_margin = Inches(0.78)
    sec.left_margin = Inches(1)
    sec.right_margin = Inches(1)
    sec.header_distance = Inches(0.4)
    sec.footer_distance = Inches(0.4)

    styles = doc.styles
    normal = styles["Normal"]
    normal.font.name = "Arial"
    normal._element.rPr.rFonts.set(qn("w:ascii"), "Arial")
    normal._element.rPr.rFonts.set(qn("w:hAnsi"), "Arial")
    normal.font.size = Pt(10.7)
    normal.font.color.rgb = rgb(INK)
    normal.paragraph_format.space_after = Pt(7 if preset == "narrative" else 5)
    normal.paragraph_format.line_spacing = 1.24 if preset == "narrative" else 1.16

    if "List Body" not in [s.name for s in styles]:
        list_body = styles.add_style("List Body", WD_STYLE_TYPE.PARAGRAPH)
        list_body.base_style = normal
    else:
        list_body = styles["List Body"]
    list_body.font.name = "Arial"
    list_body._element.rPr.rFonts.set(qn("w:ascii"), "Arial")
    list_body._element.rPr.rFonts.set(qn("w:hAnsi"), "Arial")
    list_body.font.size = Pt(10.5)
    list_body.font.color.rgb = rgb(INK)
    list_body.paragraph_format.space_after = Pt(4)
    list_body.paragraph_format.line_spacing = 1.208

    for name, size, before, after, color in (
        ("Title", 30, 0, 7, OBSIDIAN),
        ("Subtitle", 13.5, 0, 18, MUTED),
        ("Heading 1", 18, 16, 9, EMERALD),
        ("Heading 2", 13.5, 11, 6, FOREST),
        ("Heading 3", 11.5, 8, 4, EMERALD),
    ):
        st = styles[name]
        st.font.name = "Arial"
        st._element.rPr.rFonts.set(qn("w:ascii"), "Arial")
        st._element.rPr.rFonts.set(qn("w:hAnsi"), "Arial")
        st.font.size = Pt(size)
        st.font.color.rgb = rgb(color)
        st.font.bold = name != "Subtitle"
        st.paragraph_format.space_before = Pt(before)
        st.paragraph_format.space_after = Pt(after)
        st.paragraph_format.keep_with_next = True

    if "Kicker" not in [s.name for s in styles]:
        st = styles.add_style("Kicker", WD_STYLE_TYPE.PARAGRAPH)
    else:
        st = styles["Kicker"]
    st.font.name = "Arial"
    st._element.rPr.rFonts.set(qn("w:ascii"), "Arial")
    st._element.rPr.rFonts.set(qn("w:hAnsi"), "Arial")
    st.font.size = Pt(9)
    st.font.bold = True
    st.font.color.rgb = rgb(EMERALD)
    st.paragraph_format.space_after = Pt(5)

    header = sec.header
    p = header.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r = p.add_run(running_label.upper())
    font(r, size=8.5, color=MUTED, bold=True)
    footer = sec.footer
    p = footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r = p.add_run("AKSEN LABS  /  ")
    font(r, size=8.5, color=MUTED, bold=True)
    page_number(p)

    bullet_id, decimal_id = add_numbering(doc)
    doc.core_properties.title = title
    doc.core_properties.subject = subtitle
    doc.core_properties.author = "Aksen Labs"
    doc.core_properties.keywords = "Aksen Labs, proposal, AI, digital systems"
    return doc, bullet_id, decimal_id


def add_kicker(doc, text, align=WD_ALIGN_PARAGRAPH.LEFT):
    p = doc.add_paragraph(style="Kicker")
    p.alignment = align
    r = p.add_run(text.upper())
    font(r, size=9, color=EMERALD, bold=True)
    return p


def add_cover(doc, title, subtitle, prepared_for, date_text, image_path=None, note=None):
    add_kicker(doc, "Aksen Labs", WD_ALIGN_PARAGRAPH.CENTER)
    p = doc.add_paragraph(style="Title")
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.add_run(title)
    p = doc.add_paragraph(style="Subtitle")
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.add_run(subtitle)
    if image_path and image_path.exists():
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(14)
        p.add_run().add_picture(str(image_path), width=Inches(6.5))
    t = doc.add_table(rows=3, cols=2)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    geometry(t, [2050, 7310])
    borders(t, color=LINE, size=4)
    data = [("Prepared for", prepared_for), ("Prepared by", "Aksen Labs"), ("Date", date_text)]
    for idx, (label, value) in enumerate(data):
        shade(t.cell(idx, 0), PALE)
        for cell in t.rows[idx].cells:
            cell.paragraphs[0].paragraph_format.space_after = Pt(0)
        r = t.cell(idx, 0).paragraphs[0].add_run(label.upper())
        font(r, size=8.5, color=EMERALD, bold=True)
        r = t.cell(idx, 1).paragraphs[0].add_run(value)
        font(r, size=10.5, color=INK, bold=idx == 0)
    if note:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(11)
        r = p.add_run(note)
        font(r, size=9.5, color=MUTED, italic=True)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(16)
    r = p.add_run("FROM ATTENTION TO ACTION.")
    font(r, size=10, color=EMERALD, bold=True)


def callout(doc, label, text, fill=PALE):
    t = doc.add_table(rows=1, cols=1)
    geometry(t, [PAGE_WIDTH_DXA])
    borders(t, color=LINE, size=4)
    shade(t.cell(0, 0), fill)
    p = t.cell(0, 0).paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    r = p.add_run(label.upper() + "  ")
    font(r, size=8.8, color=EMERALD, bold=True)
    r = p.add_run(text)
    font(r, size=10.4, color=INK, bold=True)
    doc.add_paragraph().paragraph_format.space_after = Pt(1)


def add_table(doc, headers, rows, widths, font_size=9.3, header_fill=FOREST, header_color=WHITE):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    geometry(table, widths)
    borders(table)
    set_repeat_header(table.rows[0])
    for idx, header in enumerate(headers):
        shade(table.cell(0, idx), header_fill)
        p = table.cell(0, idx).paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(header)
        font(r, size=8.6, color=header_color, bold=True)
    for row_idx, row in enumerate(rows):
        cells = table.add_row().cells
        if row_idx % 2 == 1:
            for c in cells:
                shade(c, "F8FAF8")
        for idx, value in enumerate(row):
            p = cells[idx].paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run(str(value))
            font(r, size=font_size, color=INK, bold=(idx == 0))
    geometry(table, widths)
    return table


def page(doc):
    doc.add_page_break()


def heading(doc, text, level=1):
    return doc.add_paragraph(text, style=f"Heading {level}")


def body(doc, text, bold_lead=None):
    p = doc.add_paragraph()
    if bold_lead and text.startswith(bold_lead):
        r = p.add_run(bold_lead)
        font(r, bold=True)
        r = p.add_run(text[len(bold_lead):])
        font(r)
    else:
        r = p.add_run(text)
        font(r)
    return p


def build_youth_alive():
    doc, bullets, numbers = setup_document(
        "Youth Alive Digital Showcase Proposal",
        "High-converting business website, project gallery and WhatsApp lead system",
        "Youth Alive / Digital Showcase Proposal",
        preset="narrative",
    )
    add_cover(
        doc,
        "Digital Showcase & Customer Enquiry System",
        "A fast, high-converting digital presence and mobile showcase for Youth Alive",
        "Youth Alive",
        "3 September 2026",
        image_path=ASSETS / "aksen-hero-green-v2.png",
        note="Commercial proposal • Valid for 14 days",
    )

    page(doc)
    add_kicker(doc, "The opportunity")
    heading(doc, "Turn every enquiry into a confirmed job", 1)
    body(doc, "Youth Alive delivers quality craftsmanship across modern woodwork, aluminium windows and doors, glass and panelling works, graviano wall installations, and deep cleaning services. The proposed digital system gives Youth Alive a credible, professional mobile showcase so potential clients can explore completed work, trust your expertise, and connect with you instantly on WhatsApp or phone.")
    callout(doc, "Recommended direction", "Launch a high-impact business website with an organized project gallery, smart WhatsApp quick-connect triggers, and a callback enquiry system.")
    heading(doc, "What the system will achieve", 2)
    for item in [
        "Present Youth Alive as a credible, established nationwide home-improvement and finishing specialist.",
        "Showcase real completed projects across woodwork, aluminium, glass, graviano, and cleaning in a clean mobile gallery.",
        "Enable potential clients to reach Youth Alive instantly on WhatsApp with pre-filled service details.",
        "Capture customer project descriptions, locations, and preferred callback windows when they need quotes.",
        "Eliminate friction and missed leads from potential high-value residential and commercial clients.",
        "Maintain full human control over site inspections, pricing, and project commitments.",
    ]:
        list_item(doc, item, bullets)
    heading(doc, "Authentic project showcase", 2)
    body(doc, "Real Youth Alive job-site photography will be front and center. Any illustrative concept visuals will be clearly separated and will never be represented as finished client installations.")

    page(doc)
    add_kicker(doc, "Customer experience")
    heading(doc, "The 5-step customer journey", 1)
    steps = [
        ("1. Discover", "A prospective client arrives from Google search, social media, a shared recommendation, or your business flyer."),
        ("2. Explore", "They view your 5 core services (Woodwork, Aluminium, Glass, Graviano, Cleaning), project photos, and proof of quality."),
        ("3. Trigger WhatsApp", "They tap a service-specific WhatsApp button (e.g., 'Inquire about Aluminium Windows') with pre-filled text ready to send."),
        ("4. Request Callback", "Alternatively, they submit a simple 30-second callback form with their project type, location, and preferred contact time."),
        ("5. Direct Connection", "Youth Alive receives the enquiry details immediately and follows up directly to quote and close the project."),
    ]
    add_table(doc, ["Stage", "Customer experience"], steps, [2000, 7360], font_size=9.6)
    heading(doc, "Website structure", 2)
    for item in [
        "Hero Header: Strong professional promise, key services summary, and immediate WhatsApp action.",
        "5 Core Service Sections: Modern Woodwork; Aluminium Windows & Doors; Glass & Panelling; Graviano Installation; Deep Cleaning.",
        "Project Showcase: Organized photo gallery highlighting completed residential and commercial work.",
        "Why Choose Youth Alive: Nationwide service coverage, skilled craftsmanship, and customer trust points.",
        "Request-a-Callback & Quote Form: Fast mobile form capturing service, location, and customer contact.",
        "Direct Contact Footer: Verified phone numbers (0595050199 / 05819636), email, social handles, and privacy notice.",
    ]:
        list_item(doc, item, bullets)

    page(doc)
    add_kicker(doc, "Selectable packages")
    heading(doc, "Practical options built for quick results", 1)
    add_table(
        doc,
        ["Package", "Best for", "Core result", "Delivery"],
        [
            ("01 Fast-Track Digital Profile", "Fast launch & mobile brochure", "Single-page showcase, 5 services, WhatsApp connect & callback form", "7–10 days"),
            ("02 Smart Business Launchpad", "Complete website + AI Concierge (Recommended)", "Multi-section site, 5-service portfolio, AI web assistant, WhatsApp routing & 30-day care", "10–14 days"),
        ],
        [2400, 2100, 3400, 1460],
        font_size=9.1,
    )
    callout(doc, "Recommended selection", "Package 02: Smart Business Launchpad provides a complete digital showcase for all 5 services with an intelligent 24/7 AI enquiry concierge capped at your GHS 1,500 budget.")
    heading(doc, "Included in both packages", 2)
    for item in [
        "Mobile-first responsive design engineered for fast loading on Ghanaian mobile networks.",
        "Complete presentation of Youth Alive's 5 core service offerings.",
        "Direct WhatsApp quick-connect buttons with pre-configured greeting messages.",
        "Request-a-callback lead capture form with instant email notification.",
        "Fully managed turnkey cloud hosting and SSL security setup.",
        "30-day post-launch support and defect warranty.",
    ]:
        list_item(doc, item, bullets)

    page(doc)
    add_kicker(doc, "Package detail")
    heading(doc, "01 — Fast-Track Digital Profile", 1)
    body(doc, "An immediate, professional online profile designed to establish credibility and capture WhatsApp leads.")
    for item in [
        "High-impact single-page responsive mobile brochure.",
        "Overview of all 5 services: Modern Woodwork, Aluminium, Glass, Graviano, and Deep Cleaning.",
        "Curated project photo gallery featuring your best completed work.",
        "One-tap WhatsApp button with pre-written inquiry message for instant chats.",
        "Simple callback request form capturing client name, phone, service needed, and location.",
        "Google Maps location integration and verified social media links.",
    ]:
        list_item(doc, item, bullets)
    heading(doc, "02 — Smart Business Launchpad (Recommended)", 1)
    body(doc, "A comprehensive multi-section business website with an intelligent customer concierge that elevates Youth Alive as a premier contractor.")
    for item in [
        "Everything in Fast-Track Digital Profile, plus:",
        "Dedicated showcase sections for each of the 5 core services with detailed descriptions and benefits.",
        "Expanded categorized project gallery with before-and-after photo presentation.",
        "24/7 English AI Website Concierge: Answers customer FAQs instantly, explains service offerings, collects project details (type, location, timing), and transfers leads directly to WhatsApp.",
        "Service-specific WhatsApp buttons (pre-identifies whether the client wants woodwork, aluminium, glass, graviano, or cleaning).",
        "Local SEO setup and Google Business Profile guidance so nearby clients find you on Google.",
        "Custom domain configuration and high-performance cloud hosting setup.",
        "30 days of included post-launch updates, minor text/photo adjustments, and a walkthrough session.",
    ]:
        list_item(doc, item, bullets)
    heading(doc, "Safe AI operating guardrails", 2)
    body(doc, "The integrated AI concierge communicates strictly in professional English and operates within defined guardrails: it provides helpful guidance and collects project specifications, but never issues binding quotations or contract promises without human inspection by the Youth Alive team.")

    page(doc)
    add_kicker(doc, "Investment")
    heading(doc, "Family & Friends Partner Pricing", 1)
    body(doc, "The partner rates below reflect a private relationship discount from Aksen Labs. Standard commercial values are shown for transparency; the discounted partner rate is the final proposed project investment for Youth Alive.")
    add_table(
        doc,
        ["Package", "Standard price", "Partner rate", "Saving"],
        [
            ("01 Fast-Track Digital Profile", "GHS 2,200", "GHS 850", "GHS 1,350"),
            ("02 Smart Business Launchpad — Recommended", "GHS 5,000", "GHS 1,500", "GHS 3,500"),
        ],
        [3900, 1820, 1820, 1820],
        font_size=9.4,
    )
    callout(doc, "Transparent value", "Package 02 delivers a complete commercial website and 24/7 AI enquiry concierge valued at GHS 5,000 for a one-time partner fee of GHS 1,500 (over 70% savings).")
    heading(doc, "Ongoing hosting and maintenance", 2)
    add_table(
        doc,
        ["Plan", "Standard", "Partner rate", "Includes"],
        [
            ("Essential Cloud & AI Care", "GHS 250/mo", "GHS 150/mo", "Cloud hosting oversight, SSL security, uptime monitoring, AI concierge operation, minor text/photo updates"),
            ("Quarterly Care Option", "GHS 700/qtr", "GHS 400/qtr", "Same as Essential Care, billed quarterly (save GHS 50/quarter)"),
            ("On-Demand Updates", "GHS 120/hr", "GHS 80/hr", "Pay-as-you-go assistance for major new pages, redesigns, or special campaigns"),
        ],
        [2300, 1550, 1650, 3860],
        font_size=8.8,
    )
    body(doc, "Both packages include a complimentary 30-day warranty and support period following launch. Domain registration/annual renewal (~GHS 150–200/yr) and any third-party external services are transparent and billed at exact cost without markup. All prices exclude applicable taxes.")

    page(doc)
    add_kicker(doc, "Delivery plan")
    heading(doc, "Fast, straightforward implementation", 1)
    add_table(
        doc,
        ["Stage", "Timing", "Main deliverables"],
        [
            ("1. Intake & content", "Days 1–3", "Collect project photos, confirm service descriptions, verify phone numbers and contact details"),
            ("2. Design & build", "Days 4–8", "Build mobile-friendly showcase, configure service sections, gallery, WhatsApp triggers, and callback form"),
            ("3. Review & feedback", "Days 9–11", "Youth Alive reviews live demo preview on mobile; fine-tune wording, images, and contact buttons"),
            ("4. Launch & handover", "Days 12–14", "Connect domain, configure cloud hosting, verify form notifications, and publish live"),
            ("5. 30-Day support", "Post-launch", "Complimentary defect warranty, minor adjustments, and initial performance check"),
        ],
        [1850, 1450, 6060],
        font_size=9.1,
    )
    heading(doc, "Youth Alive provides", 2)
    for item in [
        "One primary contact for timely feedback and launch approval.",
        "Confirmed service details, working phone numbers (0595050199 / 05819636), and business location.",
        "Photos of completed woodwork, aluminium, glass, graviano, and cleaning projects.",
    ]:
        list_item(doc, item, bullets)
    heading(doc, "Aksen Labs provides", 2)
    for item in [
        "End-to-end design, development, cloud setup, mobile optimization, and testing.",
        "Clean integration of WhatsApp click-to-chat triggers and callback lead capture.",
        "Managed turnkey hosting deployment and 30-day post-launch support.",
    ]:
        list_item(doc, item, bullets)

    page(doc)
    add_kicker(doc, "Commercial terms")
    heading(doc, "Scope, terms and intellectual property", 1)
    terms = [
        ("Payment schedule", "60% deposit to commence development and secure cloud infrastructure; 40% balance upon preview approval and public launch."),
        ("Turnkey managed solution", "The website is delivered as a fully hosted and managed digital service by Aksen Labs, ensuring reliability, speed, and security without requiring technical effort from Youth Alive."),
        ("Proprietary code & ownership", "All underlying source code, design architecture, frameworks, and reusable components remain the exclusive intellectual property of Aksen Labs. Youth Alive owns all brand assets, trademarks, project photography, customer enquiry data, and published text. Source code is not transferred or licensed for standalone distribution."),
        ("Review allowance", "Includes up to two consolidated rounds of feedback during the preview stage to ensure complete satisfaction before going live."),
        ("Warranty", "Thirty days of complimentary post-launch support covering any bug fixes, display issues, or minor text adjustments."),
        ("Exclusions", "Professional on-site video/photo crews, paid digital advertising, physical print materials, and complex e-commerce or custom software modules are excluded unless quoted separately."),
    ]
    add_table(doc, ["Item", "Term"], terms, [2100, 7260], font_size=9.2)
    heading(doc, "Operational guidelines", 2)
    for item in [
        "Customer enquiries submitted through the callback form or WhatsApp are directed straight to Youth Alive's designated staff.",
        "Youth Alive remains solely responsible for site visits, final price estimates, contract negotiations, and service fulfillment.",
        "Clear, accurate project representations protect Youth Alive's market reputation and build long-term client trust.",
    ]:
        list_item(doc, item, bullets)

    page(doc)
    add_kicker(doc, "Next step")
    heading(doc, "Confirm your selection to begin", 1)
    body(doc, "Select your preferred package below. We will immediately set up your digital project environment and begin organizing your service showcases.")
    add_table(
        doc,
        ["Selection", "Package", "Partner rate"],
        [
            ("☐", "01 Fast-Track Digital Profile", "GHS 850"),
            ("☐", "02 Complete Business Launchpad — Recommended", "GHS 1,500"),
        ],
        [1350, 5360, 2650],
        font_size=10.0,
    )
    heading(doc, "Authorisation", 2)
    body(doc, "Signing below confirms acceptance of the proposed scope, partner pricing, and turnkey delivery terms.")
    add_table(
        doc,
        ["Youth Alive representative", "Aksen Labs representative"],
        [
            ("Name: ______________________________", "Name: ______________________________"),
            ("Signature: ___________________________", "Signature: ___________________________"),
            ("Date: _______________________________", "Date: _______________________________"),
        ],
        [4680, 4680],
        font_size=9.7,
        header_fill=OBSIDIAN,
    )
    callout(doc, "Proposal validity", "Partner pricing and schedule are valid until 17 September 2026.")

    YOUTH_OUT.mkdir(parents=True, exist_ok=True)
    path = YOUTH_OUT / "Youth-Alive-Digital-Growth-Proposal.docx"
    doc.save(path)
    return path


def build_service_guide():
    doc, bullets, numbers = setup_document(
        "Aksen Labs Services & Pricing Guide",
        "Indicative services, packages and commercial model",
        "Services & Pricing Guide",
        preset="compact",
    )
    add_cover(
        doc,
        "Services & Pricing Guide",
        "Practical AI, digital experiences, creative systems and managed operations",
        "Prospective clients and partners",
        "September 2026",
        image_path=ASSETS / "aksen-hero-green-v2.png",
        note="Indicative commercial guide • Final scope and pricing follow discovery",
    )

    page(doc)
    add_kicker(doc, "Aksen Labs")
    heading(doc, "From attention to action", 1)
    body(doc, "Aksen Labs helps businesses and creators turn customer conversations, content, knowledge, and repetitive work into controlled, measurable outcomes. We begin with a bounded business problem, build the smallest useful system, keep people in control where consequences matter, and improve the workflow using real evidence.")
    callout(doc, "Positioning", "Aksen sits between low-cost generic bots and slow enterprise transformation: one accountable partner for strategy, design, implementation, governance, and improvement.")
    heading(doc, "Three outcome pillars", 2)
    add_table(
        doc,
        ["Pillar", "What we help clients do", "Typical work"],
        [
            ("Convert", "Turn enquiries and demand into qualified next steps", "Websites, AI concierge, WhatsApp, lead capture, follow-up workflows"),
            ("Create", "Turn knowledge and ideas into approved creative output", "Campaign concepts, content systems, image/video workflows, brand-safe production"),
            ("Operate", "Turn repetitive workflows into controlled intelligent systems", "Automation, internal copilots, knowledge systems, approvals, reporting"),
        ],
        [1500, 3550, 4310],
        font_size=9.2,
    )
    heading(doc, "How pricing works", 2)
    for item in [
        "Published figures are indicative starting points or ranges in Ghana cedis.",
        "A final proposal defines deliverables, assumptions, external costs, milestones, and acceptance criteria.",
        "Third-party model, WhatsApp, voice, email, storage, hosting, and licensed-data usage is separated or governed by an approved allowance.",
        "Taxes, travel, hardware, paid media, production crews, and specialist licences are excluded unless stated.",
    ]:
        list_item(doc, item, bullets)

    page(doc)
    add_kicker(doc, "Digital experiences")
    heading(doc, "Websites and customer journeys", 1)
    add_table(
        doc,
        ["Service", "Indicative fee", "Typical scope", "Typical timing"],
        [
            ("Landing Page / Campaign Site", "GHS 6,500–10,000", "One focused conversion journey, responsive build, form, analytics and launch", "2–3 weeks"),
            ("Business Website", "GHS 10,000–18,000", "Core pages, services, proof, CMS-ready content structure, forms, analytics and basic SEO", "3–5 weeks"),
            ("Growth Website", "GHS 18,000–35,000", "Advanced journeys, content collections, lead qualification, integrations and performance reporting", "4–7 weeks"),
            ("Portal / Web Application", "From GHS 30,000", "Authentication, data workflows, dashboards, permissions and custom product logic", "Scoped"),
        ],
        [2250, 1800, 3650, 1660],
        font_size=8.7,
    )
    heading(doc, "Common add-ons", 2)
    for item in [
        "Copy refinement and information architecture: from GHS 2,500.",
        "Multilingual content structure: from GHS 3,500 per additional language, excluding specialist translation.",
        "Advanced analytics and conversion instrumentation: from GHS 3,000.",
        "Client content migration beyond the agreed allowance: scoped by volume and condition.",
    ]:
        list_item(doc, item, bullets)

    page(doc)
    add_kicker(doc, "AI customer experience")
    heading(doc, "Concierge, qualification and channel systems", 1)
    add_table(
        doc,
        ["Offer", "Indicative fee", "Buyer receives"],
        [
            ("AI Opportunity Sprint", "GHS 5,000–12,000", "Workflow map, baseline, risks, data plan, pilot boundary, controls and success measures"),
            ("Productized Website Assistant", "GHS 8,000–20,000 add-on", "Approved knowledge, FAQ support, guided qualification, lead summary, testing and human handoff"),
            ("Official WhatsApp AI Extension", "GHS 8,000–20,000 add-on", "Official channel integration, guided flows, approved templates, handoff and monitoring setup"),
            ("Focused AI Pilot", "GHS 20,000–60,000", "One bounded workflow, evaluation, controls, integration, training and four-to-six-week launch support"),
            ("Multi-workflow Transformation", "GHS 60,000–250,000+", "Connected agents, systems integration, governance, training, change management and roadmap"),
        ],
        [2600, 2120, 4640],
        font_size=8.8,
    )
    callout(doc, "Human control", "Aksen assistants do not silently invent commitments. Consequential prices, approvals, payments, public messages, and customer promises remain subject to defined human control.")
    heading(doc, "Examples", 2)
    for item in [
        "Property and hospitality concierge systems.",
        "Customer-service and sales qualification assistants.",
        "WhatsApp enquiry and callback workflows.",
        "Internal knowledge copilots and guided staff operations.",
    ]:
        list_item(doc, item, bullets)

    page(doc)
    add_kicker(doc, "Automation and operations")
    heading(doc, "Connected workflows that move work forward", 1)
    add_table(
        doc,
        ["Service", "Indicative fee", "Typical result"],
        [
            ("Workflow Automation", "GHS 15,000–50,000", "A controlled process connecting forms, email, CRM, documents, notifications or reporting"),
            ("Internal AI Copilot", "GHS 20,000–65,000", "Approved knowledge, structured tools, permissions, evaluation and staff-facing experience"),
            ("Lead & Delivery Operations", "GHS 20,000–70,000", "Pipeline, handoffs, project states, notifications, reporting and selected integrations"),
            ("Data / Reporting Layer", "GHS 12,000–45,000", "Defined metrics, data connections, dashboards, alerts and operating review"),
        ],
        [2600, 2100, 4660],
        font_size=9.0,
    )
    heading(doc, "Every production workflow includes", 2)
    for item in [
        "A bounded job, success definition, failure handling, and named owner.",
        "Approved knowledge or data sources with explicit permissions.",
        "Human approval and escalation where the business consequence requires it.",
        "Testing across common, difficult, ambiguous, and failure scenarios.",
        "Basic observability for usage, cost, errors, quality, and outcomes appropriate to scope.",
    ]:
        list_item(doc, item, bullets)

    page(doc)
    add_kicker(doc, "Creative intelligence")
    heading(doc, "Campaign, image, video and content systems", 1)
    add_table(
        doc,
        ["Offer", "Indicative fee", "Typical deliverables"],
        [
            ("Creative Direction Sprint", "GHS 5,000–12,000", "Brief refinement, audience/message, visual territories, references and production plan"),
            ("AI Image Campaign", "GHS 8,000–25,000", "Approved concept, generation, selected retouching, variations, formats and usage record"),
            ("AI-Assisted Video Package", "GHS 12,000–40,000", "Concept, script, storyboard, generated/edited sequence, review and platform adaptations"),
            ("Content Operating System", "GHS 12,000–35,000", "Source intake, voice guide, idea extraction, multi-channel drafts, approvals and publishing packages"),
            ("Managed Creative Studio", "From GHS 6,000/mo", "Agreed monthly brief, production allowance, review rhythm and performance learning"),
        ],
        [2500, 2060, 4800],
        font_size=8.8,
    )
    body(doc, "Final creative cost depends on asset count, complexity, identity continuity, retouching, voice/music rights, specialist editing, paid-media versions, and production requirements. Generated people, products, claims, likenesses, and sensitive scenarios require explicit review and appropriate disclosure.")

    page(doc)
    add_kicker(doc, "Managed services")
    heading(doc, "Support, monitoring and continuous improvement", 1)
    add_table(
        doc,
        ["Plan", "Indicative fee", "Best for", "Typical coverage"],
        [
            ("Website Care", "From GHS 900/mo", "Business websites", "Monitoring, backups, minor updates and technical support allowance"),
            ("AI Care", "From GHS 1,500/mo", "Productized assistants", "Website care plus knowledge updates, response monitoring and monthly review"),
            ("Managed Agent Operations", "GHS 4,000–18,000/mo", "Operational AI workflows", "Evaluation, incident support, cost/quality review, improvements and reporting"),
            ("Transformation Partner", "Custom retainer", "Multiple teams and workflows", "Roadmap, governance, delivery leadership, change management and portfolio review"),
        ],
        [2300, 1900, 2100, 3060],
        font_size=8.6,
    )
    heading(doc, "Service-level details are agreed per engagement", 2)
    for item in [
        "Support hours, response targets, included change allowance, reporting cadence, and escalation contacts.",
        "Approved model and channel budgets, overage treatment, and cost alerts.",
        "Knowledge owners, update process, incident handling, retention, and access review.",
    ]:
        list_item(doc, item, bullets)

    page(doc)
    add_kicker(doc, "Engagement model")
    heading(doc, "From first conversation to measurable operation", 1)
    add_table(
        doc,
        ["Stage", "Purpose", "Exit gate"],
        [
            ("1. Qualify", "Confirm need, urgency, owner, budget range and current workflow", "Discovery is worth both parties’ time"),
            ("2. Discover", "Map workflow, baseline, users, systems, risks and success", "Problem and pilot boundary are agreed"),
            ("3. Propose", "Define scope, deliverables, exclusions, price, responsibilities and controls", "Approved agreement and payment trigger"),
            ("4. Design & build", "Create the experience, tools, content, data connections and test cases", "Acceptance criteria can be tested"),
            ("5. Evaluate & approve", "Review quality, safety, failure handling and human control", "Named owner approves release"),
            ("6. Launch & observe", "Release, support, measure, learn and prioritize improvements", "Stable operation and outcome review"),
        ],
        [1900, 4000, 3460],
        font_size=8.9,
    )
    heading(doc, "Standard commercial defaults", 2)
    for item in [
        "Projects typically use milestone payments, commonly 50% / 30% / 20% unless scope suggests another structure.",
        "Two consolidated review rounds per major stage are normally included.",
        "New requirements are handled through written change control before work begins.",
        "Aksen retains reusable methods, platform components, and pre-existing intellectual property; project-specific ownership is defined in the final agreement.",
        "This guide is not a quotation, service-level agreement, or binding offer.",
    ]:
        list_item(doc, item, bullets)

    page(doc)
    add_kicker(doc, "Start here")
    heading(doc, "Choose the smallest engagement that can prove value", 1)
    body(doc, "The strongest first engagement is specific enough to measure and valuable enough to matter. Aksen Labs will recommend a practical starting point after a short qualification conversation.")
    add_table(
        doc,
        ["If you need…", "Recommended first step"],
        [
            ("A credible digital presence and better enquiries", "Business Website or Growth Website"),
            ("Faster answers and structured customer qualification", "Productized Website Assistant"),
            ("A serious workflow problem with unclear scope", "AI Opportunity Sprint"),
            ("Proof that one AI workflow can operate safely", "Focused AI Pilot"),
            ("Ongoing quality, cost and improvement ownership", "Managed Agent Operations"),
            ("A repeatable campaign or content production system", "Creative Direction Sprint or Content Operating System"),
        ],
        [4300, 5060],
        font_size=9.4,
    )
    callout(doc, "Next action", "Request a discovery conversation and receive a tailored proposal with scope, milestones, assumptions, and final pricing.")
    heading(doc, "Contact placeholders", 2)
    body(doc, "Email: [AKSEN EMAIL]   •   Phone/WhatsApp: [AKSEN NUMBER]   •   Web: [AKSEN WEBSITE]")
    body(doc, "Aksen Labs is currently a working business name pending final registry, trademark, and domain clearance. Replace the placeholders and confirm legal/commercial details before public distribution.")

    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / "Aksen-Labs-Services-and-Pricing-Guide.docx"
    doc.save(path)
    return path


def build_proposal_template():
    doc, bullets, numbers = setup_document(
        "Aksen Labs Client Proposal Template",
        "Reusable commercial proposal structure",
        "Client Proposal Template",
        preset="narrative",
    )
    add_cover(
        doc,
        "[PROJECT OR OUTCOME TITLE]",
        "[One-line description of the proposed business outcome]",
        "[CLIENT NAME]",
        "[DATE]",
        image_path=ASSETS / "aksen-hero-green-v2.png",
        note="Proposal reference: [AKSEN-YYYY-###] • Valid until [DATE]",
    )

    page(doc)
    add_kicker(doc, "Proposal summary")
    heading(doc, "[A clear outcome-focused headline]", 1)
    body(doc, "[Write two short paragraphs describing the client’s current situation, why the problem matters now, and the result this engagement is designed to create. Use client language from discovery and avoid generic AI claims.]")
    callout(doc, "Recommendation", "[State the recommended package or engagement, the primary result, and why this is the right starting point.]")
    heading(doc, "Success outcomes", 2)
    for item in [
        "[Outcome 1 — observable business or customer improvement]",
        "[Outcome 2 — measurable speed, quality, conversion, cost, or control improvement]",
        "[Outcome 3 — useful operating capability delivered to the client team]",
    ]:
        list_item(doc, item, bullets)
    heading(doc, "What is not being promised", 2)
    body(doc, "[Record important boundaries early: for example, no binding quotations by an assistant, no unsupported automation, no guaranteed performance result, or no direct booking in release one.]")

    page(doc)
    add_kicker(doc, "Proposed solution")
    heading(doc, "Scope and customer experience", 1)
    heading(doc, "Primary journey", 2)
    for item in [
        "[Step 1 — customer or staff trigger]",
        "[Step 2 — information or interaction]",
        "[Step 3 — system decision or assistance]",
        "[Step 4 — human approval or handoff]",
        "[Step 5 — completed business outcome and measurement]",
    ]:
        list_item(doc, item, numbers)
    heading(doc, "Included deliverables", 2)
    for item in [
        "[Deliverable with quantity, platform, or acceptance condition]",
        "[Deliverable with quantity, platform, or acceptance condition]",
        "[Testing, training, documentation, launch, and support deliverables]",
    ]:
        list_item(doc, item, bullets)
    heading(doc, "Assumptions", 2)
    for item in [
        "[Client access, content, data, decision-maker, or platform assumption]",
        "[External approval, provider, policy, or dependency assumption]",
        "[Volume, language, user, location, or integration assumption]",
    ]:
        list_item(doc, item, bullets)

    page(doc)
    add_kicker(doc, "Selectable packages")
    heading(doc, "Options designed around the client’s priorities", 1)
    add_table(
        doc,
        ["Package", "Best for", "Included", "Timeline", "Fee"],
        [
            ("01 [FOUNDATION]", "[Need]", "[Concise deliverables]", "[X weeks]", "GHS [ ]"),
            ("02 [RECOMMENDED]", "[Need]", "[Foundation plus higher-value capability]", "[X–Y weeks]", "GHS [ ]"),
            ("03 [COMPLETE]", "[Need]", "[Recommended plus advanced channels/integration]", "[X–Y weeks]", "GHS [ ]"),
        ],
        [1700, 1600, 2900, 1400, 1760],
        font_size=8.9,
    )
    callout(doc, "Recommended option", "[Package name] at GHS [price], because [brief evidence-based reason].")
    heading(doc, "Optional add-ons", 2)
    add_table(
        doc,
        ["Add-on", "Fee", "Notes"],
        [
            ("[Add-on 1]", "GHS [ ]", "[Scope / allowance]"),
            ("[Add-on 2]", "GHS [ ]", "[Scope / allowance]"),
            ("[Add-on 3]", "GHS [ ]", "[Scope / allowance]"),
        ],
        [3500, 1800, 4060],
        font_size=9.5,
    )

    page(doc)
    add_kicker(doc, "Delivery")
    heading(doc, "Timeline, responsibilities and acceptance", 1)
    add_table(
        doc,
        ["Stage", "Timing", "Aksen output", "Client input / gate"],
        [
            ("1. Discovery", "[ ]", "[Map, requirements, risks, success measures]", "[Decision-maker, access, approved direction]"),
            ("2. Design", "[ ]", "[Journey, wireframes, architecture, content structure]", "[Consolidated approval]"),
            ("3. Build", "[ ]", "[Configured solution and integrations]", "[Content, access, test users]"),
            ("4. Evaluate", "[ ]", "[Test results, fixes, training, launch checklist]", "[Acceptance owner approves]"),
            ("5. Launch", "[ ]", "[Production release and support]", "[Final payment and launch approval]"),
        ],
        [1700, 1100, 3270, 3290],
        font_size=8.8,
    )
    heading(doc, "Acceptance criteria", 2)
    for item in [
        "[Functional criterion with a clear test]",
        "[Content/data accuracy criterion and owner]",
        "[Performance, usability, or channel criterion]",
        "[Training, handover, or documentation criterion]",
    ]:
        list_item(doc, item, bullets)

    page(doc)
    add_kicker(doc, "Investment")
    heading(doc, "Commercial summary", 1)
    add_table(
        doc,
        ["Item", "Fee", "Billing trigger"],
        [
            ("Selected package: [NAME]", "GHS [ ]", "[50% / 30% / 20% or agreed milestones]"),
            ("Optional add-ons", "GHS [ ]", "[Trigger]"),
            ("Recurring support", "GHS [ ] / month", "[Start date and billing cycle]"),
            ("External usage allowance", "GHS [ ]", "[Allowance and approved overage treatment]"),
        ],
        [3900, 2200, 3260],
        font_size=9.3,
    )
    heading(doc, "Pricing note", 2)
    body(doc, "[State whether fees include or exclude taxes. Identify third-party platform, model, messaging, voice, storage, data, travel, production, paid-media, or licence costs. If showing a discount, name the standard price, discounted price, discount reason, and expiry without weakening Aksen’s normal value.]")
    heading(doc, "Ongoing support", 2)
    body(doc, "[Define support hours, response targets, included change allowance, reporting cadence, knowledge updates, monitoring, and escalation. Avoid promising an SLA that has not been operationally approved.]")

    page(doc)
    add_kicker(doc, "Terms")
    heading(doc, "Scope controls and commercial assumptions", 1)
    rows = [
        ("Payment", "[Deposit, milestone schedule, currency, taxes and late-payment treatment]"),
        ("Start condition", "[Payment, access, content and decision-maker requirements]"),
        ("Review rounds", "[Number of consolidated rounds and response window]"),
        ("Change control", "[How new requirements are estimated, approved and scheduled]"),
        ("Warranty", "[Defect period and distinction between defects and enhancements]"),
        ("Ownership", "[Project-specific deliverables, reusable Aksen IP, third-party components and licences]"),
        ("Privacy and security", "[Data categories, permissions, retention, credentials and client responsibilities]"),
        ("Exclusions", "[Explicitly list work that is not included]"),
        ("Validity", "[Proposal expiry and capacity condition]"),
    ]
    add_table(doc, ["Item", "Agreed position"], rows, [2050, 7310], font_size=9.1)
    heading(doc, "AI-specific controls, if applicable", 2)
    for item in [
        "[Approved knowledge sources and owner]",
        "[Human approval / escalation points]",
        "[Prohibited claims or actions]",
        "[Evaluation, monitoring, disclosure, consent and retention approach]",
    ]:
        list_item(doc, item, bullets)

    page(doc)
    add_kicker(doc, "Approval")
    heading(doc, "Confirm the selected direction", 1)
    add_table(
        doc,
        ["Selection", "Package", "Fee"],
        [
            ("☐", "[Option 01]", "GHS [ ]"),
            ("☐", "[Option 02 — Recommended]", "GHS [ ]"),
            ("☐", "[Option 03]", "GHS [ ]"),
        ],
        [1300, 5500, 2560],
        font_size=10.0,
    )
    body(doc, "By signing, both parties confirm their intention to proceed subject to the final agreement, invoice, and any stated conditions.")
    add_table(
        doc,
        ["Client", "Aksen Labs"],
        [
            ("Name: ______________________________", "Name: ______________________________"),
            ("Title: _______________________________", "Title: _______________________________"),
            ("Signature: ___________________________", "Signature: ___________________________"),
            ("Date: _______________________________", "Date: _______________________________"),
        ],
        [4680, 4680],
        font_size=9.5,
        header_fill=OBSIDIAN,
    )
    callout(doc, "Internal reminder", "Remove all bracketed instructions and placeholders, confirm the client’s legal name, check every price and date, then export a clean PDF before sending.", fill="FFF5E6")

    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / "Aksen-Labs-Client-Proposal-Template.docx"
    doc.save(path)
    return path


if __name__ == "__main__":
    paths = [build_youth_alive(), build_service_guide(), build_proposal_template()]
    for path in paths:
        print(path)
