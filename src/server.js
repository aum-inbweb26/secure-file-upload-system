import express from 'express';
import { fileTypeFromFile } from 'file-type';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
// import { imageUpload } from './image_multer.js';
import { pdfUpload } from './pdf_multer.js';
import { validateFile } from './utils/imageCompressor.js';
import { createUploadMiddleware } from './common_config.js';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3000;

// Middleware to handle image upload with validation
const allowedOrigin = ['image/jpeg', 'image/png', 'image/webp'];
const allowedExts = ['.jpg', '.jpeg', '.png']
const imageUpload = createUploadMiddleware({destination: 'uploads', allowedMimes: allowedOrigin, allowedExts,fileSizeLimit: 3 * 1024 * 1024, isImage:true});
const Uploader = (field, targetSize) => { // Default 200 KB
    return (req, res, next) => {

        const uploader = imageUpload.single(field);
        uploader(req, res, async (err) => {
            if (err) return next(err);
            if (!req.file) return next(new Error('No file uploaded.'));

            try {
                if(targetSize){

                    // Recursive compression to target size
                    let compressedBuffer = req.file.buffer;
                    let quality = 80;
                    while (compressedBuffer.length > targetSize && quality > 10) {
                        compressedBuffer = await sharp(req.file.buffer)
                        .webp({ quality })
                        .toBuffer();
                            quality -= 10;
                    }
                    
                    // Save compressed buffer to file
                    const uniqueName = uuidv4();
                    const filePath = path.join('uploads', `${uniqueName}.webp`);
                    await fs.writeFile(filePath, compressedBuffer);
                    
                    // Update req.file properties
                    req.file.path = filePath;
                    req.file.filename = `${uniqueName}.webp`;
                    req.file.size = compressedBuffer.length;
                    
                    await validateFile(req.file.path, allowedOrigin);
                }
                next();
            } catch (validationError) {
                next(validationError);
            }
        });
    };
};

const allowedOriginpdf = ['application/pdf'] 
const imageUploadpdf = createUploadMiddleware({destination: 'uploads', allowedMimes: allowedOriginpdf, allowedExts: ['.pdf'],fileSizeLimit: 3 * 1024 * 1024, isImage:false});
const Uploaderpdf = (field, targetSize) => { // Default 200 KB
    return (req, res, next) => {
        const uploader = imageUploadpdf.single(field);
        uploader(req, res, async (err) => {
            if (err) return next(err);
            if (!req.file) return next(new Error('No file uploaded.'));

            try {
                if(targetSize){

                    // Recursive compression to target size
                    let compressedBuffer = req.file.buffer;
                    let quality = 80;
                    while (compressedBuffer.length > targetSize && quality > 10) {
                        compressedBuffer = await sharp(req.file.buffer)
                        .webp({ quality })
                        .toBuffer();
                            quality -= 10;
                    }
                    
                    // Save compressed buffer to file
                    const uniqueName = uuidv4();
                    const filePath = path.join('uploads', `${uniqueName}.webp`);
                    await fs.writeFile(filePath, compressedBuffer);
                    
                    // Update req.file properties
                    req.file.path = filePath;
                    req.file.filename = `${uniqueName}.webp`;
                    req.file.size = compressedBuffer.length;
                    
                    await validateFile(req.file.path, allowedOrigin);
                }
                next();
            } catch (validationError) {
                next(validationError);
            }
        });
    };
};

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
app.post('/upload/image', Uploader('file', 300 * 1024), (req, res) => {
    console.log(req.file)
    return res.status(200).json({
        message: 'File successfully uploaded and verified secure.',
        filename: req.file.filename,
        detectedType: 'image/webp',
        size: req.file.size
    });
});

// Endpoint 2: PDF Upload
app.post('/upload/pdf',Uploaderpdf('file'), (req, res) => {
    console.log(req.file)
    return res.status(200).json({
        message: 'File successfully uploaded and verified secure.',
        filename: req.file.filename,
        detectedType: 'image/webp',
        size: req.file.size
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    return res.status(400).json({ error: err.message });
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
