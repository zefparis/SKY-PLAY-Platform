import { S3Client } from '@aws-sdk/client-s3';

export const getS3Config = () => {
  const region = process.env.AWS_REGION || 'eu-west-1';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in environment variables.');
  }

  return {
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  };
};

export const s3Client = new S3Client(getS3Config());

export const getS3BucketName = () => {
  const bucketName = process.env.AWS_S3_BUCKET_NAME || 'skyplay';
  return bucketName;
};
