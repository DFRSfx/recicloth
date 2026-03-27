import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.SUPABASE_S3_REGION || 'eu-west-1',
  credentials: {
    accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY || '',
    secretAccessKey: process.env.SUPABASE_S3_SECRET_KEY || '',
  },
  endpoint: process.env.SUPABASE_S3_ENDPOINT,
  forcePathStyle: true,
});

const bucket = process.env.SUPABASE_S3_BUCKET || 'images-storage';

/**
 * Upload image to Supabase S3 storage
 * @param buffer Image buffer (processed by sharp)
 * @param key S3 key/path (e.g., 'products/28/image-1-28.webp')
 * @returns Relative path only (e.g., '/products/28/image-1-28.webp')
 */
export async function uploadToS3(buffer: Buffer, key: string): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: 'image/webp',
      ACL: 'public-read',
    });

    await s3Client.send(command);

    // Return relative path only (full URL constructed on frontend)
    const relativePath = `/${key}`;
    console.log(`✅ Uploaded to S3: ${key}`);
    return relativePath;
  } catch (error) {
    console.error('❌ S3 upload failed:', error);
    throw error;
  }
}

/**
 * Generate a signed URL for accessing a private S3 object
 * Useful for private buckets - URL expires after expirationSeconds
 * @param key S3 key/path (e.g., 'products/28/image-1-28.webp')
 * @param expirationSeconds How long URL is valid (default: 1 hour)
 * @returns Signed URL valid for specified duration
 */
export async function generateSignedUrl(
  key: string,
  expirationSeconds: number = 3600
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: expirationSeconds,
    });

    return signedUrl;
  } catch (error) {
    console.error('❌ Signed URL generation failed:', error);
    throw error;
  }
}

/**
 * Delete image from S3 storage
 * @param key S3 key/path to delete
 */
export async function deleteFromS3(key: string): Promise<void> {
  try {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await s3Client.send(command);
    console.log(`✅ Deleted from S3: ${key}`);
  } catch (error) {
    console.error('❌ S3 delete failed:', error);
    // Don't throw — deletion failures shouldn't block the operation
  }
}
