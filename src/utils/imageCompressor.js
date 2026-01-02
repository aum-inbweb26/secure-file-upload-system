import sharp from "sharp";
import fs from "fs";
import { promises as fsPromises } from "fs";
import * as path from "path";
import { fileTypeFromFile } from "file-type";

/**
 * Convert image to WebP format using Sharp
 * Preserves original dimensions - NO RESIZING
 * Just converts format and applies quality compression
 * @param {string} inputPath - Path to the input image file
 * @param {string} outputPath - Path where the converted image will be saved
 * @param {object} options - Compression options
 * @returns {Promise<object>} - Object containing success status and file info
 */
async function compressToWebP(inputPath, outputPath, options = {}) {
  try {
    const {
      quality = 95, // WebP quality setting (10-100)
    } = options;

    // Validate input file exists
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input file not found: ${inputPath}`);
    }

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    await fsPromises.mkdir(outputDir, { recursive: true });

    // Ensure output path has .webp extension
    let finalOutputPath = outputPath.replace(/\.(webp|jpg|png|gif)$/i, '.webp');

    // Get original file stats
    const originalStats = await fsPromises.stat(inputPath);

    // Use sharp for conversion (NO RESIZING - preserve original dimensions)
    const qualityValue = Math.max(10, Math.min(100, quality));
    await sharp(inputPath)
      .webp({ quality: qualityValue })
      .toFile(finalOutputPath);

    // Get file stats
    const stats = await fsPromises.stat(finalOutputPath);
    const compressionRatio = (
      ((originalStats.size - stats.size) / originalStats.size) *
      100
    ).toFixed(2);

    return {
      success: true,
      inputFile: inputPath,
      outputFile: finalOutputPath,
      originalSize: originalStats.size,
      compressedSize: stats.size,
      compressionRatio: `${compressionRatio}%`,
      format: "webp",
      quality: qualityValue,
      fileSizeKB: (originalStats.size / 1024).toFixed(2),
    };
  } catch (error) {
    console.error("Error converting image to WebP:", error);
    throw new Error(`Image conversion failed: ${error.message}`);
  }
}

/**
 * Compress image with multiple quality options using Sharp
 * @param {string} inputPath - Path to the input image file
 * @param {string} outputDir - Directory where variants will be saved
 * @param {string} filename - Output filename without extension
 * @param {object} options - Compression options
 * @returns {Promise<object>} - Object containing all variants
 */
async function compressWithVariants(
  inputPath,
  outputDir,
  filename,
  options = {}
) {
  try {
    const {
      qualities = [60, 75, 85],
      thumbnail = true,
      thumbnailSize = 150,
    } = options;

    // Ensure output directory exists
    await fsPromises.mkdir(outputDir, { recursive: true });

    const results = {};

    // Compress with different quality levels using sharp
    for (const quality of qualities) {
      const outputPath = path.join(
        outputDir,
        `${filename}-q${quality}.webp`
      );
      const result = await compressToWebP(inputPath, outputPath, {
        quality: quality,
      });
      results[`quality_${quality}`] = result;
    }

    // Create thumbnail if requested
    if (thumbnail) {
      const thumbPath = path.join(outputDir, `${filename}-thumb.webp`);
      const thumbResult = await compressToWebP(inputPath, thumbPath, {
        quality: 75,
        width: thumbnailSize,
        height: thumbnailSize,
        fit: "cover",
      });
      results.thumbnail = thumbResult;
    }

    return {
      success: true,
      variants: results,
    };
  } catch (error) {
    console.error("Error creating image variants:", error);
    throw new Error(`Image variant creation failed: ${error.message}`);
  }
}

/**
 * Convert image to WebP format using Sharp
 * Preserves original dimensions - NO RESIZING
 * Just converts format and applies quality compression
 * @param {string} inputPath - Path to the input image file
 * @param {string} outputPath - Path where the converted image will be saved
 * @param {object} options - Compression options
 * @returns {Promise<object>} - Object containing success status and file info
 */
async function compressImage(inputPath, outputPath, options = {}) {
  try {
    const {
      quality = 95, // WebP quality setting (10-100)
    } = options;

    // Validate input file exists
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input file not found: ${inputPath}`);
    }

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    await fsPromises.mkdir(outputDir, { recursive: true });

    // Get original file stats
    const originalStats = await fsPromises.stat(inputPath);

    // Default output as WebP for better compression
    let finalOutputPath = outputPath.replace(/\.(webp|jpg|png|gif)$/i, '.webp');

    // Use sharp for conversion (NO RESIZING - preserve original dimensions)
    const qualityValue = Math.max(10, Math.min(100, quality));
    await sharp(inputPath)
      .webp({ quality: qualityValue })
      .toFile(finalOutputPath);

    // Get file stats
    const stats = await fsPromises.stat(finalOutputPath);
    const compressionRatio = (
      ((originalStats.size - stats.size) / originalStats.size) *
      100
    ).toFixed(2);

    return {
      success: true,
      inputFile: inputPath,
      outputFile: finalOutputPath,
      originalSize: originalStats.size,
      compressedSize: stats.size,
      compressionRatio: `${compressionRatio}%`,
      format: "webp",
      quality: qualityValue,
      fileSizeKB: (originalStats.size / 1024).toFixed(2),
    };
  } catch (error) {
    console.error("Error converting image:", error);
    throw new Error(`Image conversion failed: ${error.message}`);
  }
}

/**
 * Convert buffer to WebP using Sharp
 * Preserves original dimensions - NO RESIZING
 * Just converts format and applies quality compression
 * @param {Buffer} buffer - Image buffer
 * @param {object} options - Compression options
 * @returns {Promise<Buffer>} - WebP buffer
 */
async function bufferToWebP(buffer, options = {}) {
  try {
    const {
      quality = 95, // WebP quality setting (10-100)
    } = options;

    // Use sharp to process buffer (NO RESIZING - preserve original dimensions)
    const qualityValue = Math.max(10, Math.min(100, quality));
    const webpBuffer = await sharp(buffer)
      .webp({ quality: qualityValue })
      .toBuffer();

    return webpBuffer;
  } catch (error) {
    console.error("Error converting buffer to WebP:", error);
    throw new Error(`Buffer conversion failed: ${error.message}`);
  }
}

/**
 * Convert image to WebP format with compression using Sharp
 * Preserves original dimensions - NO RESIZING
 * Just converts format and applies quality compression
 * @param {string} inputPath - Path to the input image file
 * @param {string} outputPath - Path where the WebP image will be saved
 * @param {object} options - Compression options
 * @returns {Promise<object>} - Object containing success status and file info
 */
async function convertToWebP(inputPath, outputPath, options = {}) {
  try {
    const {
      quality = 95, // WebP quality setting (10-100)
    } = options;

    // Validate input file exists
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input file not found: ${inputPath}`);
    }

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    await fsPromises.mkdir(outputDir, { recursive: true });

    // Ensure output path has .webp extension
    let finalOutputPath = outputPath.replace(/\.(webp|jpg|png|gif)$/i, '.webp');

    // Get original file stats
    const originalStats = await fsPromises.stat(inputPath);

    // Use sharp for WebP conversion (NO RESIZING - preserve original dimensions)
    const qualityValue = Math.max(10, Math.min(100, quality));
    await sharp(inputPath)
      .webp({ quality: qualityValue })
      .toFile(finalOutputPath);

    // Get compressed file stats
    const stats = await fsPromises.stat(finalOutputPath);
    const compressionRatio = (
      ((originalStats.size - stats.size) / originalStats.size) *
      100
    ).toFixed(2);

    return {
      success: true,
      inputFile: inputPath,
      outputFile: finalOutputPath,
      originalSize: originalStats.size,
      compressedSize: stats.size,
      compressionRatio: `${compressionRatio}%`,
      format: "webp",
      quality: qualityValue,
      fileSizeKB: (originalStats.size / 1024).toFixed(2),
    };
  } catch (error) {
    console.error("Error converting to WebP:", error);
    throw new Error(`WebP conversion failed: ${error.message}`);
  }
}

/**
 * Get image metadata using Sharp
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<object>} - Image metadata
 */
async function getImageMetadata(imagePath) {
  try {
    if (!fs.existsSync(imagePath)) {
      throw new Error(`File not found: ${imagePath}`);
    }

    // Use sharp to get metadata
    const metadata = await sharp(imagePath).metadata();
    const stats = await fsPromises.stat(imagePath);

    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format || "unknown",
      size: stats.size,
      space: metadata.space || "sRGB",
      hasAlpha: metadata.hasAlpha || false,
      orientation: metadata.orientation || 1,
      density: metadata.density || 72,
      channels: metadata.channels || 3,
      depth: metadata.depth || "8-bit",
    };
  } catch (error) {
    console.error("Error getting image metadata:", error);
    throw new Error(`Failed to get metadata: ${error.message}`);
  }
}

/**
 * Validate file type using magic bytes
 * @param {string} filePath - Path to the file
 * @param {string[]} allowedMimes - Array of allowed MIME types
 * @returns {Promise<void>} - Throws error if invalid
 */
async function validateFile(filePath, allowedMimes) {
  try {
    const typeInfo = await fileTypeFromFile(filePath);

    if (!typeInfo) {
      throw new Error('Could not determine file signature. Possible fake file.');
    }

    if (!allowedMimes.includes(typeInfo.mime)) {
      throw new Error(`Magic-byte check failed. Detected: ${typeInfo.mime}`);
    }

    console.log(`Valid file: ${path.basename(filePath)} detected as ${typeInfo.mime}`);
  } catch (error) {
    console.error('Validation failed:', error.message);
    try {
      await fsPromises.unlink(filePath);
    } catch (unlinkErr) {
      console.error('Error deleting file:', unlinkErr);
    }
    throw error;
  }
}

export {
  compressToWebP,
  convertToWebP, // New WebP conversion function
  compressWithVariants,
  compressImage,
  bufferToWebP,
  getImageMetadata,
  validateFile,
};