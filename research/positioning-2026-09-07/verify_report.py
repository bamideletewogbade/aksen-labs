from pathlib import Path
import re, json
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parent
pdf=ROOT/'output/pdf/Aksen-Labs-Positioning-and-Market-Strategy.pdf'
r=PdfReader(pdf)
md=(ROOT/'report-source.md').read_text(encoding='utf-8')
expected=set(re.findall(r'\]\((https?://[^\s)]+)\)',md))
actual=set()
for p in r.pages:
    for a in p.get('/Annots',[]):
        action=a.get_object().get('/A',{})
        if action.get('/URI'): actual.add(str(action['/URI']))
assert expected==actual, (expected-actual,actual-expected)
assert len(r.pages)==10
texts=[p.extract_text() or '' for p in r.pages]
assert all(len(t)>2000 for t in texts)
assert not any(token in '\n'.join(texts) for token in ['turn12view','\ufffd','TODO','[wordlim'])
assert 'NGN 250,000' in texts[5] and 'NGN 30,000' in texts[5]
assert 'proposed' in texts[5]
images=list((ROOT/'tmp/pdfs').glob('page-*.png'))
assert len(images)==10
result={'pages':len(r.pages),'bytes':pdf.stat().st_size,'unique_source_links':len(actual),'all_expected_links_embedded':True,'page_images':len(images),'text_and_status_checks':'passed'}
(ROOT/'verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result,indent=2))
