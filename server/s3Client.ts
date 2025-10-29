import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION || !process.env.AWS_S3_BUCKET_NAME) {
  throw new Error('AWS credentials not configured. Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, and AWS_S3_BUCKET_NAME');
}

export const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

export async function uploadToS3(key: string, file: Buffer, contentType?: string) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
  });

  await s3Client.send(command);
  return key;
}

export async function downloadFromS3(key: string) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const response = await s3Client.send(command);
  return response.Body;
}

export async function deleteFromS3(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

export async function deleteFolder(prefix: string) {
  // List all objects with the given prefix
  const listCommand = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: prefix,
  });

  const listResponse = await s3Client.send(listCommand);
  
  if (!listResponse.Contents || listResponse.Contents.length === 0) {
    return;
  }

  // Delete all objects
  for (const object of listResponse.Contents) {
    if (object.Key) {
      await deleteFromS3(object.Key);
    }
  }
}

export async function getDownloadUrl(key: string, filename: string) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${filename}"`,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}
