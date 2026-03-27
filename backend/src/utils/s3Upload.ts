import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

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
const baseUrl = process.env.SUPABASE_S3_ENDPOINT?.replace('/storage/v1/s3', '') || '';

/**
 * Upload image to Supabase S3 storage
 * @param buffer Image buffer (processed by sharp)
 * @param key S3 key/path (e.g., 'products/28/image-1-28.webp')
 * @returns Public URL of uploaded image
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

    // Return public URL
    const publicUrl = `${baseUrl}/storage/v1/object/public/${bucket}/${key}`;
    console.log(`✅ Uploaded to S3: ${key}`);
    return publicUrl;
  } catch (error) {
    console.error('❌ S3 upload failed:', error);
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
