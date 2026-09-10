from pathlib import Path
import re
from html import escape
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'output' / 'pdf'
OUT.mkdir(parents=True, exist_ok=True)
PDF = OUT / 'Aksen-Labs-Positioning-and-Market-Strategy.pdf'
for name, fn in [('Arial', 'arial.ttf'), ('Arial-Bold', 'arialbd.ttf'), ('Arial-Italic', 'ariali.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(Path('C:/Windows/Fonts') / fn)))
pdfmetrics.registerFontFamily('Arial', normal='Arial', bold='Arial-Bold', italic='Arial-Italic', boldItalic='Arial-Bold')
INK = colors.HexColor('#15271D')
GREEN = colors.HexColor('#175F3E')
MUTED = colors.HexColor('#52665B')
PALE = colors.HexColor('#EDF5EF')
W, H = 595.276, 841.89
WIDTH = W-96
styles = {
    'body': ParagraphStyle('Body',fontName='Arial',fontSize=10.2,leading=14.3,textColor=INK,spaceAfter=8),
    'small': ParagraphStyle('Small',fontName='Arial',fontSize=8.4,leading=11.6,textColor=MUTED,spaceAfter=8),
    'title': ParagraphStyle('Title',fontName='Arial-Bold',fontSize=24,leading=29,textColor=INK,spaceAfter=13),
    'heading': ParagraphStyle('Heading',fontName='Arial-Bold',fontSize=21,leading=26,textColor=INK,spaceAfter=14),
    'kicker': ParagraphStyle('Kicker',fontName='Arial-Bold',fontSize=9,leading=12,textColor=GREEN,spaceAfter=9),
    'cell': ParagraphStyle('Cell',fontName='Arial',fontSize=9,leading=12.4,textColor=INK),
    'th': ParagraphStyle('TH',fontName='Arial-Bold',fontSize=8.8,leading=11.8,textColor=colors.white),
}
def markup(text):
    text=escape(text,quote=False)
    text=re.sub(r'\[([^\]]+)\]\((https?://[^\s)]+)\)', lambda m:'<link href="'+escape(m[2],quote=True)+'" color="#175F3E"><u>'+m[1]+'</u></link>',text)
    return re.sub(r'\*\*(.+?)\*\*',r'<b>\1</b>',text)
def para(text,style='body'):
    return Paragraph(markup(text),styles[style])
def table(lines):
    rows=[[v.strip() for v in l.strip().strip('|').split('|')] for l in lines]
    rows=[r for r in rows if not all(re.fullmatch(r'[-: ]+',c) for c in r)]
    widths=[WIDTH*.25,WIDTH*.375,WIDTH*.375] if len(rows[0])==3 else [WIDTH/len(rows[0])]*len(rows[0])
    t=Table([[para(c,'th' if i==0 else 'cell') for c in r] for i,r in enumerate(rows)],colWidths=widths,repeatRows=1,hAlign='LEFT')
    cmds=[('BACKGROUND',(0,0),(-1,0),GREEN),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7)]
    for i in range(1,len(rows)):
        cmds.append(('BACKGROUND',(0,i),(-1,i),PALE if i%2 else colors.HexColor('#F8FAF8')))
    t.setStyle(TableStyle(cmds))
    return [t,Spacer(1,10)]
def decorate(c,doc):
    c.saveState()
    c.setFont('Arial',8)
    c.setFillColor(MUTED)
    c.drawString(48,H-28,'AKSEN LABS / POSITIONING AND MARKET STRATEGY')
    c.drawRightString(W-48,H-28,'07 SEP 2026')
    c.drawString(48,25,'Global research applied to African business opportunities')
    c.drawRightString(W-48,25,f'{doc.page:02d}')
    c.restoreState()
text=(ROOT/'report-source.md').read_text(encoding='utf-8')
sections=re.split(r'\n## ',text)[1:]
story=[]
for idx,section in enumerate(sections):
    if idx: story.append(PageBreak())
    lines=section.splitlines()
    number,title=lines[0].split(' ',1)
    story.append(para('RESEARCH AND RECOMMENDATIONS' if idx==0 else 'POSITIONING NOTE '+number,'kicker'))
    story.append(para('Aksen Labs positioning and market strategy' if idx==0 else title,'title' if idx==0 else 'heading'))
    if idx==0:
        story.append(para('Prepared for the Aksen Labs founder | Ghana base, African mission, cross-border opportunities','small'))
    i=1
    while i<len(lines):
        line=lines[i].strip()
        if not line:
            i+=1
            continue
        if line.startswith('|'):
            block=[]
            while i<len(lines) and lines[i].strip().startswith('|'):
                block.append(lines[i]); i+=1
            story.extend(table(block)); continue
        block=[line]; i+=1
        while i<len(lines) and lines[i].strip() and not lines[i].strip().startswith('|'):
            block.append(lines[i].strip()); i+=1
        content=' '.join(block)
        story.append(para(content,'small' if content.startswith(('Source:', 'Sources:', 'Source files reviewed:', 'Evidence basis:')) else 'body'))
doc=SimpleDocTemplate(str(PDF),pagesize=(W,H),rightMargin=48,leftMargin=48,topMargin=51,bottomMargin=43,title='Aksen Labs positioning and market strategy',author='Aksen Labs',subject='Digital transformation agency positioning and African market approach')
doc.build(story,onFirstPage=decorate,onLaterPages=decorate)
reader=PdfReader(str(PDF))
print(PDF)
print('Pages:',len(reader.pages))
for i,page in enumerate(reader.pages,1):
    s=page.extract_text() or ''
    print(i,len(s),s[0:125].replace('\n',' / '))
print('Links:',sum(1 for p in reader.pages for a in p.get('/Annots',[]) if a.get_object().get('/A',{}).get('/URI')))
