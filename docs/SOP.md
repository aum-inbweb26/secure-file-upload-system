# Standard Operating Procedure (SOP): Secure File Upload System

**Version:** 1.0  
**Effective Date:** 2026-01-01   

---

## 1. Objective
To establish a secure standard for handling user-generated file uploads in Node.js applications. This protocol effectively mitigates Remote Code Execution (RCE), XSS, and file spoofing attacks by implementing a "Defense-in-Depth" strategy.

## 2. Security Architecture (The 3-Layer Defense)

All file uploads must pass through three distinct security gates. **Bypassing any gate is strictly prohibited.**

### Gate 1: Pre-Upload Filtering (Multer)
*   **Allowlist Only:** Only specific extensions (`.pdf`, `.jpg`, `.png`) are permitted.
*   **Double-Extension Block:** Filenames containing executable extensions (e.g., `file.php.pdf`) are rejected via Regex pattern matching.
*   **MIME Check:** Incoming `Content-Type` header is validated against the allowlist.

### Gate 2: Storage Hygiene
*   **Randomization:** Files must be renamed using **UUIDv4** to prevent overwriting existing system files.
*   **Isolation:** The storage directory (`/uploads`) must **never** be exposed as a static asset folder (i.e., no `express.static('/uploads')`).
*   **No Execution:** The storage volume should ideally be mounted as `noexec` in production environments.

### Gate 3: Post-Upload Validation (Magic Bytes)
*   **Signature Verification:** After storage, the server reads the file's binary header (Magic Bytes).
*   **Validation:** If the binary signature does not match the extension (e.g., a script renamed as `.pdf`), the file is **immediately deleted**.

---

## 3. Operational Workflow

### 3.1 Prerequisites
*   Node.js (LTS Version)
*   NPM
*   Write permissions for the application on the `uploads/` directory.

### 3.2 Installation & Startup
1.  **Clone/Navigate** to the project directory.
2.  **Install Dependencies:**
    ```bash
    npm install
    ```
3.  **Start the Service:**
    ```bash
    npm start
    ```
    *Server runs on port 3000 by default.*

### 3.3 Testing Procedure
Periodic security testing using the provided test scripts is mandatory after any code changes.

1.  **Generate Test Payloads:**
    ```bash
    node safe_gen.js
    ```
    *Creates harmless test files in `safe_payloads/`.*

2.  **Execution:**
    Use Postman or the provided `client.html` to attempt uploading:
    *   `valid_doc.pdf` → **MUST PASS**
    *   `test_double.php.pdf` → **MUST FAIL** (400 Bad Request)
    *   `test_fake.pdf` → **MUST FAIL** (400 Bad Request)

---

## 4. API Specification

### Endpoint: Upload File
**URL:** `POST /upload`  
**Content-Type:** `multipart/form-data`

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `file` | File | Yes | Max size 2MB. Allowed: PDF, JPG, PNG. |

#### Responses

**200 OK (Success)**
```json
{
  "message": "File successfully uploaded and verified secure.",
  "filename": "a4f1...89b.pdf",
  "detectedType": "application/pdf"
}
```

**400 Bad Request (Security Failure)**
```json
{
  "error": "Potential double extension attack detected. Upload rejected."
}
```

---

## 5. Maintenance & Troubleshooting

### Incident: "Magic Byte Validation Failed"
*   **Cause:** User uploaded a file that is corrupted or is a spoofed file (e.g., text file renamed to PDF).
*   **Action:** System correctly deleted the file. No action needed unless false positives occur on valid files.

### Incident: "Upload Blocked"
*   **Cause:** File extension or MIME type is not in the strictly allowed list.
*   **Action:** If a new file type is business-critical (e.g., `.docx`), update **both** `upload.js` (extension list) and `server.js` (magic byte list).

---

## 6. Critical Security Rules
1.  **NEVER** trust `req.file.originalname` for storage.
2.  **NEVER** disable the `file-type` check for performance reasons; it is the primary defense against spoofing.
3.  **ALWAYS** respond with generic error messages to avoid leaking server details.

---

## 7. Secure Implementation Recipes

Use these snippets to adapt the system for specific use cases.

### Scenario A: Strict Image Uploads (Profile Pictures)
**Goal:** Allow only JPG/PNG. Reject everything else (including PDFs).

**1. Update `fileFilter` in `src/upload.js`**
```javascript
const fileFilter = (req, file, cb) => {
    // 1. Extension Allowlist (Images Only)
    const allowedExts = ['.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (!allowedExts.includes(ext)) return cb(new Error('Only JPG and PNG images are allowed.'));
    
    // 2. Double Extension Check
    if (/\.(php|exe|sh|bat)(\.|$)/i.test(file.originalname.toLowerCase())) {
        return cb(new Error('Security Block: Invalid filename format.'));
    }

    // 3. MIME Check
    const allowedMimes = ['image/jpeg', 'image/png'];
    if (!allowedMimes.includes(file.mimetype)) return cb(new Error('Invalid image type.'));

    cb(null, true);
};
```

**2. Update Magic Byte Logic in `src/server.js`**
```javascript
// ... inside the upload handler ...
const typeInfo = await fileTypeFromFile(filePath);
const allowedMimes = ['image/jpeg', 'image/png'];

if (!typeInfo || !allowedMimes.includes(typeInfo.mime)) {
    await fs.unlink(filePath); // Delete immediately
    throw new Error('File is not a valid image.');
}
```

---

### Scenario B: Document Uploads (KYC/Resume)
**Goal:** Allow PDF only.

**1. Update `fileFilter` in `src/upload.js`**
```javascript
const fileFilter = (req, file, cb) => {
    // 1. Extension Allowlist
    if (path.extname(file.originalname).toLowerCase() !== '.pdf') {
        return cb(new Error('Only PDF documents are allowed.'));
    }
    
    // 2. Double Extension Check
    if (/\.(php|exe)(\.|$)/i.test(file.originalname.toLowerCase())) {
        return cb(new Error('Security Block.'));
    }

    // 3. MIME Check
    if (file.mimetype !== 'application/pdf') return cb(new Error('Invalid document type.'));

    cb(null, true);
};
```

**2. Update Magic Byte Logic in `src/server.js`**
```javascript
const typeInfo = await fileTypeFromFile(filePath);

// Strict PDF signature check
if (!typeInfo || typeInfo.mime !== 'application/pdf') {
    await fs.unlink(filePath);
    throw new Error('File is not a valid PDF document.');
}
```

---

## 8. Production Readiness Checklist

Before deploying this system to a live environment, verify the following:

- [ ] **Filesystem Permissions:** Ensure the node process can write to `/uploads`, but cannot *execute* files in it (mount with `noexec` if possible).
- [ ] **Rate Limiting:** Implement `express-rate-limit` on the `/upload` endpoint to prevent DoS attacks via disk filling.
- [ ] **File Lifecycle:** Set up a cron job to clean up old or temporary files if they are not permanently relevant.
- [ ] **Max File Size:** Confirm `limits: { fileSize: 2 * 1024 * 1024 }` matches your infrastructure capacity (e.g., Nginx client_max_body_size).
- [ ] **Logging:** Ensure all rejected uploads are logged with IPs for forensic analysis.

---

## 9. Cloud Storage Adaptation (AWS S3)

In a scalable production environment, do not store files on the local disk. Use AWS S3 (or compatible object storage).

**Changes Required:**

1.  **Use `multer-s3`:** Replace `diskStorage` with `multer-s3`.
2.  **Stream Validation:** Since the file is streamed to S3, you cannot "delete it after upload" easily. Instead:
    *   **Option A (Lambda Trigger):** Upload to a "quarantine" bucket. Trigger an AWS Lambda to run the `file-type` check. If valid, move to "public" bucket.
    *   **Option B (Buffer):** Use `multer.memoryStorage()`. This keeps the file in RAM. Validate Magic Bytes in memory *before* sending to S3.
        *   *Warning:* limit max file size strictly (e.g., 5MB) to avoid OOM crashes.

---

## 10. Incident Response Plan

If a malicious file bypasses security:

1.  **Isolate:** Immediately take the upload service offline.
2.  **Identify:** Scan the `/uploads` directory for files created in the suspected time window.
3.  **Analyze:** Check logs for IPs that uploaded rejected files repeatedly (reconnaissance behavior).
4.  **Remediate:** 
    *   Delete the malicious file.
    *   Rotate AWS keys if S3 was used.
    *   Patch the `fileFilter` regex or `allowedMimes` list if a new bypass technique was used.

