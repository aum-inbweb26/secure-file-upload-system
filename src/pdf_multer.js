import multer from 'multer';
import path from 'path';
import { storage, DANGEROUS_EXTENSIONS_REGEX } from './common_config.js';

// Allowed MIME types for PDFs
const ALLOWED_MIMES = ['application/pdf'];

const fileFilter = (req, file, cb) => {
    const originalName = file.originalname.toLowerCase();

    // 1. Strict Allowlist (Extension)
    const allowedExts = ['.pdf'];
    const ext = path.extname(originalName);

    if (!allowedExts.includes(ext)) {
        return cb(new Error('Invalid file type. Only PDF is allowed.'));
    }

    // 2. Reject Double Extensions
    if (DANGEROUS_EXTENSIONS_REGEX.test(originalName)) {
        return cb(new Error('Potential double extension attack detected. Upload rejected.'));
    }

    // 3. Client MIME check
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
        return cb(new Error('Invalid MIME type reported by client.'));
    }

    cb(null, true);
};

export const pdfUpload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2 MB limit
    }
});
