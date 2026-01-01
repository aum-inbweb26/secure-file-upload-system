import express from 'express';
import { fileTypeFromFile } from 'file-type';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { imageUpload } from './image_multer.js';
import { pdfUpload } from './pdf_multer.js';

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

// Reusable Validation Handler
const handleUpload = (req, res, allowedMimes) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    const filePath = req.file.path;

    (async () => {
        try {
            // Magic Byte Validation
            const typeInfo = await fileTypeFromFile(filePath);

            if (!typeInfo) {
                throw new Error('Could not determine file signature. Possible fake file.');
            }

            if (!allowedMimes.includes(typeInfo.mime)) {
                throw new Error(`Magic-byte check failed. Detected: ${typeInfo.mime}`);
            }

            console.log(`Valid file uploaded: ${req.file.filename} detected as ${typeInfo.mime}`);

            return res.status(200).json({
                message: 'File successfully uploaded and verified secure.',
                filename: req.file.filename,
                detectedType: typeInfo.mime,
                size: req.file.size
            });

        } catch (validationError) {
            console.error('Security Validation Failed:', validationError.message);
            try {
                await fs.unlink(filePath);
            } catch (unlinkErr) { console.error(unlinkErr); }

            return res.status(400).json({ error: 'Security validation failed: ' + validationError.message });
        }
    })();
};

// Endpoint 1: Image Upload (JPG/PNG)
app.post('/upload/image', (req, res) => {
    const uploader = imageUpload.single('file');
    uploader(req, res, (err) => {
        if (err) return res.status(400).json({ error: err.message });
        handleUpload(req, res, ['image/jpeg', 'image/png']);
    });
});

// Endpoint 2: PDF Upload
app.post('/upload/pdf', (req, res) => {
    const uploader = pdfUpload.single('file');
    uploader(req, res, (err) => {
        if (err) return res.status(400).json({ error: err.message });
        handleUpload(req, res, ['application/pdf']);
    });
});

// Legacy Endpoint (Optional: supports both if needed, but easier to deprecate)
// For now, we will map /upload to /upload/image for backward compat in this test or just 404
// Let's keep it simple and update Client to use specific routes.

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Endpoints:');
    console.log(' - POST /upload/image');
    console.log(' - POST /upload/pdf');
});
