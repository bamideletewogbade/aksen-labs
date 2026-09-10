import re
import zipfile

path = r"C:\Users\HP\Desktop\Side Hustle\Aksen-Labs\Aksen-Labs-Business-Blueprint-v0.3.docx"
with zipfile.ZipFile(path) as archive:
    document_xml = archive.read("word/document.xml").decode("utf-8")
    styles_xml = archive.read("word/styles.xml").decode("utf-8")

xml = document_xml + styles_xml
run_colors = re.findall(r'<w:color[^>]*w:val="([0-9A-Fa-f]{6})"', xml)
print("signal_green_text_runs:", sum(1 for color in run_colors if color.upper() == "7CFF62"))
print("accessible_emerald_text_runs:", sum(1 for color in run_colors if color.upper() == "125F38"))
print("legacy_gold_text_runs:", sum(1 for color in run_colors if color.upper() == "F4C542"))
print("legacy_cyan_text_runs:", sum(1 for color in run_colors if color.upper() == "38D6D6"))
print("document_xml_ok:", "<w:body>" in document_xml)
