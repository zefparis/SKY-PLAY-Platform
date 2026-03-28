import { S3Client } from '@aws-sdk/client-s3';

export const getS3Config = () => {
  const region = process.env.AWS_REGION || 'eu-west-1';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    console.warn('⚠️  AWS S3 credentials not configured. Avatar upload will not work.');
    console.warn('   Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in environment variables.');
    return null;
  }

  return {
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  };
};

export const isS3Configured = () => {
  return !!process.env.AWS_ACCESS_KEY_ID && !!process.env.AWS_SECRET_ACCESS_KEY;
};

export const s3Client = isS3Configured() ? new S3Client(getS3Config()!) : null;

export const getS3BucketName = () => {
  const bucketName = process.env.AWS_S3_BUCKET_NAME || 'skyplay';
  return bucketName;
};
