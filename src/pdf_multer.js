import { createUploadMiddleware } from './common_config.js';

export const pdfUpload = createUploadMiddleware('uploads', ['application/pdf'], ['.pdf'], 2 * 1024 * 1024, false);
