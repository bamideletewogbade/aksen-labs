import re
import zipfile

path = r"C:\Users\HP\Desktop\Side Hustle\Aksen-Labs\Aksen-Labs-Business-Blueprint.docx"
with zipfile.ZipFile(path) as archive:
    xml = archive.read("word/document.xml").decode("utf-8")

checks = {
    "hyperlinks": xml.count("<w:hyperlink"),
    "numbered_paragraphs": xml.count("<w:numPr>"),
    "page_breaks": xml.count('w:type="page"'),
    "alt_text_records": xml.count('descr="'),
    "header_rows": xml.count("tblHeader"),
    "document_xml_ok": bool(re.search(r"<w:body>", xml)),
}
for key, value in checks.items():
    print(f"{key}: {value}")
