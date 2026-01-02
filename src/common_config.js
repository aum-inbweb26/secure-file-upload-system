import multer from "multer";
import sharpMulter from "sharp-multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";



// Shared dangerous extension regex
export const DANGEROUS_EXTENSIONS_REGEX =
  /\.(php|php\d|phtml|exe|sh|bash|pl|py|js|jsp|asp|aspx|bat|cmd|vbs|wsf)(\.|$)/i;

export function createUploadMiddleware(
  {destination,
  allowedMimes,
  allowedExts,
  fileSizeLimit = 2 * 1024 * 1024,
  isImage = false}
) {
  let storage;

  if (isImage) {
    storage = multer.memoryStorage();
  } else {
    storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, destination);
      },
      filename: (req, file, cb) => {
        const uniqueName = uuidv4();
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${uniqueName}${ext}`);
      },
    });
  }

  const fileFilter = (req, file, cb) => {
    const originalName = file.originalname.toLowerCase();
    const ext = path.extname(originalName);

    if (!allowedExts.includes(ext)) {
      return cb(new Error("Invalid file type."));
    }

    if (DANGEROUS_EXTENSIONS_REGEX.test(originalName)) {
      return cb(
        new Error(
          "Potential double extension attack detected. Upload rejected."
        )
      );
    }

    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error("Invalid MIME type reported by client."));
    }

    cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: fileSizeLimit },
  });
}
