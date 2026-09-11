from pathlib import Path
import re
from html import escape
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'output' / 'pdf'
OUT.mkdir(parents=True, exist_ok=True)
PDF = OUT / 'Aksen-Product-Review-and-Next-Build.pdf'
FONT_DIR = Path('C:/Windows/Fonts')
for name, fn in [('Arial', 'arial.ttf'), ('Arial-Bold', 'arialbd.ttf'), ('Arial-Italic', 'ariali.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(FONT_DIR / fn)))
pdfmetrics.registerFontFamily('Arial', normal='Arial', bold='Arial-Bold', italic='Arial-Italic', boldItalic='Arial-Bold')

INK = colors.HexColor('#15271D')
GREEN = colors.HexColor('#175F3E')
MUTED = colors.HexColor('#52665B')
PALE = colors.HexColor('#EDF5EF')
LINE = colors.HexColor('#D6E1DA')
W, H = 595.276, 841.89
WIDTH = W - 96
styles = {
    'body': ParagraphStyle('Body', fontName='Arial', fontSize=10.1, leading=14.3, textColor=INK, spaceAfter=8),
    'small': ParagraphStyle('Small', fontName='Arial', fontSize=8.2, leading=11.5, textColor=MUTED, spaceAfter=6),
    'title': ParagraphStyle('Title', fontName='Arial-Bold', fontSize=23, leading=28, textColor=INK, spaceAfter=12),
    'heading': ParagraphStyle('Heading', fontName='Arial-Bold', fontSize=20, leading=24, textColor=INK, spaceAfter=13),
    'kicker': ParagraphStyle('Kicker', fontName='Arial-Bold', fontSize=9, leading=12, textColor=GREEN, spaceAfter=8),
    'cell': ParagraphStyle('Cell', fontName='Arial', fontSize=9.0, leading=12.0, textColor=INK),
    'th': ParagraphStyle('TH', fontName='Arial-Bold', fontSize=8.8, leading=11.8, textColor=colors.white),
    'bullet': ParagraphStyle('Bullet', fontName='Arial', fontSize=10.1, leading=14.3, textColor=INK, leftIndent=12, firstLineIndent=-10, spaceAfter=5),
}

def markup(text):
    text = escape(text, quote=False)
    text = re.sub(r'\[([^\]]+)\]\((https?://[^\s)]+)\)', lambda m: '<link href="'+escape(m[2], quote=True)+'" color="#175F3E"><u>'+m[1]+'</u></link>', text)
    text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
    return text

def para(text, style='body'):
    return Paragraph(markup(text), styles[style])

def table(lines):
    rows = [[v.strip() for v in line.strip().strip('|').split('|')] for line in lines]
    rows = [r for r in rows if not all(re.fullmatch(r'[-: ]+', c) for c in r)]
    n = len(rows[0])
    if n == 2: widths = [WIDTH*.47, WIDTH*.53]
    elif n == 3:
        if rows[0][1] == 'Score': widths = [WIDTH*.25, WIDTH*.13, WIDTH*.62]
        elif rows[0][0] == 'Period': widths = [WIDTH*.20, WIDTH*.53, WIDTH*.27]
        elif rows[0][0] == 'Offer': widths = [WIDTH*.25, WIDTH*.23, WIDTH*.52]
        else: widths = [WIDTH*.28, WIDTH*.37, WIDTH*.35]
    elif n == 4: widths = [WIDTH*.19, WIDTH*.27, WIDTH*.32, WIDTH*.22]
    elif n == 6: widths = [WIDTH*.14,WIDTH*.20,WIDTH*.17,WIDTH*.14,WIDTH*.19,WIDTH*.16]
    else: widths = [WIDTH/n]*n
    cells = [[para(c, 'th' if i==0 else 'cell') for c in r] for i,r in enumerate(rows)]
    t = Table(cells, colWidths=widths, hAlign='LEFT', repeatRows=1)
    cmds = [('BACKGROUND',(0,0),(-1,0),GREEN),('VALIGN',(0,0),(-1,-1),'TOP'),
            ('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),
            ('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7),
            ('LINEBELOW',(0,0),(-1,0),0.5,GREEN)]
    for i in range(1,len(rows)):
        cmds.extend([('BACKGROUND',(0,i),(-1,i),PALE if i%2 else colors.HexColor('#F8FAF8')),
                     ('LINEBELOW',(0,i),(-1,i),0.35,LINE)])
    t.setStyle(TableStyle(cmds))
    return [t, Spacer(1,10)]

class NumberedCanvas(canvas.Canvas):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self.states=[]
    def showPage(self):
        self.states.append(dict(self.__dict__))
        self._startPage()
    def save(self):
        total=len(self.states)
        for state in self.states:
            self.__dict__.update(state)
            self.setFont('Arial',8)
            self.setFillColor(MUTED)
            self.drawString(48,H-28,'AKSEN LABS  /  PRODUCT & BUSINESS REVIEW')
            self.drawRightString(W-48,H-28,'PRODUCT REVIEW 06 SEP 2026')
            self.drawString(48,25,'Aksen Labs  |  Direction, evidence and the next useful build')
            self.drawRightString(W-48,25,f'{self._pageNumber:02d} / {total:02d}')
            super().showPage()
        super().save()

text=(ROOT/'report-source.md').read_text(encoding='utf-8')
sections=re.split(r'\n## ',text)[1:]
story=[]
for idx,section in enumerate(sections):
    if idx: story.append(PageBreak())
    lines=section.splitlines()
    number,title=lines[0].split(' ',1)
    if idx==0:
        story.append(para('PRODUCT DIRECTION / FOUNDER BRIEF','kicker'))
        story.append(para('Aksen Labs:<br/>the next useful build'.replace('<br/>','\n'),'title'))
        story.append(para('Prepared for Tewogbade Olusegun Bamidele','small'))
        story.append(Spacer(1,6))
    else:
        story.append(para('PRODUCT NOTE '+number,'kicker'))
        story.append(para(title,'heading'))
    i=1
    while i<len(lines):
        line=lines[i].strip()
        if not line: i+=1; continue
        if line.startswith('|'):
            block=[]
            while i<len(lines) and lines[i].strip().startswith('|'):
                block.append(lines[i]); i+=1
            story.extend(table(block)); continue
        if line.startswith('- '):
            story.append(para('- '+line[2:],'bullet')); i+=1; continue
        block=[line]; i+=1
        while i<len(lines) and lines[i].strip() and not lines[i].strip().startswith(('|','- ')):
            block.append(lines[i].strip()); i+=1
        content=' '.join(block)
        style='small' if content.startswith(('Sources:', 'Screening evidence:', 'Source files reviewed:')) else 'body'
        story.append(para(content,style))

doc=SimpleDocTemplate(str(PDF),pagesize=(W,H),rightMargin=48,leftMargin=48,topMargin=51,bottomMargin=43,
    title='Aksen Labs: product review and next build',author='Founder strategy research',subject='Product direction, department model, BVM correction and next steps')
doc.build(story,canvasmaker=NumberedCanvas)
reader=PdfReader(str(PDF))
print(str(PDF))
print('Pages:',len(reader.pages))
for i,page in enumerate(reader.pages,1):
    t=page.extract_text() or ''
    print(i,len(t),t[:95].replace('\n',' / '))
print('Links:',sum(1 for p in reader.pages for a in p.get('/Annots',[]) if a.get_object().get('/A',{}).get('/URI')))
