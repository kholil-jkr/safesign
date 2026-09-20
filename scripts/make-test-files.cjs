// Create test files: minimal DOCX + TXT for extract-file endpoint testing
const fs = require("node:fs");
const { execSync } = require("node:child_process");

// --- minimal DOCX via zip (python) ---
const py = `
import zipfile
doc_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
<w:p><w:r><w:t>EMPLOYMENT CONTRACT - KONTRAK KERJA</w:t></w:r></w:p>
<w:p><w:r><w:t>Article 1: The Employee agrees to work as domestic helper for 24 months.</w:t></w:r></w:p>
<w:p><w:r><w:t>Pasal 4: Gaji adalah 900 SAR per bulan, dibayar setiap 3 bulan.</w:t></w:r></w:p>
<w:p><w:r><w:t>Article 7: Passport will be held by the Employer for safekeeping.</w:t></w:r></w:p>
</w:body></w:document>'''
ct = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>'''
rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>'''
with zipfile.ZipFile('/tmp/test-contract.docx', 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('[Content_Types].xml', ct)
    z.writestr('_rels/.rels', rels)
    z.writestr('word/document.xml', doc_xml)
print('docx written')
`;
execSync(`python3 -c '${py.replace(/'/g, "'\\''")}'`, { stdio: "inherit" });

fs.writeFileSync("/tmp/test-contract.txt", "EMPLOYMENT CONTRACT\nPasal 1: Pekerja setuju bekerja selama 24 bulan.\nPasal 4: Gaji 900 SAR per bulan.\n");
console.log("txt written");
