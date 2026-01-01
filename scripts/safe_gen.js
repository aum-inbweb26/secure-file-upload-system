import fs from 'fs';
import path from 'path';

// ensure directory exists
const targetDir = path.resolve('safe_payloads');
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir);
}

console.log('Generating Antivirus-Safe Test Files in: ' + targetDir);

// 1. Valid PDF (Minimal valid PDF header, harmless)
// We use a shorter, cleaner PDF header that won't trigger AV
const pdfHeader = '%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000111 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF';
fs.writeFileSync(path.join(targetDir, 'valid_doc.pdf'), pdfHeader);

// 2. Valid Image (Minimal valid JPG header)
const jpgHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]);
fs.writeFileSync(path.join(targetDir, 'valid_image.jpg'), jpgHeader);

// 3. Double Extension Test
// NAME: test_double.php.pdf
// CONTENT: Plain text. Safe.
// REASON: Tests if the app regex blocks "php.pdf"
fs.writeFileSync(path.join(targetDir, 'test_double.php.pdf'), 'This is just a text file for testing double extensions.');

// 4. Bad Extension Test 
// NAME: test_blocked.php
// CONTENT: Plain text. Safe. NO <?php tags to verify extension blocking without triggering AV.
// REASON: Tests if the app blocks .php extension.
fs.writeFileSync(path.join(targetDir, 'test_blocked.php'), 'This is a text file. The server should block it based on extension.');

// 5. Magic Byte Spoof Test
// NAME: test_fake.pdf
// CONTENT: Plain text. Safe.
// REASON: Tests if the app checks file content vs extension.
fs.writeFileSync(path.join(targetDir, 'test_fake.pdf'), 'This is a text file masked as a PDF.');

console.log('Done! Files are safe to use.');
