import { createUploadMiddleware } from './common_config.js';

export const imageUpload = createUploadMiddleware('uploads', ['image/jpeg', 'image/png', 'image/webp'], ['.jpg', '.jpeg', '.png'], 2 * 1024 * 1024, true);
