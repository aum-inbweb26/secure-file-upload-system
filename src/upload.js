import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Allowed MIME types
const ALLOWED_MIMES = ['application/pdf', 'image/jpeg', 'image/png'];

// Dangerous extensions to block specifically if they appear anywhere (double extension attack)
// Note: We are already safelisting extensions, but checking for double extensions like 'file.php.pdf' is safer.
const DANGEROUS_EXTENSIONS_REGEX = /\.(php|php\d|phtml|exe|sh|bash|pl|py|js|jsp|asp|aspx|bat|cmd|vbs|wsf)(\.|$)/i;

// Configure Storage
// defined to save to 'uploads/' with a random UUID name + extension
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Generate random filename
        const uniqueName = uuidv4();
        // Get extension from original name carefully
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${uniqueName}${ext}`);
    }
});

// File Filter Logic
const fileFilter = (req, file, cb) => {
    const originalName = file.originalname.toLowerCase();
    
    // 1. Basic Allowlist separate from MIME (Extension check)
    const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(originalName);
    
    if (!allowedExts.includes(ext)) {
        return cb(new Error('One or more files has an invalid extension. Only PDF, JPG, and PNG are allowed.'));
    }

    // 2. Reject Double Extensions or malicious substrings
    // E.g. 'shell.php.pdf'
    // We check if the filename *before* the final allowed extension contains any dangerous extensions
    // Or simpler: does it match our dangerous pattern?
    if (DANGEROUS_EXTENSIONS_REGEX.test(originalName)) {
        return cb(new Error('Potential double extension attack detected. Upload rejected.'));
    }

    // 3. MIME Type check (trusting client header only lightly - will verification server-side later)
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
        return cb(new Error('Invalid MIME type reported by client.'));
    }

    // Pass
    cb(null, true);
};

// Export configured multer
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2 MB limit
    }
});
