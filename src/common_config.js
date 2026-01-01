import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export const storage = multer.diskStorage({
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

// Shared dangerous extension regex
export const DANGEROUS_EXTENSIONS_REGEX = /\.(php|php\d|phtml|exe|sh|bash|pl|py|js|jsp|asp|aspx|bat|cmd|vbs|wsf)(\.|$)/i;
