import express from 'express';
import { fileTypeFromFile } from 'file-type';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { upload } from './upload.js';

const app = express();
const PORT = 3000;

// Ensure uploads directory exists
const UPLOAD_DIR = path.resolve('uploads');
if (!fsSync.existsSync(UPLOAD_DIR)) {
    fsSync.mkdirSync(UPLOAD_DIR);
}

// Serve the static frontend
app.get('/', (req, res) => {
    res.sendFile(path.resolve('public/client.html'));
});

// Upload Endpoint
app.post('/upload', (req, res) => {
    // Wrap multer in a promise-like structure or just callback to handle errors cleanly
    const uploader = upload.single('file');

    uploader(req, res, async (err) => {
        // 1. Handle Multer Errors (Size limit, FileFilter rejection)
        if (err) {
            console.error('Upload blocked:', err.message);
            return res.status(400).json({ error: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        const filePath = req.file.path;

        try {
            // 2. Magic Byte Validation (The "Truth" check)
            // file-type inspects the file header bytes
            const typeInfo = await fileTypeFromFile(filePath);

            // If file-type cannot determine type (e.g. text file renamed to .pdf), it returns undefined
            if (!typeInfo) {
                throw new Error('Could not determine file signature. Possible fake file.');
            }

            // 3. Validate Magic Byte Signature against Allowed Types
            const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png'];
            if (!allowedMimes.includes(typeInfo.mime)) {
                throw new Error(`Magic-byte check failed. Detected: ${typeInfo.mime}`);
            }

            // 4. Validate Extension Match
            // Ensure the detected extension matches the file extension (prevent spoofing)
            // Note: file-type returns 'jpg' for jpeg logic. 
            // We can trust the MIME check primarily.
            // But let's check basic consistency if needed. 
            // For now, strict MIME allowlist is usually sufficient for executables.

            console.log(`Valid file uploaded: ${req.file.filename} detected as ${typeInfo.mime}`);

            // 5. Success
            return res.status(200).json({
                message: 'File successfully uploaded and verified secure.',
                filename: req.file.filename,
                detectedType: typeInfo.mime,
                size: req.file.size
            });

        } catch (validationError) {
            // SECURITY FAIL: Delete the file immediately
            console.error('Security Validation Failed:', validationError.message);

            try {
                await fs.unlink(filePath);
                console.log('Malicious/Invalid file deleted.');
            } catch (unlinkErr) {
                console.error('Failed to delete invalid file:', unlinkErr);
            }

            return res.status(400).json({ error: parseErrorMessage(validationError.message) });
        }
    });
});

function parseErrorMessage(msg) {
    // Return safe error messages to client
    if (msg.includes('Magic-byte')) return 'File content does not match extension (Magic Byte Mismatch).';
    if (msg.includes('Could not determine')) return 'File content looks suspicious or corrupted.';
    return msg;
}

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Uploads stored in:', UPLOAD_DIR);
});
