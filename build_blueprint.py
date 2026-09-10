from pathlib import Path
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.section import WD_SECTION_START
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.shape import WD_INLINE_SHAPE
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(r"C:\Users\HP\Desktop\Side Hustle\Aksen-Labs")
ASSETS = ROOT / "assets"
OUT = ROOT / "Aksen-Labs-Business-Blueprint-v0.4.docx"

OBSIDIAN = "050806"
GRAPHITE = "111A14"
SIGNAL_GREEN = "7CFF62"
EMERALD = "1E8F5A"
TEXT_GREEN = "125F38"
GOLD = TEXT_GREEN
CYAN = TEXT_GREEN
IVORY = "F4F7F4"
SLATE = "9CA9A0"
PALE_GOLD = "EEFFE9"
PALE_CYAN = "EAF7EF"
PALE_GRAY = "F2F4F7"
WHITE = "FFFFFF"
GREEN = "2DAE78"
RED = "B54747"


def create_signal_diagram():
    path = ASSETS / "aksen-signal-loop-v2.png"
    width, height = 1800, 520
    image = Image.new("RGB", (width, height), "#050806")
    draw = ImageDraw.Draw(image)
    font_path = r"C:\Windows\Fonts\arial.ttf"
    bold_path = r"C:\Windows\Fonts\arialbd.ttf"
    label_font = ImageFont.truetype(bold_path, 36)
    small_font = ImageFont.truetype(font_path, 24)
    nodes = [
        ("ATTENTION", "message or idea"),
        ("UNDERSTAND", "intent and context"),
        ("DECIDE", "policy and next step"),
        ("ACT", "tool or workflow"),
        ("OUTCOME", "completed result"),
        ("LEARN", "signal for improvement"),
    ]
    xs = [155, 455, 755, 1055, 1355, 1655]
    y = 245
    for index in range(len(xs) - 1):
        draw.line((xs[index] + 48, y, xs[index + 1] - 48, y), fill="#1E8F5A", width=8)
        draw.polygon([(xs[index + 1] - 54, y - 12), (xs[index + 1] - 32, y), (xs[index + 1] - 54, y + 12)], fill="#7CFF62")
    for index, (title, detail) in enumerate(nodes):
        x = xs[index]
        draw.ellipse((x - 42, y - 42, x + 42, y + 42), fill="#111A14", outline="#7CFF62", width=6)
        draw.ellipse((x - 12, y - 12, x + 12, y + 12), fill="#7CFF62")
        title_box = draw.textbbox((0, 0), title, font=label_font)
        draw.text((x - (title_box[2] - title_box[0]) / 2, y - 118), title, font=label_font, fill="#F4F7F4")
        detail_box = draw.textbbox((0, 0), detail, font=small_font)
        draw.text((x - (detail_box[2] - detail_box[0]) / 2, y + 72), detail, font=small_font, fill="#9CA9A0")
    draw.line((155, 410, 1655, 410), fill="#243028", width=2)
    draw.text((155, 438), "One green signal moves through a calm monochrome system. Motion communicates state, not decoration.", font=small_font, fill="#9CA9A0")
    image.save(path, quality=95)
    return path


def create_control_diagram():
    path = ASSETS / "aksen-human-control-v2.png"
    width, height = 1800, 650
    image = Image.new("RGB", (width, height), "#F4F7F4")
    draw = ImageDraw.Draw(image)
    font_path = r"C:\Windows\Fonts\arial.ttf"
    bold_path = r"C:\Windows\Fonts\arialbd.ttf"
    title_font = ImageFont.truetype(bold_path, 38)
    body_font = ImageFont.truetype(font_path, 28)
    cards = [
        (90, "LOW RISK", "Agent completes\nautomatically", "#7CFF62"),
        (630, "MEDIUM RISK", "Agent prepares\nHuman approves", "#B7E8A9"),
        (1170, "HIGH RISK", "Human takes over\nwith full context", "#DDE5DF"),
    ]
    for x, title, body, fill in cards:
        draw.rounded_rectangle((x, 110, x + 450, 520), radius=36, fill=fill, outline="#243028", width=4)
        draw.text((x + 42, 165), title, font=title_font, fill="#050806")
        draw.multiline_text((x + 42, 260), body, font=body_font, fill="#111A14", spacing=18)
        draw.ellipse((x + 42, 415, x + 78, 451), fill="#1E8F5A")
        draw.line((x + 98, 433, x + 390, 433), fill="#1E8F5A", width=5)
    draw.text((90, 45), "HUMAN CONTROL IS PART OF THE PRODUCT", font=title_font, fill="#050806")
    image.save(path, quality=95)
    return path


def rgb(hex_color):
    return RGBColor.from_string(hex_color)


def set_run_font(run, name="Calibri", size=None, color=None, bold=None, italic=None):
    run.font.name = name
    run._element.get_or_add_rPr().rFonts.set(qn("w:ascii"), name)
    run._element.get_or_add_rPr().rFonts.set(qn("w:hAnsi"), name)
    if size is not None:
        run.font.size = Pt(size)
    if color is not None:
        run.font.color.rgb = rgb(color)
    if bold is not None:
        run.bold = bold
    if italic is not None:
        run.italic = italic


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_margins(cell, top=80, start=120, bottom=80, end=120):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for m, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{m}"))
        if node is None:
            node = OxmlElement(f"w:{m}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_table_geometry(table, widths_dxa, indent_dxa=120):
    table.autofit = False
    tbl_pr = table._tbl.tblPr
    tbl_w = tbl_pr.find(qn("w:tblW"))
    if tbl_w is None:
        tbl_w = OxmlElement("w:tblW")
        tbl_pr.append(tbl_w)
    tbl_w.set(qn("w:w"), str(sum(widths_dxa)))
    tbl_w.set(qn("w:type"), "dxa")
    tbl_ind = tbl_pr.find(qn("w:tblInd"))
    if tbl_ind is None:
        tbl_ind = OxmlElement("w:tblInd")
        tbl_pr.append(tbl_ind)
    tbl_ind.set(qn("w:w"), str(indent_dxa))
    tbl_ind.set(qn("w:type"), "dxa")
    grid = table._tbl.tblGrid
    for child in list(grid):
        grid.remove(child)
    for width in widths_dxa:
        col = OxmlElement("w:gridCol")
        col.set(qn("w:w"), str(width))
        grid.append(col)
    for row in table.rows:
        tr_pr = row._tr.get_or_add_trPr()
        cant_split = tr_pr.find(qn("w:cantSplit"))
        if cant_split is None:
            tr_pr.append(OxmlElement("w:cantSplit"))
        for idx, cell in enumerate(row.cells):
            tc_pr = cell._tc.get_or_add_tcPr()
            tc_w = tc_pr.find(qn("w:tcW"))
            if tc_w is None:
                tc_w = OxmlElement("w:tcW")
                tc_pr.append(tc_w)
            tc_w.set(qn("w:w"), str(widths_dxa[idx]))
            tc_w.set(qn("w:type"), "dxa")
            set_cell_margins(cell)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER


def set_table_borders(table, color="D9DEE5", size=6):
    tbl_pr = table._tbl.tblPr
    borders = tbl_pr.find(qn("w:tblBorders"))
    if borders is None:
        borders = OxmlElement("w:tblBorders")
        tbl_pr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = borders.find(qn(f"w:{edge}"))
        if tag is None:
            tag = OxmlElement(f"w:{edge}")
            borders.append(tag)
        tag.set(qn("w:val"), "single")
        tag.set(qn("w:sz"), str(size))
        tag.set(qn("w:space"), "0")
        tag.set(qn("w:color"), color)


def set_repeat_table_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)


def set_keep_with_next(paragraph, value=True):
    paragraph.paragraph_format.keep_with_next = value


def add_page_number(paragraph):
    run = paragraph.add_run()
    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = "PAGE"
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    run._r.append(begin)
    run._r.append(instr)
    run._r.append(end)
    set_run_font(run, size=9, color=SLATE)


def add_hyperlink(paragraph, text, url, color=CYAN):
    part = paragraph.part
    r_id = part.relate_to(url, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink", is_external=True)
    hyperlink = OxmlElement("w:hyperlink")
    hyperlink.set(qn("r:id"), r_id)
    new_run = OxmlElement("w:r")
    r_pr = OxmlElement("w:rPr")
    c = OxmlElement("w:color")
    c.set(qn("w:val"), color)
    r_pr.append(c)
    u = OxmlElement("w:u")
    u.set(qn("w:val"), "single")
    r_pr.append(u)
    new_run.append(r_pr)
    text_node = OxmlElement("w:t")
    text_node.text = text
    new_run.append(text_node)
    hyperlink.append(new_run)
    paragraph._p.append(hyperlink)


def add_alt_text(inline_shape, title, description):
    doc_pr = inline_shape._inline.docPr
    doc_pr.set("title", title)
    doc_pr.set("descr", description)


def add_numbering_definitions(doc):
    numbering = doc.part.numbering_part.element
    abstract_ids = [int(e.get(qn("w:abstractNumId"))) for e in numbering.findall(qn("w:abstractNum"))]
    num_ids = [int(e.get(qn("w:numId"))) for e in numbering.findall(qn("w:num"))]
    next_abs = max(abstract_ids + [0]) + 1
    next_num = max(num_ids + [0]) + 1

    def make_num(abstract_id, num_id, fmt, text, font=None):
        abstract = OxmlElement("w:abstractNum")
        abstract.set(qn("w:abstractNumId"), str(abstract_id))
        multi = OxmlElement("w:multiLevelType")
        multi.set(qn("w:val"), "singleLevel")
        abstract.append(multi)
        lvl = OxmlElement("w:lvl")
        lvl.set(qn("w:ilvl"), "0")
        start = OxmlElement("w:start")
        start.set(qn("w:val"), "1")
        lvl.append(start)
        num_fmt = OxmlElement("w:numFmt")
        num_fmt.set(qn("w:val"), fmt)
        lvl.append(num_fmt)
        lvl_text = OxmlElement("w:lvlText")
        lvl_text.set(qn("w:val"), text)
        lvl.append(lvl_text)
        suff = OxmlElement("w:suff")
        suff.set(qn("w:val"), "tab")
        lvl.append(suff)
        p_pr = OxmlElement("w:pPr")
        tabs = OxmlElement("w:tabs")
        tab = OxmlElement("w:tab")
        tab.set(qn("w:val"), "num")
        tab.set(qn("w:pos"), "540")
        tabs.append(tab)
        p_pr.append(tabs)
        ind = OxmlElement("w:ind")
        ind.set(qn("w:left"), "540")
        ind.set(qn("w:hanging"), "280")
        p_pr.append(ind)
        spacing = OxmlElement("w:spacing")
        spacing.set(qn("w:after"), "80")
        spacing.set(qn("w:line"), "290")
        spacing.set(qn("w:lineRule"), "auto")
        p_pr.append(spacing)
        lvl.append(p_pr)
        if font:
            r_pr = OxmlElement("w:rPr")
            fonts = OxmlElement("w:rFonts")
            fonts.set(qn("w:ascii"), font)
            fonts.set(qn("w:hAnsi"), font)
            r_pr.append(fonts)
            lvl.append(r_pr)
        abstract.append(lvl)
        numbering.append(abstract)
        num = OxmlElement("w:num")
        num.set(qn("w:numId"), str(num_id))
        abs_ref = OxmlElement("w:abstractNumId")
        abs_ref.set(qn("w:val"), str(abstract_id))
        num.append(abs_ref)
        numbering.append(num)
        return num_id

    bullet_id = make_num(next_abs, next_num, "bullet", "•", "Arial")
    decimal_id = make_num(next_abs + 1, next_num + 1, "decimal", "%1.")
    return bullet_id, decimal_id


def new_num_instance(doc, base_num_id):
    numbering = doc.part.numbering_part.element
    existing = numbering.findall(qn("w:num"))
    next_num_id = max([int(e.get(qn("w:numId"))) for e in existing] + [0]) + 1
    base = next(e for e in existing if int(e.get(qn("w:numId"))) == int(base_num_id))
    abstract_id = base.find(qn("w:abstractNumId")).get(qn("w:val"))
    num = OxmlElement("w:num")
    num.set(qn("w:numId"), str(next_num_id))
    abs_ref = OxmlElement("w:abstractNumId")
    abs_ref.set(qn("w:val"), abstract_id)
    num.append(abs_ref)
    numbering.append(num)
    return next_num_id


def apply_num(paragraph, num_id):
    p_pr = paragraph._p.get_or_add_pPr()
    num_pr = p_pr.find(qn("w:numPr"))
    if num_pr is None:
        num_pr = OxmlElement("w:numPr")
        p_pr.append(num_pr)
    ilvl = OxmlElement("w:ilvl")
    ilvl.set(qn("w:val"), "0")
    num = OxmlElement("w:numId")
    num.set(qn("w:val"), str(num_id))
    num_pr.append(ilvl)
    num_pr.append(num)


SIGNAL_DIAGRAM = create_signal_diagram()
CONTROL_DIAGRAM = create_control_diagram()


doc = Document()
section = doc.sections[0]
section.page_width = Inches(8.5)
section.page_height = Inches(11)
section.top_margin = Inches(1.0)
section.bottom_margin = Inches(1.0)
section.left_margin = Inches(1.0)
section.right_margin = Inches(1.0)
section.header_distance = Inches(0.492)
section.footer_distance = Inches(0.492)

doc.core_properties.title = "Aksen Labs Business Blueprint"
doc.core_properties.subject = "Working strategy, brand, product, go-to-market, and operating blueprint"
doc.core_properties.author = "Aksen Labs"
doc.core_properties.keywords = "agentic AI, Ghana, creators, marketing, business transformation"

styles = doc.styles
normal = styles["Normal"]
normal.font.name = "Calibri"
normal._element.rPr.rFonts.set(qn("w:ascii"), "Calibri")
normal._element.rPr.rFonts.set(qn("w:hAnsi"), "Calibri")
normal.font.size = Pt(11)
normal.font.color.rgb = rgb(GRAPHITE)
normal.paragraph_format.space_before = Pt(0)
normal.paragraph_format.space_after = Pt(8)
normal.paragraph_format.line_spacing = 1.333

for style_name, size, color, before, after in (
    ("Heading 1", 16, OBSIDIAN, 18, 10),
    ("Heading 2", 13, OBSIDIAN, 12, 6),
    ("Heading 3", 12, SLATE, 8, 4),
):
    st = styles[style_name]
    st.font.name = "Calibri"
    st._element.rPr.rFonts.set(qn("w:ascii"), "Calibri")
    st._element.rPr.rFonts.set(qn("w:hAnsi"), "Calibri")
    st.font.size = Pt(size)
    st.font.bold = True
    st.font.color.rgb = rgb(color)
    st.paragraph_format.space_before = Pt(before)
    st.paragraph_format.space_after = Pt(after)
    st.paragraph_format.keep_with_next = True

if "Kicker" not in styles:
    kicker = styles.add_style("Kicker", WD_STYLE_TYPE.PARAGRAPH)
else:
    kicker = styles["Kicker"]
kicker.font.name = "Calibri"
kicker.font.size = Pt(9)
kicker.font.bold = True
kicker.font.color.rgb = rgb(GOLD)
kicker.paragraph_format.space_after = Pt(5)
kicker.paragraph_format.keep_with_next = True

bullet_id, decimal_id = add_numbering_definitions(doc)


def add_body(text, bold_lead=None, italic=False, align=None, after=8):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(after)
    p.paragraph_format.line_spacing = 1.333
    if align is not None:
        p.alignment = align
    if bold_lead and text.startswith(bold_lead):
        r1 = p.add_run(bold_lead)
        set_run_font(r1, size=11, color=OBSIDIAN, bold=True)
        r2 = p.add_run(text[len(bold_lead):])
        set_run_font(r2, size=11, color=GRAPHITE, italic=italic)
    else:
        run = p.add_run(text)
        set_run_font(run, size=11, color=GRAPHITE, italic=italic)
    return p


def add_bullets(items):
    for item in items:
        p = doc.add_paragraph()
        apply_num(p, bullet_id)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.208
        r = p.add_run(item)
        set_run_font(r, size=10.7, color=GRAPHITE)


def add_steps(items):
    list_num_id = new_num_instance(doc, decimal_id)
    for item in items:
        p = doc.add_paragraph()
        apply_num(p, list_num_id)
        p.paragraph_format.space_after = Pt(5)
        p.paragraph_format.line_spacing = 1.208
        r = p.add_run(item)
        set_run_font(r, size=10.7, color=GRAPHITE)


def add_callout(label, text, fill=PALE_GOLD, accent=GOLD):
    table = doc.add_table(rows=1, cols=1)
    set_table_geometry(table, [9360], 120)
    set_table_borders(table, accent, 10)
    cell = table.cell(0, 0)
    set_cell_shading(cell, fill)
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing = 1.15
    r = p.add_run(label.upper() + "  ")
    set_run_font(r, size=9, color=accent, bold=True)
    r = p.add_run(text)
    set_run_font(r, size=10.5, color=OBSIDIAN, bold=True)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)


def add_table(headers, rows, widths, header_fill=OBSIDIAN):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.LEFT
    set_table_geometry(table, widths, 120)
    set_table_borders(table, "D9DEE5", 6)
    hdr = table.rows[0]
    set_repeat_table_header(hdr)
    for i, head in enumerate(headers):
        cell = hdr.cells[i]
        set_cell_shading(cell, header_fill)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r = p.add_run(head)
        set_run_font(r, size=9.3, color=WHITE if header_fill == OBSIDIAN else OBSIDIAN, bold=True)
    for r_idx, row in enumerate(rows):
        cells = table.add_row().cells
        for i, value in enumerate(row):
            if r_idx % 2 == 1:
                set_cell_shading(cells[i], "FAFBFC")
            p = cells[i].paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.1
            rr = p.add_run(str(value))
            set_run_font(rr, size=9.2, color=GRAPHITE)
    set_table_geometry(table, widths, 120)
    doc.add_paragraph().paragraph_format.space_after = Pt(1)
    return table


def add_section_title(number, title, subtitle=None):
    p = doc.add_paragraph(style="Kicker")
    p.add_run(f"SECTION {number}")
    h = doc.add_paragraph(title, style="Heading 1")
    if subtitle:
        p2 = doc.add_paragraph()
        p2.paragraph_format.space_after = Pt(12)
        r = p2.add_run(subtitle)
        set_run_font(r, size=11.5, color=SLATE, italic=True)
    return h


def add_picture(path, width=6.5, caption=None, alt_title="", alt_description=""):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.keep_with_next = True
    shape = p.add_run().add_picture(str(path), width=Inches(width))
    add_alt_text(shape, alt_title, alt_description)
    if caption:
        cp = doc.add_paragraph()
        cp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        cp.paragraph_format.space_before = Pt(3)
        cp.paragraph_format.space_after = Pt(10)
        cp.paragraph_format.keep_with_next = False
        rr = cp.add_run(caption)
        set_run_font(rr, size=8.5, color=SLATE, italic=True)


def page_break():
    doc.add_page_break()


# Running header and footer
header = section.header
hp = header.paragraphs[0]
hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
hr = hp.add_run("AKSEN LABS  /  BUSINESS BLUEPRINT")
set_run_font(hr, size=8, color=SLATE, bold=True)

footer = section.footer
ft = footer.add_table(rows=1, cols=2, width=Inches(6.5))
set_table_geometry(ft, [7200, 2160], 0)
for cell in ft.rows[0].cells:
    set_cell_margins(cell, 20, 0, 20, 0)
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = OxmlElement("w:tcBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), "nil")
        borders.append(el)
    tc_pr.append(borders)
lp = ft.cell(0, 0).paragraphs[0]
lr = lp.add_run("Working draft v0.4  |  3 September 2026  |  Confidential")
set_run_font(lr, size=8.5, color=SLATE)
rp = ft.cell(0, 1).paragraphs[0]
rp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
rr = rp.add_run("Page ")
set_run_font(rr, size=8.5, color=SLATE)
add_page_number(rp)


# Cover
p = doc.add_paragraph(style="Kicker")
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.add_run("FOUNDING BUSINESS BLUEPRINT  /  VERSION 0.4")

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_after = Pt(3)
r = p.add_run("AKSEN LABS")
set_run_font(r, size=31, color=OBSIDIAN, bold=True)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_after = Pt(8)
r = p.add_run("From attention to action.")
set_run_font(r, size=15, color=CYAN, bold=True)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_after = Pt(14)
r = p.add_run("Agentic growth systems for businesses and creators")
set_run_font(r, size=11.5, color=SLATE)

add_picture(
    ASSETS / "aksen-hero-green-v2.png",
    6.5,
    "Creative direction: monochrome intelligence activated by green signals in a contemporary Accra business environment.",
    "Aksen Labs hero concept",
    "A Ghanaian woman founder reviews abstract customer and campaign information in a premium dark Accra workspace with restrained green system signals.",
)

add_callout(
    "Founding thesis",
    "Aksen Labs will design and deploy AI agents that help organizations understand customers, create demand, execute workflows, and learn from results while keeping people in control of important decisions.",
    PALE_GOLD,
    GOLD,
)

page_break()


# Document purpose and contents
add_section_title("00", "How to use this blueprint", "A living source of truth for strategy, product, brand, sales, and delivery.")
add_body("This document converts the founding conversation into an operating blueprint. It is intentionally decisive where momentum matters and explicit about assumptions where customer discovery is still required.")
add_callout("Working rule", "Treat this as a decision system, not a sacred document. Update it whenever evidence from customers, product usage, delivery economics, or platform changes invalidates an assumption.", PALE_CYAN, CYAN)

doc.add_paragraph("What this document covers", style="Heading 2")
add_table(
    ["Part", "Purpose"],
    [
        ("Strategy", "Company thesis, mission, positioning, principles, and defensibility"),
        ("Products", "Agent family, initial use cases, customer segments, and demo experiences"),
        ("Brand", "Name, voice, visual system, image direction, and video direction"),
        ("Platform", "Website experience, architecture, data model, trust, and channel strategy"),
        ("Commercial", "Business model, pricing hypotheses, sales motion, delivery, and partnerships"),
        ("Execution", "Roadmap, metrics, risks, open decisions, and the next 30 days"),
    ],
    [1750, 7610],
)

doc.add_paragraph("Current status", style="Heading 2")
add_bullets([
    "Proptis AI Concierge exists as the first working vertical concept and technical proof.",
    "Neon Postgres and OpenRouter form the current prototype foundation.",
    "The commercial relationship with Proptis has not yet been established; outreach remains a next action.",
    "Aksen Labs is a proposed working name, not a completed legal, registry, trademark, or domain clearance.",
    "Creator, marketing, and social-sales products remain hypotheses to validate with real users.",
])

page_break()


# Executive summary
add_section_title("01", "Executive summary", "A focused company with a broad platform underneath.")
add_body("Aksen Labs is an agentic AI growth and operations company. It helps businesses and creators turn incoming attention, customer conversations, content, and internal knowledge into useful actions and measurable outcomes.")
add_body("The company will begin services-first. It will sell discovery, focused pilots, implementation, and managed optimization while building reusable platform components underneath each engagement. This creates early revenue and customer learning without forcing the company to guess its way into a large software product.")
add_callout("Strategic choice", "Real estate is our first wedge, not our identity. Proptis demonstrates the customer-facing concierge pattern. Creator and marketing products prove that the same agent core can work across industries.")

doc.add_paragraph("What Aksen sells", style="Heading 2")
add_bullets([
    "AI Discovery: identify high-value workflows, data requirements, risks, and a practical first pilot.",
    "AI Pilots: deliver one focused, measurable agent in a controlled workflow.",
    "AI Transformation: connect multiple agents, data sources, and teams across a business.",
    "Managed Agent Operations: monitor quality, cost, safety, content, and performance after launch.",
    "Creative Intelligence: generate and operate image, video, and content systems for brands and creators.",
])

doc.add_paragraph("The flywheel", style="Heading 2")
add_callout("Attention -> understanding -> action -> learning", "Every conversation, campaign, workflow, and outcome improves the customer experience and strengthens our reusable agent patterns.", PALE_CYAN, CYAN)

doc.add_paragraph("Near-term objective", style="Heading 2")
add_body("Win the first paying pilot, turn it into credible proof, and use the same platform to launch a second demonstration in creator growth or social sales. The company should not attempt to serve every industry at once. It should demonstrate breadth through product architecture while selling one specific outcome to one specific buyer at a time.")

page_break()


# Company identity
add_section_title("02", "Company identity", "A name and narrative designed to travel beyond one industry.")
doc.add_paragraph("Working company name", style="Heading 2")
add_callout("AKSEN LABS", "Pronounced AK-sen. A coined, action-oriented name designed to suggest signals becoming coordinated action. It is short, global, and not tied to real estate, marketing, or a single technology.", PALE_GOLD, GOLD)

doc.add_paragraph("Naming guardrails", style="Heading 3")
add_bullets([
    "Use Aksen Labs for the company and strategic implementation practice.",
    "Use Aksen as the platform and product prefix, such as Aksen Concierge and Aksen Studio.",
    "Do not finalize incorporation, a public domain, or paid identity work until formal clearance is complete.",
    "Avoid implying that the name has a traditional linguistic meaning; it is intentionally coined.",
])

doc.add_paragraph("Core language", style="Heading 2")
add_table(
    ["Element", "Working language"],
    [
        ("Tagline", "From attention to action."),
        ("Positioning", "Agentic growth systems for businesses and creators."),
        ("One-line pitch", "We build AI agents that understand customers, create demand, execute workflows, and help teams act faster."),
        ("Category", "Agentic AI growth and operations company"),
        ("Primary promise", "Useful business outcomes, not AI theatre."),
    ],
    [2000, 7360],
)

doc.add_paragraph("Mission", style="Heading 2")
add_body("Make advanced AI practical, trusted, and commercially useful for African businesses and creators, then carry the strongest solutions into global markets.")

doc.add_paragraph("Vision", style="Heading 2")
add_body("A future where every ambitious organization can operate with an intelligent layer that understands its customers, knowledge, goals, and workflows without losing human judgment or local context.")

doc.add_paragraph("Operating principles", style="Heading 2")
add_bullets([
    "Outcomes before novelty. A workflow must create value beyond an impressive conversation.",
    "Narrow entry, expandable system. Start with one measurable problem and design for adjacent workflows.",
    "Human control where consequences matter. Approvals, escalation, and auditability are product features.",
    "Official channels over fragile shortcuts. Prefer supported APIs and permission-based integrations.",
    "Earn the right to automate. Observe, assist, approve, and only then automate proven actions.",
    "Local fluency, global quality. Understand African operating realities without limiting the ambition or design standard.",
])

page_break()


# Brand system
add_section_title("03", "Brand and visual system", "Monochrome intelligence activated by green signals.")
add_body("The revised identity is built around black, soft white, deep forest surfaces, and carefully controlled green. Most of the experience remains calm and monochrome. Green appears when the system understands, connects, recommends, acts, or completes something. This makes intelligence visible without creating a gaming, crypto, cybersecurity, or Matrix aesthetic.")

add_callout("Visual principle", "The interface stays quiet until something meaningful happens. Green communicates state, progress, connection, and completion rather than decoration.", PALE_CYAN, TEXT_GREEN)

doc.add_paragraph("Color palette", style="Heading 2")
palette = add_table(
    ["Role", "Color", "Hex", "Use"],
    [
        ("Foundation", "Carbon Black", "#050806", "Primary backgrounds and premium product surfaces"),
        ("Action", "Signal Green", "#7CFF62", "Primary actions, active paths, successful completion"),
        ("Intelligence", "Emerald", "#1E8F5A", "Agent state, connections, data, and system activity"),
        ("Text accent", "Accessible Emerald", "#125F38", "Labels, links, and emphasis on white or pale surfaces"),
        ("Reading", "Soft White", "#F4F7F4", "Editorial backgrounds and long-form content"),
        ("Surface", "Graphite Green", "#111A14", "Cards, navigation, and elevated dark surfaces"),
        ("Support", "Silver Sage", "#9CA9A0", "Metadata, borders, and supporting text"),
    ],
    [1550, 1750, 1450, 4610],
)
for row, color in zip(palette.rows[1:], [OBSIDIAN, SIGNAL_GREEN, EMERALD, TEXT_GREEN, IVORY, GRAPHITE, SLATE]):
    set_cell_shading(row.cells[1], color)
    if color in (OBSIDIAN, EMERALD, TEXT_GREEN, GRAPHITE, SLATE):
        for run in row.cells[1].paragraphs[0].runs:
            run.font.color.rgb = rgb(WHITE)

doc.add_paragraph("Typography", style="Heading 2")
add_bullets([
    "Primary digital type: Geist Sans for navigation, interface controls, body copy, and product UI.",
    "Editorial accent: Instrument Serif for selected campaign phrases, pull quotes, and human moments.",
    "System labels: IBM Plex Mono for agent activity, timestamps, tool names, and technical metadata.",
    "Use the serif and mono faces sparingly so the overall experience remains precise and highly readable.",
])

doc.add_paragraph("Color ratio", style="Heading 2")
add_bullets([
    "Approximately 65 percent carbon black and deep forest surfaces.",
    "Approximately 25 percent soft white and neutral editorial space.",
    "No more than approximately 10 percent signal green and emerald activation.",
    "Signal green is never used for normal-sized text on white or pale-green backgrounds. Accessible Emerald #125F38 is used for those text roles and provides a contrast ratio above 7:1 on Soft White.",
    "Amber may appear only for human approval or caution states. Soft red is reserved for errors and destructive actions.",
])

doc.add_paragraph("Logo direction", style="Heading 2")
add_body("Use a bold lowercase wordmark with a custom A. The A can be constructed from two converging signal paths that create a forward opening. The mark must work completely in black and white. Green becomes an optional digital behavior, such as a pulse moving through the mark, rather than a requirement for recognition. Build the final logo as vector artwork, not an AI-generated raster image.")

doc.add_paragraph("Photography and motion", style="Heading 2")
add_bullets([
    "Show capable people making decisions, serving customers, creating, and collaborating.",
    "Use authentic contemporary African environments without visual stereotypes.",
    "Use carbon-black environments, neutral light, and restrained green system cues while preserving natural skin tones.",
    "Keep interfaces subtle and functional. Avoid robots, glowing brains, Matrix code, and hologram overload.",
    "Use motion to explain cause and effect: message received, context understood, action completed, result learned.",
])

add_picture(
    SIGNAL_DIAGRAM,
    6.5,
    "Signature signal model: one active path turns attention into a measurable learning loop.",
    "Aksen signal model",
    "A dark horizontal workflow connects Attention, Understand, Decide, Act, Outcome, and Learn with a restrained green signal.",
)

page_break()


# Market problem
add_section_title("04", "Problem and opportunity", "The gap is not access to AI. The gap is turning AI into reliable work.")
add_body("Businesses and creators already operate across websites, WhatsApp, social channels, email, calendars, spreadsheets, CRMs, documents, and human memory. The resulting fragmentation produces slow responses, missed leads, inconsistent content, repetitive administration, and weak visibility into what drives revenue.")

doc.add_paragraph("Problems we are built to address", style="Heading 2")
add_table(
    ["Problem", "Operational symptom", "Aksen response"],
    [
        ("Slow customer response", "Enquiries wait for staff or disappear after hours", "Concierge answers, qualifies, captures, and escalates"),
        ("Scattered knowledge", "Teams search messages and documents for basic answers", "Knowledge agent retrieves approved, sourced context"),
        ("Content bottleneck", "One idea takes too long to become a campaign", "Studio repurposes content through an approval workflow"),
        ("Attention without conversion", "Comments and messages do not become pipeline", "Inbox identifies intent and routes qualified opportunities"),
        ("Marketing fragmentation", "Research, production, publishing, and reporting are disconnected", "Campaigns coordinates the workflow and learning loop"),
        ("Repetitive operations", "People copy data and chase routine next steps", "Operations uses tools to complete controlled actions"),
    ],
    [2200, 3200, 3960],
)

doc.add_paragraph("Why now", style="Heading 2")
add_bullets([
    "Language models can now combine natural conversation with structured tool use.",
    "Cloud databases and vector search make company knowledge usable without a separate enterprise stack.",
    "Customers increasingly expect fast, personalized service across channels.",
    "Creators and small teams need operating leverage, not simply more content suggestions.",
    "Businesses need partners who can connect models to real workflows, data, controls, and measurable outcomes.",
])

add_callout("Our opening", "Aksen sits between generic AI tools and expensive enterprise transformation. We combine strategy, product design, implementation, and managed operations in one accountable relationship.", PALE_CYAN, CYAN)

page_break()


# Product architecture
add_section_title("05", "Product family", "A common agent core expressed through focused customer outcomes.")
add_table(
    ["Product", "Job", "Initial proof"],
    [
        ("Aksen Concierge", "Customer support, discovery, qualification, booking, and follow-up", "Proptis property concierge"),
        ("Aksen Studio", "Turn source material into approved content and creative campaigns", "Creator content-to-revenue demo"),
        ("Aksen Campaigns", "Plan, produce, approve, and learn from marketing campaigns", "Brief-to-campaign workspace"),
        ("Aksen Inbox", "Convert comments, messages, and enquiries into qualified opportunities", "Social-sales simulation"),
        ("Aksen Operations", "Use internal knowledge and tools to complete repetitive workflows", "Employee knowledge and action agent"),
        ("Aksen Pulse", "Measure conversations, content, actions, costs, and outcomes", "Cross-agent analytics layer"),
    ],
    [2050, 4650, 2660],
)

doc.add_paragraph("Shared Agent Core", style="Heading 2")
add_bullets([
    "Identity and permissions for customers, staff, workspaces, and agents.",
    "Company and brand knowledge with source tracking and retrieval.",
    "Conversation, session, and workflow state.",
    "Structured tools for search, scheduling, CRM updates, notifications, and publishing.",
    "Approval gates, escalation rules, and human handoff.",
    "Model routing, cost control, quality evaluation, and fallback behavior.",
    "Event logging, analytics, outcome attribution, and continuous improvement.",
    "Channel adapters for web, WhatsApp, email, and supported social platforms.",
])

doc.add_paragraph("Experience model", style="Heading 2")
add_callout("Observe -> assist -> approve -> automate", "Every new workflow starts with visibility and human review. Automation expands only after the action is reliable, permitted, and economically justified.")

page_break()


# Customer segments
add_section_title("06", "Customers and wedges", "Broad platform, disciplined go-to-market.")
doc.add_paragraph("Primary early customers", style="Heading 2")
add_table(
    ["Segment", "Economic buyer", "Urgent job", "Best first product"],
    [
        ("Property agencies", "Founder, managing director, sales lead", "Capture and qualify enquiries around the clock", "Concierge"),
        ("Creators and experts", "Creator, manager, producer", "Turn source content into consistent growth and leads", "Studio + Inbox"),
        ("Marketing agencies", "Founder, operations director", "Serve more clients with consistent delivery and reporting", "Campaigns + Pulse"),
        ("Customer-facing SMEs", "Founder, commercial lead", "Respond faster and book more qualified customers", "Concierge + Inbox"),
        ("Growing teams", "COO, operations lead", "Make company knowledge useful and reduce repetitive work", "Operations"),
    ],
    [1800, 2100, 3280, 2180],
)

doc.add_paragraph("Ideal customer signals", style="Heading 2")
add_bullets([
    "The business receives enough repeated enquiries for response quality and speed to matter.",
    "A clear person owns the commercial or operational outcome.",
    "The workflow has a measurable completion event such as a booking, qualified lead, approved asset, or resolved request.",
    "The business can provide approved knowledge and access to the relevant tools.",
    "The team is willing to review early agent behavior and improve the process.",
])

doc.add_paragraph("Qualification rule", style="Heading 2")
add_callout("One buyer, one pain, one measurable workflow", "We can demonstrate a platform with many capabilities, but every pilot proposal should be anchored to one accountable business result.", PALE_CYAN, CYAN)

page_break()


# Demo platform
add_section_title("07", "The Aksen web platform", "An AI showroom, sales engine, and home for live proof.")
add_body("The public platform should let a visitor understand Aksen in 30 seconds, experience an agent within two minutes, and imagine a pilot inside their organization within five minutes.")

doc.add_paragraph("Primary website architecture", style="Heading 2")
add_steps([
    "Home: the promise, outcomes, featured demonstrations, trust, and primary calls to action.",
    "Agent Lab: live and guided demonstrations with an explainable behind-the-scenes view.",
    "Solutions: Convert, Create, and Operate as the three outcome pillars.",
    "Industries: focused pages for property, creators, marketing teams, and customer-facing businesses.",
    "Work: transparent concept studies, official case studies, prototypes, and experiments.",
    "Approach: discovery, pilot, transformation, and managed optimization.",
    "Opportunity Mapper: a personalized recommendation experience that captures qualified demand.",
    "About and contact: founding thesis, principles, credibility, and booking flow.",
])

doc.add_paragraph("Homepage narrative", style="Heading 2")
add_table(
    ["Moment", "Visitor should understand", "Experience"],
    [
        ("Hero", "Aksen turns attention into useful action", "Short headline, motion workflow, Try the Agent Lab"),
        ("Outcomes", "The company solves commercial and operating problems", "Convert, Create, Operate"),
        ("Proof", "The agents are more than chat interfaces", "Tool activity, approvals, handoffs, and results"),
        ("Demos", "The platform works across industries", "Proptis, Creator Growth, Social Sales, Campaigns"),
        ("Trust", "People stay in control", "Sources, permissions, approvals, audit trail"),
        ("Conversion", "A practical first step is available", "Opportunity Mapper or discovery booking"),
    ],
    [1450, 4230, 3680],
)

doc.add_paragraph("Agent Lab demonstration standard", style="Heading 2")
add_bullets([
    "Experience it: let the visitor interact or make choices.",
    "See inside: reveal retrieved context, selected tool, approval state, and completed action.",
    "Understand the outcome: show what changed for the customer or team.",
    "Imagine yours: translate the workflow into two or three adjacent industries.",
    "Convert honestly: label each experience Live, Prototype, Guided Simulation, or Concept.",
])

page_break()

doc.add_paragraph("Interaction and motion system", style="Heading 2")
add_body("Motion is part of the explanation layer. The site should remain visually calm until a relationship, state change, or completed action needs to be communicated. Every animation must help the visitor understand how an Aksen agent moves from signal to outcome.")

doc.add_paragraph("Signature website behavior", style="Heading 3")
add_bullets([
    "A thin signal-green path enters the hero as a message or idea and continues through the page as the visitor scrolls.",
    "The path activates Attention, Understand, Decide, Act, Outcome, and Learn one stage at a time.",
    "Product cards begin monochrome, then reveal one active green workflow on hover or focus.",
    "Agent demonstrations show a restrained activity timeline for retrieval, tool use, approval, completion, and handoff.",
    "Page transitions use a short green sweep or signal pulse rather than full-screen visual effects.",
    "Buttons use a small expanding green point, subtle forward arrow movement, and stable text placement.",
])

doc.add_paragraph("Page-specific explanatory diagrams", style="Heading 3")
add_table(
    ["Page", "Diagram", "Interaction"],
    [
        ("Home", "Attention-to-action signal path", "Scroll activates one business stage at a time"),
        ("Agent Lab", "Decision trace and tool timeline", "Expand any event to see context, source, tool, and outcome"),
        ("Solutions", "Convert, Create, Operate system map", "Selecting one pillar reveals its connected agent modules"),
        ("Industries", "Before-and-after workflow", "Drag or toggle between fragmented work and the coordinated agent flow"),
        ("Work", "Opportunity-to-outcome case map", "Reveal challenge, intervention, human controls, and evidence"),
        ("Opportunity Mapper", "Personalized agent architecture", "Answers progressively assemble a recommended workflow"),
        ("Trust", "Human-control ladder", "Risk level changes the required approval and escalation behavior"),
    ],
    [1550, 3450, 4360],
)

doc.add_paragraph("Dark and light rhythm", style="Heading 3")
add_bullets([
    "Use dark sections for the hero, Agent Lab, product mechanics, architecture, and closing call to action.",
    "Use soft-white sections for explanations, industries, case studies, trust, and long-form reading.",
    "Move between dark product moments and light editorial moments to avoid an endless dashboard appearance.",
    "Reserve full signal green for active controls, live paths, selected states, and confirmed outcomes.",
])

doc.add_paragraph("Animation guardrails", style="Heading 3")
add_bullets([
    "Most micro-transitions should complete between approximately 180 and 450 milliseconds.",
    "Longer scroll sequences are acceptable only when they explain a multi-stage workflow.",
    "Do not hijack scrolling, move body text while it is being read, or animate elements without a communication purpose.",
    "Pause off-screen animations and respect the user's reduced-motion preference.",
    "Design mobile alternatives that preserve meaning without depending on hover behavior.",
    "Target smooth performance on ordinary mobile devices before adding decorative complexity.",
])

doc.add_paragraph("Recommended implementation", style="Heading 3")
add_bullets([
    "Framer Motion for component transitions, shared layout movement, and accessible interface states.",
    "GSAP only for sophisticated scroll-linked signal diagrams where CSS and Framer Motion are insufficient.",
    "SVG for workflow lines, nodes, architectural maps, and responsive explanatory diagrams.",
    "CSS transforms and opacity for simple high-performance micro-interactions.",
    "Rive or Lottie only for contained reusable brand motion with a clear role.",
    "Avoid Three.js until a specific three-dimensional experience materially improves understanding.",
])

page_break()


# Demo catalog
add_section_title("08", "Initial demonstration catalog", "Four stories that prove one reusable platform.")
doc.add_paragraph("Demo 1: Proptis AI Concierge", style="Heading 2")
add_body("A conversational property assistant that answers common questions, discovers requirements, recommends suitable properties, qualifies a buyer or renter, captures a lead, and prepares a viewing request. The interface should expose selected tool activity without overwhelming the user.")

doc.add_paragraph("Demo 2: Creator Growth Agent", style="Heading 2")
add_body("A creator provides a video, transcript, newsletter, or voice note. The system extracts themes, proposes platform-native ideas, drafts assets in the creator's voice, routes them for approval, and connects high-intent engagement to a lead or offer.")

doc.add_paragraph("Demo 3: Social Sales Agent", style="Heading 2")
add_body("A guided social-feed simulation shows a comment becoming a useful conversation, a qualified opportunity, a booked call, and a CRM record. This should emphasize permission, tone, escalation, and measurable conversion rather than mass messaging.")

doc.add_paragraph("Demo 4: Marketing Campaign Agent", style="Heading 2")
add_body("A visitor completes a short campaign brief. The agent creates a research summary, positioning options, campaign angles, creative briefs, an approval plan, channel adaptations, and a measurement framework.")

doc.add_paragraph("Required demo metadata", style="Heading 2")
add_table(
    ["Field", "Purpose"],
    [
        ("Status", "Live, Prototype, Guided Simulation, or Concept"),
        ("Problem", "The customer pain being addressed"),
        ("Agent actions", "What the agent actually understands or completes"),
        ("Human controls", "Approval, escalation, and override points"),
        ("Integrations", "Current connections and illustrative future connections"),
        ("Outcome", "The measurable event the workflow is designed to improve"),
    ],
    [2000, 7360],
)

page_break()


# Creator product and generated visual
add_section_title("09", "Creator and social growth opportunity", "Build a Creator Chief of Staff, not another caption generator.")
add_picture(
    ASSETS / "creator-campaign-green-v2.png",
    6.5,
    "Image-generation example: a creator campaign visual showing one source moment becoming a coordinated content system.",
    "Creator campaign example",
    "A Ghanaian fashion creator films a product story in a warm studio while collaborators work across camera, phone, and laptop.",
)

doc.add_paragraph("Recommended first wedge", style="Heading 2")
add_callout("Content-to-Revenue Agent", "Turn one long-form video, podcast, newsletter, or voice note into an approved weekly campaign, then help identify and route high-intent engagement into a measurable next step.", PALE_CYAN, CYAN)

doc.add_paragraph("First version capabilities", style="Heading 2")
add_bullets([
    "Ingest creator-owned source material and previous approved content.",
    "Build a brand voice profile with explicit do and do-not guidance.",
    "Extract themes, stories, hooks, teachable moments, and content opportunities.",
    "Draft channel-specific assets without pretending one caption fits every platform.",
    "Route drafts through creator or manager approval.",
    "Prepare publishing packages through supported platform integrations.",
    "Track content performance and connect it to leads, bookings, or offers where possible.",
    "Organize sponsorship enquiries, deliverables, approvals, and deadlines.",
])

doc.add_paragraph("Defensible difference", style="Heading 2")
add_body("The product should remember the creator's source material, commercial offers, audience, approved language, sponsor commitments, and performance. Generation is one component. The value is coordinating the full system from idea to business result.")

doc.add_paragraph("Creative prompt used for this concept", style="Heading 3")
add_body("Premium campaign photograph of a Ghanaian fashion and lifestyle creator filming a vertical product story in a contemporary Accra studio. Show camera, phone, laptop, collaborators, natural materials, clean soft-white daylight, carbon-black styling, forest details, and a restrained signal-green practical light. Authentic, editorial, photorealistic, no logos, no readable text, no robots, and no excessive neon.", italic=True)

page_break()


# Image and video generation offering
add_section_title("10", "Image and video intelligence", "Creative generation becomes a managed business workflow.")
add_body("Aksen can offer image and video generation as part of Studio and Campaigns. The sellable product is not the model output alone. It is a repeatable system that converts brand strategy into approved creative assets with consistent direction, provenance, and performance learning.")

doc.add_paragraph("Image-generation services", style="Heading 2")
add_bullets([
    "Campaign concepts and visual territories.",
    "Product and lifestyle scenes when traditional production is unavailable or unnecessary.",
    "Storyboards, mood frames, pitch visuals, and pre-production exploration.",
    "Platform-specific variations and controlled creative testing.",
    "Background replacement, localization, seasonal adaptation, and image extension with approval.",
    "Brand-safe prompt libraries and reusable art-direction presets.",
])

doc.add_paragraph("Video-generation services", style="Heading 2")
add_bullets([
    "Concept development, scripts, shot lists, storyboards, and animatics.",
    "Short brand films, social advertisements, product explainers, and motion-led demo stories.",
    "Avatar or voice use only with explicit consent, identity controls, and disclosure where appropriate.",
    "A human review gate before publishing or using generated people, claims, products, or sensitive scenarios.",
    "Campaign versioning with a documented relationship between prompt, source assets, edit decisions, and final output.",
])

doc.add_paragraph("Creative production workflow", style="Heading 2")
add_steps([
    "Brief: objective, audience, message, channels, brand rules, claims, rights, and restrictions.",
    "Concept: two or three creative territories with rationale and reference frames.",
    "Approval: select one route before expensive generation or editing.",
    "Production: create images, storyboard frames, clips, voice, music, and platform adaptations.",
    "Quality control: inspect identity, hands, products, claims, continuity, typography, disclosure, and brand fit.",
    "Publish: use approved channels and preserve a record of the final asset and approvals.",
    "Learn: connect creative variants to meaningful performance signals and update the next brief.",
])

page_break()


# Storyboard
add_section_title("11", "Video-generation example", "Brand film concept: From Attention to Action.")
add_picture(
    ASSETS / "attention-to-action-storyboard-green-v2.png",
    6.5,
    "Six-frame concept storyboard. Each final shot should be generated or filmed separately for continuity and editorial control.",
    "From Attention to Action storyboard",
    "Six cinematic frames follow a Ghanaian entrepreneur from overwhelming customer messages to a coordinated AI-assisted workflow and a confident Accra skyline portrait.",
)

doc.add_paragraph("Thirty-second story", style="Heading 2")
add_table(
    ["Time", "Picture", "Narrative purpose"],
    [
        ("0-4 sec", "Before sunrise, customer messages accumulate", "Establish the cost of scattered attention"),
        ("4-8 sec", "The founder records a simple product story", "Show authentic human input"),
        ("8-14 sec", "Aksen organizes content and conversations", "Reveal useful intelligence, not magic"),
        ("14-20 sec", "Customers receive relevant answers and next steps", "Turn understanding into action"),
        ("20-26 sec", "The team sees bookings and campaign learning", "Connect activity to business outcomes"),
        ("26-30 sec", "Founder at golden hour over Accra", "Land confidence and the brand promise"),
    ],
    [1350, 3970, 4040],
)

doc.add_paragraph("Voiceover draft", style="Heading 2")
add_callout("Script", "Every message is a signal. Every idea can create momentum. Aksen helps your business understand what matters, take the next action, and learn from every result. From attention to action.", PALE_GOLD, GOLD)

doc.add_paragraph("Production-ready video prompt", style="Heading 2")
add_body("Create a 30-second cinematic commercial following one Ghanaian woman entrepreneur in contemporary Accra. Begin in carbon-black predawn light with overwhelming but abstract customer notifications. Move into neutral soft-white daylight as she records a product story. Show a restrained intelligent workflow organizing conversations, content, approvals, and appointments. Signal green appears only when the system connects information or completes an action. End with her team reviewing clear results, then a confident natural-light portrait over Accra. Maintain exact identity, wardrobe, product, workspace, lens language, and color continuity. Premium commercial realism, natural movement, deep-forest surfaces, and restrained green system cues. No readable interface text, no robots, no floating brains, no Matrix code, no unsupported claims, no watermark.", italic=True)

page_break()


# Agent design
add_section_title("12", "Agent design standard", "Aksen agents must understand, act, explain, and recover.")
doc.add_paragraph("Every production agent needs", style="Heading 2")
add_bullets([
    "A bounded job with explicit success and failure conditions.",
    "Approved knowledge with source metadata, freshness, and ownership.",
    "Structured tools with validated inputs and narrowly scoped permissions.",
    "Conversation and workflow state that is appropriate to the use case.",
    "Clear rules for uncertainty, refusal, escalation, and human handoff.",
    "Approval gates for consequential, public, financial, or identity-sensitive actions.",
    "Evaluation datasets covering common, difficult, ambiguous, and adversarial requests.",
    "Observability for latency, model usage, tool failures, answer quality, and outcomes.",
])

doc.add_paragraph("Agent loop", style="Heading 2")
add_callout("Understand -> retrieve -> decide -> use tool -> verify -> respond -> record", "The user-facing answer is only one part of the system. Reliable execution depends on validation, permissions, tool results, and recovery behavior.", PALE_CYAN, CYAN)

doc.add_paragraph("Response experience", style="Heading 2")
add_bullets([
    "Use clean plain language and short paragraphs.",
    "Render structured results as native cards, options, timelines, or forms instead of raw Markdown.",
    "Remove stray formatting markers, malformed bullets, repeated punctuation, and unsupported characters.",
    "Preserve links, prices, dates, addresses, and property details exactly when they come from trusted data.",
    "Separate what the agent knows, what it inferred, and what it needs from the user.",
    "Confirm completed actions and provide a clear next step.",
])

page_break()


# Technical architecture
add_section_title("13", "Technical platform", "A modular Next.js and Postgres foundation that can grow without premature complexity.")
add_table(
    ["Layer", "Initial choice", "Responsibility"],
    [
        ("Experience", "Next.js web application", "Marketing site, Agent Lab, customer interfaces, admin"),
        ("Agent runtime", "Server-side TypeScript", "Prompts, tools, policies, orchestration, streaming"),
        ("Model gateway", "OpenRouter", "Model access, routing options, usage visibility, fallbacks"),
        ("Operational data", "Neon Postgres", "Organizations, users, leads, conversations, tools, events"),
        ("Knowledge", "Postgres + pgvector", "Documents, chunks, embeddings, semantic retrieval"),
        ("Channels", "Web first; WhatsApp adapter later", "Channel-specific delivery without duplicating core logic"),
        ("Observability", "Structured events and evaluation logs", "Quality, cost, latency, failures, outcomes"),
        ("Media", "Object storage and signed access", "Images, video, transcripts, documents, generated assets"),
    ],
    [1750, 2550, 5060],
)

doc.add_paragraph("Architecture principles", style="Heading 2")
add_bullets([
    "Keep channel interfaces thin. Business logic belongs in shared services and tools.",
    "Store structured business facts separately from generated text.",
    "Version prompts, tools, knowledge sources, and agent configurations.",
    "Record tool inputs, results, approvals, model choice, cost, and user-visible response.",
    "Use model routing by job, risk, latency, and cost instead of one model for everything.",
    "Do not expose database credentials, provider keys, system prompts, or internal tool traces to clients.",
    "Design every action to be idempotent or safely retryable where possible.",
])

doc.add_paragraph("Core data domains", style="Heading 2")
add_table(
    ["Domain", "Representative records"],
    [
        ("Tenancy", "Organizations, workspaces, members, roles, permissions"),
        ("Agent configuration", "Agents, versions, prompts, policies, enabled tools"),
        ("Knowledge", "Sources, documents, chunks, embeddings, freshness, citations"),
        ("Conversations", "Sessions, messages, participants, channel, consent"),
        ("Execution", "Tool calls, approvals, tasks, retries, errors, handoffs"),
        ("Commercial", "Contacts, leads, opportunities, bookings, outcomes"),
        ("Creative", "Briefs, source assets, generations, variants, approvals, rights"),
        ("Analytics", "Events, usage, cost, latency, evaluations, attribution"),
    ],
    [2250, 7110],
)

page_break()


# Trust
add_section_title("14", "Trust, safety, and governance", "Trust must be visible in the product, not hidden in policy documents.")
doc.add_paragraph("Minimum controls", style="Heading 2")
add_bullets([
    "Tenant isolation and role-based access to business data and agent controls.",
    "Secrets stored outside source code and rotated after exposure or staff changes.",
    "Consent and purpose limits for customer messages, creator likeness, voice, and private content.",
    "Source-level permissions and removal workflows for knowledge documents.",
    "Human approval before public publishing, financial commitment, sensitive outreach, or irreversible actions.",
    "Audit logs that connect the user request, agent decision, tool action, approval, and outcome.",
    "Retention rules appropriate to the client, channel, and data category.",
    "Incident response and the ability to disable an agent, tool, channel, or model quickly.",
])

add_picture(
    CONTROL_DIAGRAM,
    6.5,
    "Human-control ladder: autonomy expands only as consequence and confidence allow.",
    "Aksen human-control ladder",
    "Three cards show low-risk automatic completion, medium-risk human approval, and high-risk human takeover with context.",
)

doc.add_paragraph("Truthfulness standard", style="Heading 2")
add_body("The agent must prefer an honest limitation over a confident invention. Retrieved facts should carry sources where useful. Generated recommendations should be distinguishable from verified business data. Pricing, availability, legal claims, medical claims, and financial claims require special controls or human review.")

doc.add_paragraph("Creative rights standard", style="Heading 2")
add_bullets([
    "Confirm the customer has rights to source images, footage, music, scripts, logos, and voices.",
    "Require explicit consent before generating or editing a recognizable person's likeness or voice.",
    "Track where generated assets came from and which version was approved.",
    "Support platform disclosure requirements and customer disclosure policies.",
    "Do not represent concepts or simulations as completed client work.",
])

page_break()


# Business model
add_section_title("15", "Business model", "Services generate learning and cash flow; reusable software increases margin and scale.")
add_table(
    ["Offer", "Customer receives", "Commercial hypothesis"],
    [
        ("AI Opportunity Sprint", "Workflow audit, opportunity map, pilot definition, data and risk plan", "Fixed-fee diagnostic"),
        ("Focused Pilot", "One deployed workflow, measurement baseline, training, and pilot report", "Setup fee plus pilot support"),
        ("Transformation Partnership", "Multiple agents, integrations, change management, and roadmap", "Milestone-based implementation"),
        ("Managed Agent Operations", "Monitoring, evaluation, knowledge updates, optimization, and support", "Recurring monthly retainer"),
        ("Aksen Platform", "Reusable workspace, agent modules, analytics, roles, and connectors", "Subscription after repeatability is proven"),
        ("Creative Campaign Systems", "Brief-to-asset production, approvals, adaptations, and learning", "Project fee or recurring studio plan"),
    ],
    [2150, 4350, 2860],
)

doc.add_paragraph("Pricing hypotheses for discovery", style="Heading 2")
add_body("These ranges are testable anchors, not a public price list. Final pricing must reflect workflow value, integration complexity, risk, model usage, support load, and the customer's market.")
add_table(
    ["Offer", "Ghana-focused hypothesis", "International hypothesis"],
    [
        ("Opportunity Sprint", "GHS 5,000 to 12,000", "USD 750 to 2,000"),
        ("Focused Pilot", "GHS 20,000 to 60,000", "USD 3,000 to 10,000"),
        ("Managed Operations", "GHS 3,500 to 18,000 monthly", "USD 500 to 3,000 monthly"),
        ("Transformation", "Scoped after discovery", "Scoped after discovery"),
    ],
    [2300, 3530, 3530],
)

doc.add_paragraph("Commercial discipline", style="Heading 2")
add_bullets([
    "Do not offer unlimited model usage inside a fixed fee without clear limits.",
    "Separate implementation, recurring software, third-party usage, and managed support in proposals.",
    "Price against business value and risk, then verify that delivery margins remain healthy.",
    "Use pilot terms that permit an anonymized case study only when the client explicitly agrees.",
    "Avoid custom features that cannot become reusable patterns unless the client funds the exception.",
])

page_break()


# GTM
add_section_title("16", "Go-to-market", "Demonstration-led selling supported by precise, research-driven outreach.")
doc.add_paragraph("Initial sales motion", style="Heading 2")
add_steps([
    "Choose one target account and one costly visible workflow.",
    "Research the company using public information and identify the likely economic buyer.",
    "Build a short, clearly labelled concept demonstrating the future customer experience.",
    "Send a concise personalized message that leads with the observed opportunity, not a list of AI features.",
    "Use the live demonstration to earn a discovery conversation.",
    "Define a narrow pilot with a baseline, success event, approval model, and owner.",
    "Deliver quickly, measure honestly, and request permission to publish proof.",
    "Turn the strongest implementation patterns into templates and product modules.",
])

doc.add_paragraph("Three-day Proptis outreach target", style="Heading 2")
add_table(
    ["Day", "Outcome", "Actions"],
    [
        ("Day 1", "Decision-maker map", "Identify founder, managing director, commercial lead, and credible warm-introduction paths"),
        ("Day 2", "Outreach assets", "Polish demo, record a 60 to 90 second walkthrough, prepare email and LinkedIn message"),
        ("Day 3", "Contact and follow-up", "Send personalized outreach, track response, prepare discovery questions, schedule first follow-up"),
    ],
    [1100, 2400, 5860],
)

doc.add_paragraph("Channel mix", style="Heading 2")
add_bullets([
    "Founder-led email with a personalized subject and a direct demonstration link.",
    "LinkedIn connection and short message to relevant decision-makers.",
    "Warm introductions through customers, accelerators, property professionals, agencies, and mutual contacts.",
    "Short teardown content showing what a better customer journey could look like.",
    "Workshops and small events centered on practical AI workflows, not broad trend talks.",
    "Partner referrals from web studios, marketing agencies, CRM implementers, and business consultants.",
])

page_break()


# Delivery
add_section_title("17", "Delivery model", "A repeatable path from opportunity to controlled production.")
add_steps([
    "Discover: interview owners and operators, map the current workflow, identify costs, risks, and desired outcomes.",
    "Baseline: capture present response time, completion rate, workload, quality, or another relevant measure.",
    "Design: define the agent's job, data, tools, permissions, escalation, interface, and success criteria.",
    "Prototype: build a guided experience using representative data and restricted actions.",
    "Evaluate: test common, ambiguous, high-risk, and failure scenarios before external use.",
    "Pilot: launch to a bounded audience, channel, location, or team with human oversight.",
    "Measure: compare outcomes, quality, adoption, cost, latency, and operational burden against baseline.",
    "Expand: automate only proven steps and add adjacent workflows when ownership and value are clear.",
])

doc.add_paragraph("Pilot acceptance criteria", style="Heading 2")
add_bullets([
    "Named executive sponsor and operational owner.",
    "Approved knowledge and access to required systems.",
    "Defined users, channels, hours, scope, exclusions, and escalation contacts.",
    "A measurable completion event and an agreed baseline.",
    "A quality review process with representative test cases.",
    "A rollback or shutdown path for failed behavior.",
    "A written decision at pilot end: stop, revise, expand, or operationalize.",
])

doc.add_paragraph("Roles for the founding stage", style="Heading 2")
add_table(
    ["Role", "Immediate responsibility", "When to add"],
    [
        ("Founder / commercial lead", "Vision, research, sales, discovery, partnerships, account ownership", "Now"),
        ("Product and engineering", "Agent core, demos, integrations, reliability, architecture", "Now"),
        ("Product designer", "Brand system, interaction design, demos, customer experience", "Fractional or project"),
        ("AI creative director", "Image and video systems, quality control, client creative", "Fractional initially"),
        ("Implementation specialist", "Knowledge setup, testing, onboarding, support", "After repeat pilots"),
        ("Domain advisor", "Industry workflow credibility and introductions", "Per vertical"),
    ],
    [2000, 4900, 2460],
)

page_break()


# Roadmap
add_section_title("18", "Roadmap", "Prove demand before building the full platform.")
doc.add_paragraph("Phase 1: Foundation, days 0 to 30", style="Heading 2")
add_bullets([
    "Finalize the working brand direction and create the first Aksen web blueprint.",
    "Harden the Proptis demonstration and prepare a short walkthrough.",
    "Create the Agent Lab shell and transparent status labels.",
    "Build a guided Creator Growth or Social Sales demonstration.",
    "Prepare discovery, pilot, proposal, and evaluation templates.",
    "Begin focused founder outreach and conduct at least ten discovery conversations across chosen segments.",
])

doc.add_paragraph("Phase 2: First proof, days 31 to 90", style="Heading 2")
add_bullets([
    "Close and deliver the first paid pilot.",
    "Implement organization-level tenancy, agent configuration, event logs, and approval flows.",
    "Add the Opportunity Mapper as a lead qualification experience.",
    "Measure pilot economics, agent quality, user adoption, and delivery effort.",
    "Publish the first permissioned case study or anonymized proof story.",
    "Choose the second wedge based on willingness to pay, not enthusiasm alone.",
])

doc.add_paragraph("Phase 3: Repeatability, months 4 to 6", style="Heading 2")
add_bullets([
    "Standardize onboarding, knowledge ingestion, tools, evaluation, and analytics.",
    "Launch reusable templates for the strongest vertical and workflow.",
    "Add customer workspaces, roles, usage controls, and billing readiness.",
    "Develop partner channels with agencies and technology implementers.",
    "Document gross margin, support burden, retention indicators, and expansion paths.",
])

doc.add_paragraph("Phase 4: Platform, months 7 to 12", style="Heading 2")
add_bullets([
    "Offer self-serve configuration only for workflows that are genuinely repeatable.",
    "Expand channel adapters and the shared analytics layer.",
    "Introduce reusable creative and campaign workflows.",
    "Build vertical packs based on multiple paying implementations.",
    "Evaluate regional and international expansion from evidence gathered during delivery.",
])

page_break()


# Metrics and moat
add_section_title("19", "Metrics and defensibility", "Measure outcomes, reliability, economics, and learning velocity.")
doc.add_paragraph("Company metrics", style="Heading 2")
add_table(
    ["Area", "Questions to answer"],
    [
        ("Demand", "How many qualified conversations, proposals, pilots, and paying customers are created?"),
        ("Value", "Which measurable customer outcomes improve, and by how much?"),
        ("Quality", "How often are responses useful, grounded, safe, and completed without correction?"),
        ("Reliability", "How often do tools, channels, and workflows complete successfully?"),
        ("Adoption", "Do customers, operators, and end users return and complete meaningful tasks?"),
        ("Economics", "What are model, infrastructure, support, and implementation costs per outcome?"),
        ("Speed", "How quickly can a new customer or vertical be configured from reusable components?"),
        ("Learning", "How rapidly do pilots improve prompts, tools, evaluation sets, and templates?"),
    ],
    [1800, 7560],
)

doc.add_paragraph("Potential moat", style="Heading 2")
add_bullets([
    "Workflow intellectual property captured from real implementations.",
    "Local channel knowledge, operating context, and relationships.",
    "Reusable evaluation sets and outcome data for specific agent jobs.",
    "A services-to-product loop that exposes actual customer constraints.",
    "Trust architecture, approval patterns, and operational playbooks.",
    "A visible Agent Lab that makes complex capability easy to understand and buy.",
    "Cross-product learning between customer conversations, content, marketing, and operations.",
])

add_callout("Defensibility test", "If the value disappears when another model becomes cheaper, we have built a wrapper. The defensible value must live in workflow design, data, integrations, trust, outcomes, and customer relationships.", PALE_CYAN, CYAN)

page_break()


# Risks
add_section_title("20", "Risks and countermeasures", "Move quickly without confusing speed with carelessness.")
add_table(
    ["Risk", "Early countermeasure"],
    [
        ("Market breadth creates confusion", "Use one umbrella narrative and sell one narrow outcome per campaign"),
        ("Generic AI features are copied", "Own workflow, integration, evaluation, and operating experience"),
        ("Platform API restrictions", "Use official APIs, approval gates, and honest integration labels"),
        ("Incorrect or invented answers", "Ground responses, validate structured facts, test, and escalate uncertainty"),
        ("Sensitive data exposure", "Tenant isolation, least privilege, secret management, and retention controls"),
        ("Creative rights or likeness issues", "Consent, provenance, review, and disclosure workflows"),
        ("Custom work destroys margin", "Template common patterns and charge for funded exceptions"),
        ("Usage costs become unpredictable", "Model routing, budgets, caching, limits, and cost-per-outcome reporting"),
        ("Demo is mistaken for client endorsement", "Label independent concepts and simulations clearly"),
        ("Founder overload", "Standardize discovery and delivery; prioritize one active wedge at a time"),
    ],
    [2800, 6560],
)

doc.add_paragraph("Security action already required", style="Heading 2")
add_callout("Rotate exposed credentials", "Any database connection string or API key shared in chat or committed to a repository should be treated as exposed, rotated, moved into protected environment variables, and removed from logs and source history where applicable.", "FDECEC", RED)

page_break()


# Open decisions
add_section_title("21", "Open decisions and discovery agenda", "Evidence needed before irreversible commitments.")
doc.add_paragraph("Founding decisions", style="Heading 2")
add_table(
    ["Decision", "Current recommendation", "Evidence needed"],
    [
        ("Company name", "Aksen Labs as working name", "Registry, trademark, domain, and pronunciation checks"),
        ("First commercial wedge", "Property concierge", "Decision-maker access and paid pilot interest"),
        ("Second product wedge", "Social Sales or Creator Growth", "Interviews with creators, agencies, and service businesses"),
        ("Business model", "Services-first with platform underneath", "Delivery margin and repeatability across three pilots"),
        ("Primary channel", "Web demonstration first", "Customer demand and official API feasibility for WhatsApp/social"),
        ("Public pricing", "Keep private during discovery", "Close-rate and willingness-to-pay evidence"),
    ],
    [2400, 3470, 3490],
)

doc.add_paragraph("Discovery questions for prospective clients", style="Heading 2")
add_bullets([
    "Which customer or internal workflow creates the most delay, repetition, or lost opportunity?",
    "How does the workflow operate today, and who owns the result?",
    "What information must be correct every time?",
    "Which actions can the agent suggest, prepare, or complete?",
    "Where must a human approve or take over?",
    "Which tools and channels are already used?",
    "What outcome would make a four-week pilot commercially worthwhile?",
    "What data, privacy, brand, legal, or operational constraints must be respected?",
])

page_break()


# 30-day plan
add_section_title("22", "Thirty-day execution plan", "Build proof, earn conversations, and keep the platform coherent.")
add_table(
    ["Week", "Product", "Commercial", "Brand and content"],
    [
        ("1", "Stabilize Proptis demo; instrument key events", "Create target-account list and outreach assets", "Approve Aksen working identity and site narrative"),
        ("2", "Build Agent Lab shell and demo metadata", "Start personalized outreach and interviews", "Create short demo walkthrough and founder posts"),
        ("3", "Build Creator Growth or Social Sales guided demo", "Run discovery calls; draft first pilot proposal", "Publish one concept teardown and one agent explainer"),
        ("4", "Add Opportunity Mapper prototype and analytics", "Pursue pilot decision and partner introductions", "Review evidence and update this blueprint"),
    ],
    [950, 2940, 2940, 2530],
)

doc.add_paragraph("Definition of a successful first month", style="Heading 2")
add_bullets([
    "The Aksen story is clear enough that a decision-maker can repeat it accurately.",
    "The Proptis demo is stable, honest about its status, and easy to experience.",
    "At least one second demo proves the horizontal platform narrative.",
    "Customer discovery produces specific workflow, budget, and decision-process evidence.",
    "A paid pilot proposal is in front of a qualified buyer.",
    "The core platform captures events, costs, failures, and meaningful outcomes.",
])

page_break()


# Messaging bank
add_section_title("23", "Messaging bank", "Copy foundations for the website, outreach, and presentations.")
doc.add_paragraph("Homepage hero", style="Heading 2")
add_callout("Headline", "AI agents that turn attention into action.", PALE_GOLD, GOLD)
add_body("We design intelligent systems that answer customers, qualify leads, create campaigns, automate workflows, and help teams make better decisions.")

doc.add_paragraph("Three outcome pillars", style="Heading 2")
add_table(
    ["Pillar", "Message"],
    [
        ("Convert", "Turn customer enquiries, social engagement, and demand into qualified next steps."),
        ("Create", "Turn knowledge, ideas, and source content into approved campaigns and creative assets."),
        ("Operate", "Turn repetitive business workflows into controlled, intelligent systems."),
    ],
    [1800, 7560],
)

doc.add_paragraph("Proof language", style="Heading 2")
add_bullets([
    "Not just an answer. A completed next step.",
    "Your knowledge, your tools, your controls.",
    "Automate the repetitive. Keep people in control of the important.",
    "See what the agent understood, used, and completed.",
    "Start with one workflow. Build an intelligent operating layer over time.",
])

doc.add_paragraph("Short outreach opening", style="Heading 2")
add_body("I noticed an opportunity to make your customer journey faster and more useful, especially when someone is searching, comparing options, or contacting the team after hours. We built a short independent concept to show how an AI concierge could answer questions, qualify interest, and prepare the next action. I would value twenty minutes to understand how the workflow operates today and whether a focused pilot would be useful.", italic=True)

page_break()


# Sources
add_section_title("24", "Implementation references", "Primary documentation supporting key technical and channel assumptions.")
sources = [
    ("Neon: AI concepts and pgvector", "https://neon.com/docs/ai/ai-concepts", "Neon documents how pgvector can store and retrieve embeddings directly in Postgres."),
    ("OpenRouter: Quickstart", "https://openrouter.ai/docs/quickstart", "OpenRouter documents a unified API, model access, SDK options, tool use, and routing patterns."),
    ("TikTok: Content Posting API", "https://developers.tiktok.com/docs/en/content-posting-api-get-started", "TikTok documents creator authorization, posting scopes, audits, and restrictions for unaudited clients."),
    ("YouTube Data API", "https://developers.google.com/youtube/v3/docs", "YouTube documents authenticated video and channel operations."),
    ("YouTube Analytics API", "https://developers.google.com/youtube/analytics", "YouTube documents channel analytics queries and reporting."),
    ("YouTube: altered or synthetic content", "https://support.google.com/youtube/answer/14328491", "YouTube explains when realistic altered or synthetic content requires disclosure."),
]
for title, url, note in sources:
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(3)
    set_keep_with_next(p, True)
    add_hyperlink(p, title, url)
    p2 = doc.add_paragraph(note)
    p2.paragraph_format.left_indent = Inches(0.18)
    p2.paragraph_format.space_after = Pt(9)
    for run in p2.runs:
        set_run_font(run, size=9.5, color=SLATE)

doc.add_paragraph("Important note", style="Heading 2")
add_body("Platform policies, model availability, prices, legal requirements, and API capabilities change. Re-check official documentation during implementation and before making commitments to customers.")

doc.add_paragraph("Founding conclusion", style="Heading 2")
add_callout("The company we are building", "Aksen Labs is a focused agentic growth company with a reusable platform underneath. It wins trust through working demonstrations, enters through measurable workflows, expands through useful adjacent agents, and treats design, safety, and commercial outcomes as one product discipline.", PALE_CYAN, CYAN)

page_break()


# Business assessment
add_section_title("25", "Business assessment and timing", "A strong opportunity, provided focus and operating discipline arrive before scale.")
add_callout("Founder verdict", "8.4 / 10. Aksen is entering at the right moment: demand is rising, reliable implementation remains difficult, and local businesses need partners who can translate AI into useful work. The opportunity becomes weaker if Aksen tries to serve every industry or competes as another low-price chatbot vendor.", PALE_GOLD, GOLD)

doc.add_paragraph("Why this is a good time", style="Heading 2")
add_bullets([
    "Microsoft reports that 81% of leaders expect agents to be integrated moderately or extensively into company AI strategy within 12 to 18 months.",
    "Gartner expects agentic capabilities to enter far more enterprise applications, while warning that unclear value, cost, and weak controls will cancel many projects. That creates room for outcome-led implementation partners.",
    "Ghana's digital sector, internet adoption, public digital investment, and 2026 National AI Strategy create a more receptive market and a growing base of connected customers and businesses.",
    "The gap is not access to a model. The gap is workflow understanding, trustworthy tools, useful data, integration, evaluation, change management, and sustained improvement.",
])

doc.add_paragraph("What prevents a 10 / 10", style="Heading 2")
add_table(
    ["Gap", "What it could cause", "Aksen response"],
    [
        ("Too many industries", "Diluted story and scattered delivery", "Choose one 90-day commercial wedge while keeping the platform horizontal"),
        ("No paid proof yet", "Long sales cycles and weak pricing power", "Turn the first pilot into verified before-and-after evidence"),
        ("Commodity chatbot market", "Price pressure below sustainable service levels", "Sell workflow transformation, controls, integration, and measured outcomes"),
        ("Founder capacity", "Custom work overwhelms sales and product learning", "Use stage gates, templates, change control, and one active wedge at a time"),
        ("Governance debt", "Privacy, security, or reputation failure", "Make consent, least privilege, retention, audit, evaluation, and incident response launch requirements"),
        ("Distribution gap", "A good product that few buyers discover", "Connect founder content, live demonstrations, targeted outreach, partners, and referral loops"),
    ],
    [1900, 3100, 4360],
)

page_break()


# Competitive landscape
add_section_title("26", "Competitive landscape", "Know which fight to avoid and where Aksen can earn a premium.")
doc.add_paragraph("Ghana and nearby market", style="Heading 2")
add_table(
    ["Provider", "What it sells", "Public price signal", "Implication"],
    [
        ("XCelerate AI", "Omnichannel support and sales automation, catalogues, booking, payments, and follow-up", "GHS 150 / 600 / 1,800 monthly tiers", "A direct benchmark for the low-price productized chatbot category"),
        ("AgentGH", "WhatsApp-first AI receptionist for small businesses", "GHS 100 activation; GHS 500 monthly pilot", "Confirms local demand and strong price pressure at the entry level"),
        ("Npontu", "Enterprise AI, data, analytics, automation, and sector solutions", "Custom", "Strong local enterprise capability; Aksen must win with experience, speed to proof, and reusable vertical workflows"),
        ("Daidatec", "Approved-knowledge assistants and workflow automation", "Custom; prototype-led entry", "Aksen needs superior commercial packaging and outcome evidence"),
        ("Automation studios", "n8n, Make, Zapier, and AI implementations", "Usually custom", "Sell the business result, not a tool configuration"),
    ],
    [1300, 3150, 1750, 3160],
)

doc.add_paragraph("Global benchmarks", style="Heading 2")
add_table(
    ["Provider", "Model", "Current public signal", "Lesson"],
    [
        ("Intercom Fin", "AI support outcomes", "$0.99 resolution-class outcome; $9.99 qualified lead, plus platform", "Outcome pricing works when definitions and baselines are precise"),
        ("Lindy", "General AI employees", "About $29.99 to $199.99 per user/month", "Credits package usage; Aksen should explain cost but sell value"),
        ("Relevance AI", "Agent building platform", "Free; paid individual and team tiers; enterprise custom", "Tools are becoming cheap; implementation and governance carry the premium"),
        ("Voiceflow", "Conversational agent platform", "Business and agency offers increasingly quote-led", "Use as an accelerator if useful, but own workflow, data, evaluation, and relationship"),
        ("n8n", "Workflow automation infrastructure", "Hosted execution tiers and community self-hosting", "Infrastructure can reduce build time without becoming the customer proposition"),
        ("HubSpot / work platforms", "CRM and project operations", "Free entry and per-seat paid tiers", "Integrate commodity functions; do not rebuild full CRM or project suites"),
    ],
    [1450, 2300, 2550, 3060],
)

add_callout("Positioning decision", "Aksen should own the space between cheap generic bots and slow enterprise transformation: a focused, measurable AI workflow designed, launched, governed, and improved by one accountable partner.", PALE_CYAN, CYAN)

page_break()


# Pricing
add_section_title("27", "Pricing and commercial design", "Charge separately for discovery, implementation, operations, external usage, and proven outcomes.")
add_table(
    ["Offer", "Indicative price", "Buyer receives"],
    [
        ("Opportunity Sprint", "GHS 5k-12k / USD 750-2k", "Workflow map, baseline, risks, pilot design, success measures, and recommendation"),
        ("Focused Pilot", "GHS 20k-60k / USD 3k-10k", "One bounded workflow over about four to six weeks, with evaluation, controls, and launch support"),
        ("Managed Agent Operations", "GHS 4k-18k monthly / USD 600-3k", "Monitoring, support, improvements, reporting, evaluation, and agreed change allowance"),
        ("Transformation Programme", "GHS 60k-250k+", "Multiple connected workflows, integrations, governance, training, and operating-model change"),
        ("Outcome component", "Added after a baseline exists", "An agreed fee or bonus for qualified leads, bookings, support outcomes, or another verified result"),
        ("External usage", "Allowance plus transparent overage", "Model, WhatsApp, voice, email, storage, and licensed enrichment costs"),
    ],
    [2400, 2600, 4360],
)

doc.add_paragraph("Pricing rules", style="Heading 2")
add_bullets([
    "Never promise unlimited AI usage inside a custom service without an explicit fair-use and overage policy.",
    "Use fixed-fee discovery and pilot stages to make buying easier while protecting scope.",
    "Require a measurable baseline before outcome pricing; define attribution, exclusions, and audit evidence in writing.",
    "Use milestone payments and a change budget for transformation programmes.",
    "Keep public product prices provisional until at least three comparable paid implementations reveal real delivery and support economics.",
])

add_callout("Do not race to the bottom", "The GHS 150-600 chatbot category is already occupied. Aksen should make the first paid step accessible, but the core offer must remain a serious business improvement engagement.", "FDECEC", RED)

page_break()


# Aksen OS
add_section_title("28", "Aksen OS", "The internal operating system that connects demand, delivery, agents, knowledge, and outcomes.")
doc.add_paragraph("What it is", style="Heading 2")
add_body("Aksen OS is not a dashboard placed beside the business. It is the record of how the business works. Every lead, promise, project decision, agent version, approval, incident, reusable asset, and customer outcome becomes part of one traceable operating system.")

add_table(
    ["Module", "Core responsibility", "Why it matters"],
    [
        ("Command centre", "Pipeline, project health, deadlines, approvals, incidents, revenue and activity", "Gives the founder one honest view of what needs attention"),
        ("CRM", "People, companies, leads, opportunities, conversations, consent, score and next action", "Connects every public interaction to a commercial record"),
        ("Sales workspace", "Discovery, opportunity map, proposal, scope, pricing and approval", "Turns interest into a disciplined buying journey"),
        ("Project delivery", "Scope, milestones, work, risks, decisions, deliverables, cost, acceptance and learning", "Manages engagements from promise to verified outcome"),
        ("Client records", "Stakeholders, agreements, systems, data, knowledge, deployments and service health", "Keeps delivery context reusable and permissioned"),
        ("Agent operations", "Registry, versions, tools, permissions, runs, evaluations, cost, approvals and incidents", "Lets Aksen demonstrate the operating discipline it sells"),
        ("Support inbox", "Conversation, ticket, urgency, confidence, handoff, resolution and feedback", "Joins customer care to product and delivery learning"),
        ("Content studio", "Idea, sources, draft, review, publish, distribute, repurpose and attribute", "Makes the blog a demand and trust engine"),
        ("Knowledge hub", "Playbooks, templates, prompts, vertical patterns, sources and freshness", "Captures reusable intellectual property"),
        ("Finance-lite", "Quote, invoice status, recurring revenue, cost and margin estimate", "Supports commercial decisions without rebuilding accounting"),
    ],
    [1750, 4250, 3360],
)

page_break()


# Lifecycle
add_section_title("29", "End-to-end project lifecycle", "Every stage has an owner, evidence, gate, and next action.")
add_table(
    ["Stage", "Required evidence", "Exit gate"],
    [
        ("Capture and enrich", "Source, consent, company context, problem signal, contact path", "A real account with evidence and an assigned owner"),
        ("Qualify", "Need, urgency, authority, budget range, current workflow, next action", "Discovery is worth the buyer's and Aksen's time"),
        ("Discover", "Workflow map, baseline, users, systems, risks, success definition", "The problem and pilot boundary are agreed"),
        ("Propose", "Scope, deliverables, exclusions, price, responsibilities, timeline, controls", "Approved statement of work and payment trigger"),
        ("Onboard", "Stakeholders, access, data classification, knowledge, communication rhythm", "A safe, testable environment is ready"),
        ("Design and build", "Architecture, tool contracts, prompts, user paths, evaluation cases", "Acceptance criteria can be tested"),
        ("Evaluate and approve", "Test results, failures, security review, human-control review", "Named owner approves release"),
        ("Launch and observe", "Run trace, cost, latency, incidents, outcomes, user feedback", "System is stable enough for normal operation"),
        ("Optimize", "Outcome review, failure patterns, improvement backlog, updated evaluation", "Changes improve value without unacceptable risk"),
        ("Expand or close", "ROI summary, renewal decision, reusable assets, case-study permission", "Retainer, next workflow, referral, or clean handover"),
    ],
    [1850, 4700, 2810],
)

add_callout("Operating rule", "No silent handoffs. The system should always show who owns the next action, what evidence is missing, and what decision unlocks the next stage.", PALE_GOLD, GOLD)

page_break()


# Multi-agent architecture
add_section_title("30", "Multi-agent operating architecture", "A supervised team of bounded workers, not an autonomous swarm.")
doc.add_paragraph("Architecture in plain language", style="Heading 2")
add_body("One coordinator receives work, checks policy and context, and gives a bounded job to the right specialist. Specialists can read or draft only what their role permits. Consequential actions wait for a person. Every run leaves evidence that can be reviewed, measured, and improved.")

add_table(
    ["Agent", "Primary job", "First-release control"],
    [
        ("Front Door", "Answer, guide, qualify, and create a useful handoff", "Cannot invent prices, promises, or unsupported claims"),
        ("Enrichment", "Create an evidence-backed company profile", "Business and licensed sources only; attach source and confidence"),
        ("Sales Copilot", "Summarize discovery and recommend next steps", "Every external message and commercial commitment is approved"),
        ("Solution Architect", "Draft a bounded workflow, risk model, pilot, and success measures", "Technical and commercial owners approve scope"),
        ("Proposal", "Prepare statements of work from approved modules", "Human approves and sends"),
        ("Project Coordinator", "Maintain project state, status, blockers, and follow-ups", "Cannot change scope, spend, or acceptance"),
        ("Knowledge Steward", "Prepare sources, metadata, access, and freshness warnings", "Sensitive sources and permissions require approval"),
        ("Evaluation", "Test versions, compare outputs, and flag regressions", "Release gate blocks weak versions"),
        ("Support", "Resolve bounded questions and triage incidents", "Escalates uncertainty, sensitivity, anger, and high impact"),
        ("Content Research", "Produce sources, claims, angles, and counterpoints", "No unsourced publication"),
        ("Editorial", "Draft articles and repurpose founder thinking", "Founder approves publication"),
        ("Pulse", "Detect commercial, delivery, reliability, and cost signals", "Cannot change budgets or contact customers automatically"),
    ],
    [2000, 4400, 2960],
)

doc.add_paragraph("Technical layers", style="Heading 2")
add_bullets([
    "Experience: website, blog, conversation, admin, and later client portal.",
    "Application API: identity, tenancy, policy, validation, rate limits, and typed services.",
    "Orchestration: jobs, workflow state, retries, idempotency, routing, and approval waits.",
    "Agent registry: instructions, model policy, tools, permissions, versions, budgets, and deployments.",
    "Knowledge and tools: approved sources, retrieval, citations, integrations, and safe actions.",
    "Data: Neon Postgres as system of record, pgvector for retrieval, and object storage for files and media.",
    "Trust and operations: traces, cost, latency, evaluation, incidents, approvals, secrets, and emergency stop.",
])

page_break()


# Lead support and blog
add_section_title("31", "Lead, support, and content engines", "Three public experiences feeding one operating system.")
doc.add_paragraph("Conversational front door", style="Heading 2")
add_bullets([
    "Answer from approved Aksen knowledge and show a useful source or scope cue when it matters.",
    "Understand the visitor's industry, workflow, problem, current tools, volume, urgency, and desired outcome through a guided conversation.",
    "Create or update the lead, preserve consent and source, attach the conversation summary, and suggest the correct next action.",
    "Offer an appropriate demonstration, article, opportunity call, or support handoff instead of forcing every visitor into the same form.",
    "Escalate uncertainty and never make contractual, legal, security, delivery, or pricing commitments without approval.",
])

doc.add_paragraph("Enrichment boundary", style="Heading 2")
add_callout("Recommended starting policy", "Enrich companies and domains from licensed or clearly permitted business sources. Use contact information the person supplies. Defer large-scale personal decision-maker enrichment and autonomous outreach until Aksen has an approved provider, lawful basis, consent and objection handling, retention rules, and a reviewed outreach policy.", PALE_CYAN, CYAN)

doc.add_paragraph("Blog and founder media", style="Heading 2")
add_table(
    ["Series", "Promise to the reader", "Commercial connection"],
    [
        ("AI in Practice", "What a real workflow looks like before and after", "Links to a relevant demonstration or opportunity map"),
        ("Work and Productivity", "Ways people and agents can work better together", "Builds trust with operators and team leaders"),
        ("Tools We Tested", "Honest reviews, trade-offs, and use cases", "Creates search demand and practical authority"),
        ("Build Notes", "What Aksen built, learned, measured, or changed", "Turns internal progress into credible proof"),
        ("African AI", "Local context, policy, businesses, talent, and opportunity", "Builds a distinctive regional point of view"),
        ("Client Playbooks", "Reusable approaches without exposing confidential information", "Educates serious buyers and shortens discovery"),
    ],
    [1900, 4000, 3460],
)

page_break()


# Roadmap
add_section_title("32", "Build roadmap", "Prove the operating loop before adding platform breadth.")
add_table(
    ["Phase", "Time", "Deliverable", "Gate"],
    [
        ("0. Decisions and controls", "1 week", "Target segment, roles, system of record, stages, metrics, permissions, retention, and evaluation policy", "Founder confirms the operating defaults"),
        ("1. Foundation", "2-3 weeks", "Neon schema, authentication, roles, audit events, admin shell, CRM core, blog, opportunity mapper, and Front Door Agent", "A public conversation creates a traceable, useful lead"),
        ("2. Delivery OS", "3-4 weeks", "Projects, milestones, work, risks, decisions, deliverables, acceptance, proposal, onboarding, and project health", "One engagement can be managed from discovery to retrospective"),
        ("3. Agent operations", "3-4 weeks", "Agent registry, tools, permissions, runs, approvals, incidents, evaluation, cost, and first specialist agents", "A version cannot launch without evidence and approval"),
        ("4. Growth engine", "2-3 weeks", "Editorial workflow, distribution, attribution, shared inbox, scoring, and expansion signals", "Content and conversations create measurable pipeline"),
        ("5. Productization", "Evidence-led", "Client portal, vertical packs, usage controls, billing readiness, WhatsApp, SLA, and partner tools", "A pattern has succeeded in at least three comparable paid implementations"),
    ],
    [1700, 1200, 4600, 1860],
)

doc.add_paragraph("Build now", style="Heading 2")
add_body("Founder and collaborator access, CRM core, opportunity mapper, blog, lead and support agent, project lifecycle, agent evidence, approval foundation, and audit events.")
doc.add_paragraph("Integrate or defer", style="Heading 2")
add_body("Accounting, payroll, full email marketing, full calendar, advanced resource planning, public self-service agent building, autonomous outbound, deep personal enrichment, automated billing, and a full client portal.")

page_break()


# Governance
add_section_title("33", "Trust, data, and operational controls", "The system must be safe enough to become proof of Aksen's method.")
add_bullets([
    "Use organization and workspace identifiers throughout the schema even while Aksen is the only organization.",
    "Separate identity, membership, role, permission, and project ownership.",
    "Record consent, source, purpose, retention category, and legal basis for personal information used in marketing or enrichment.",
    "Give each agent and tool least-privilege scopes: read, draft, request approval, or act.",
    "Keep external credentials in protected secrets, never prompts, source control, logs, or browser-visible configuration.",
    "Log the agent version, model, context sources, tool calls, approvals, errors, provider cost, latency, and final outcome.",
    "Maintain evaluation cases for factuality, policy, tool selection, handoff, tone, refusal, and domain-specific accuracy.",
    "Provide incident records, rollback, version promotion, budget limits, and an emergency disable control.",
    "Treat Ghana Data Protection Commission registration, privacy notices, processor terms, retention, breach response, and cross-border processing as launch work.",
])

add_callout("Security reminder", "Rotate the Neon database credential and OpenRouter key previously shared in chat before any public launch. The prototype can continue against protected environment variables, but exposed credentials should not be treated as permanent secrets.", "FDECEC", RED)

page_break()


# Decisions
add_section_title("34", "Founder decisions before implementation", "Seven answers that shape the schema, permissions, product scope, and first sales motion.")
add_table(
    ["Question", "Recommended default"],
    [
        ("Who uses the admin in the first three months?", "Founder plus invited collaborators with role-based access; client access later"),
        ("What is the primary system of record?", "Neon Postgres for Aksen OS; retain the current site database only temporarily or as an edge cache"),
        ("Which segment owns the next 90 days?", "Property and customer-facing service businesses, using Proptis as the proof wedge"),
        ("Who is the commercial buyer?", "Mid-market founders and decision-makers; do not build the core economics around micro-SME chatbot pricing"),
        ("Who can publish to the blog?", "AI can research and draft; the founder approves every publication in the first release"),
        ("How far can enrichment go?", "Company and domain information plus user-provided contacts first; licensed personal enrichment later"),
        ("Is a client portal part of the MVP?", "No. Stabilize internal delivery, then add a read-only client status and approval experience"),
    ],
    [5000, 4360],
)

doc.add_paragraph("Implementation start condition", style="Heading 2")
add_body("If the founder accepts these defaults, Phase 1 can begin immediately. A changed answer is not a problem, but it must be resolved before it becomes an expensive database, permission, or product decision.")

page_break()


# Research references
add_section_title("35", "Strategy and market references", "Authoritative evidence and public competitor benchmarks used for version 0.4.")
strategy_sources = [
    ("Microsoft: 2025 Work Trend Index", "https://www.microsoft.com/en-us/worklab/work-trend-index/2025-the-year-the-frontier-firm-is-born", "Agent adoption expectations and the capacity gap reported across 31 markets."),
    ("Gartner: agentic AI project outlook", "https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027", "Adoption forecast, agent-washing warning, and project cancellation risk."),
    ("World Bank: Ghana Digital Acceleration", "https://www.worldbank.org/en/news/press-release/2022/04/28/afw-world-bank-provides-200-million-to-accelerate-ghana-s-digital-transformation-agenda-for-better-jobs", "Ghana digital-sector growth and public digital investment."),
    ("World Bank: digital adoption in Ghana", "https://blogs.worldbank.org/en/africacan/ten-facts-about-digital-technology-adoption-ghana", "Internet adoption and urban-rural context."),
    ("Ghana Ministry: National AI Strategy", "https://moc.gov.gh/2026/04/24/ghana-launches-national-ai-strategy-to-drive-digital-transformation-and-economic-growth/", "Official 2026 launch and national direction."),
    ("UNESCO: Ghana AI readiness", "https://www.unesco.org/en/articles/ai-readiness-assessment-methodology-ghana", "Readiness work and priority sectors."),
    ("Ghana Data Protection Commission", "https://dataprotection.org.gh/wp-content/uploads/2025/05/Data-Protection-Act-2012-Act-843.pdf", "Primary data-protection law."),
    ("Anthropic: Building effective agents", "https://www.anthropic.com/engineering/building-effective-agents", "Simple, composable workflows and agents."),
    ("OpenAI: A practical guide to building AI agents", "https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/", "Use-case selection, orchestration, guardrails, and human intervention."),
    ("Microsoft Learn: multi-agent architecture patterns", "https://learn.microsoft.com/en-us/agents/architecture/multi-agent-patterns", "Least privilege, orchestration, and platform security."),
    ("XCelerate AI", "https://xcelerateak.com/", "Local omnichannel product and public pricing benchmark."),
    ("Npontu AI and intelligent automation", "https://npontu.com/ai-data-intelligent-automation/", "Local enterprise AI and data competitor."),
    ("Daidatec AI automation", "https://daidatec.com/services/ai-automation", "Local implementation and prototype-led competitor."),
    ("Intercom Fin outcome pricing", "https://www.intercom.com/help/en/articles/8205718-fin-ai-agent-outcomes", "Outcome definitions and public outcome prices."),
    ("Lindy pricing", "https://www.lindy.ai/pricing", "General agent credit and tier benchmark."),
    ("Relevance AI pricing", "https://relevanceai.com/docs/get-started/pricing", "Agent platform action pricing."),
    ("Voiceflow pricing", "https://www.voiceflow.com/pricing", "Conversational agent platform benchmark."),
    ("n8n pricing", "https://n8n.io/pricing/", "Workflow infrastructure and execution pricing benchmark."),
]
for title, url, note in strategy_sources:
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(3)
    set_keep_with_next(p, True)
    add_hyperlink(p, title, url)
    p2 = doc.add_paragraph(note)
    p2.paragraph_format.left_indent = Inches(0.18)
    p2.paragraph_format.space_after = Pt(7)
    for run in p2.runs:
        set_run_font(run, size=9.3, color=SLATE)

add_callout("Version 0.4 conclusion", "Build Aksen OS as a disciplined internal proof of the company: one operating loop from attention to outcome, a supervised agent team with clear permissions, a founder-led knowledge and content engine, and a services business that productizes only what paid delivery proves repeatable.", PALE_CYAN, CYAN)


# Keep headings with their following content and prevent widows where practical.
for paragraph in doc.paragraphs:
    if paragraph.style.name.startswith("Heading") or paragraph.style.name == "Kicker":
        paragraph.paragraph_format.keep_with_next = True
    paragraph.paragraph_format.widow_control = True

doc.save(OUT)
print(OUT)
