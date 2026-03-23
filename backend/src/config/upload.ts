import multer from 'multer';
import sharp, { ResizeOptions } from 'sharp';
import { Request, Response, NextFunction } from 'express';

// Store files in memory as buffer
const storage = multer.memoryStorage();

// File filter - only images
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images are allowed.'), false);
  }
};

// Create multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  }
});

// Middleware to process images with Sharp
export const processImages = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
    return next();
  }

  try {
    const files = req.files as Express.Multer.File[];

    // Process each image
    const processedFiles = await Promise.all(
      files.map(async (file, index) => {
        try {
          const originalSize = file.size;
          const originalFormat = file.mimetype;

          console.log(`\n📸 Processing image ${index + 1}/${files.length}:`);
          console.log(`   Original: ${file.originalname} (${(originalSize / 1024).toFixed(2)} KB, ${originalFormat})`);

          // Get image metadata (width, height, etc.)
          const metadata = await sharp(file.buffer).metadata();

          const { width, height } = metadata;

          // Define max dimensions — adjust to your needs
          const maxWidth = 1920;
          const maxHeight = 1080;

          // Only resize if image exceeds max limits
          const resizeOptions: ResizeOptions = {};

          if ((typeof width === 'number' && width > maxWidth) || (typeof height === 'number' && height > maxHeight)) {
            resizeOptions.width = maxWidth;
            resizeOptions.height = maxHeight;
            resizeOptions.fit = "inside";
            resizeOptions.withoutEnlargement = true;
          }

          // Convert and compress to WebP
          const processedBuffer = await sharp(file.buffer)
            .resize(resizeOptions) // resize only if needed
            .webp({
              quality: 80, // Optimal balance between quality and size (80-85 is recommended)
              effort: 6,
              smartSubsample: true,
            })
            .toBuffer();

          const newSize = processedBuffer.length;
          const compression = ((1 - newSize / originalSize) * 100).toFixed(2);

          console.log(`   ✅ Converted: ${file.originalname.replace(/\.[^/.]+$/, '.webp')} (${(newSize / 1024).toFixed(2)} KB, image/webp)`);
          console.log(`   💾 Compression: ${compression}% reduction`);

          // Update file metadata
          file.buffer = processedBuffer;
          file.mimetype = "image/webp";
          file.size = processedBuffer.length;
          file.originalname = file.originalname.replace(/\.[^/.]+$/, ".webp");

          return file;
        } catch (error) {
          console.error("❌ Error processing image:", error);
          throw new Error(`Failed to process image: ${file.originalname}`);
        }
      })
    );


    console.log(`\n✨ Successfully processed ${processedFiles.length} image(s)\n`);

    // Replace req.files with processed files
    req.files = processedFiles;
    next();
  } catch (error) {
    console.error('Image processing error:', error);
    res.status(400).json({ error: 'Failed to process images' });
  }
};

export default upload;

