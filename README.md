# Secure File Upload System (Node.js)

A hardened, battle-tested file upload implementation for Node.js using Express and Multer. This project demonstrates a "Defense-in-Depth" strategy to prevent RCE, XSS, and file spoofing attacks.

## 🛡️ Security Features ("The 3-Layer Defense")

1.  **Gate 1: Strict Input Validation (Multer)**
    *   Allowlist extension check (`.pdf`, `.jpg`, `.png`).
    *   **Double-Extension Detection**: Blocks `shell.php.pdf`.
    *   MIME type verification.

2.  **Gate 2: Storage Hygiene**
    *   Files are renamed to random **UUIDs** (prevent overwrites/predictability).
    *   Uploads stored efficiently outside the web root (safe from direct execution).

3.  **Gate 3: Magic Byte Verification (Signatures)**
    *   Post-upload deep inspection using `file-type`.
    *   Detects and deletes spoofed files (e.g., a text file renamed to `.pdf`).

## 🚀 Quick Start

### 1. Install
```bash
npm install
```

### 2. Run
```bash
npm start
```
Server runs on `http://localhost:3000`.

### 3. Test
Access the test UI at `http://localhost:3000` or use Postman.

## 📂 Project Structure

```
secure-upload-test/
├── src/
│   ├── server.js      # Main entry + Magic Byte validation
│   └── upload.js      # Multer configuration (Extensions/MIME)
├── public/
│   └── client.html    # Simple test frontend
├── docs/
│   ├── SOP.md         # Standard Operating Procedure (Full Documentation)
│   └── POSTMAN_GUIDE.md # Security Testing Guide
└── scripts/           # Helper scripts for generating test payloads
```

## 📚 Documentation

*   **[Standard Operating Procedure (SOP)](docs/SOP.md)**: Detailed security architecture, production checklist, and code recipes.
*   **[Postman Security Guide](docs/POSTMAN_GUIDE.md)**: Logic to verify the defenses against prohibited files.

## 🧪 Security Testing

To generate antivirus-safe test payloads (fake PDFs, blocked extensions):
```bash
node scripts/safe_gen.js
```
Then try uploading the files in `safe_payloads/` to see the protections in action.

## License
MIT
