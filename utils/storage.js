const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  HeadBucketCommand
} = require('@aws-sdk/client-s3');

const BUCKET_NAME = process.env.NEON_ASSETS_BUCKET || 'assets';
const hasS3Config = !!(
  process.env.AWS_ENDPOINT_URL_S3 &&
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY
);

let s3Client = null;

if (hasS3Config) {
  s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-southeast-1',
    endpoint: process.env.AWS_ENDPOINT_URL_S3,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true, // Required for Neon S3-compatible storage endpoints
  });
}

/**
 * Upload an asset buffer/string to Neon S3 Object Storage
 */
async function uploadAsset(key, body, contentType = 'application/octet-stream') {
  if (!s3Client) {
    throw new Error('Neon Object Storage credentials not configured.');
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  const res = await s3Client.send(command);
  return {
    success: true,
    bucket: BUCKET_NAME,
    key,
    etag: res.ETag,
    url: `${process.env.AWS_ENDPOINT_URL_S3}/${BUCKET_NAME}/${key}`
  };
}

/**
 * Fetch an asset from Neon S3 Object Storage
 */
async function getAsset(key) {
  if (!s3Client) {
    throw new Error('Neon Object Storage credentials not configured.');
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const res = await s3Client.send(command);
  const streamToBuffer = async (stream) => {
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
  };

  const buffer = await streamToBuffer(res.Body);
  return {
    success: true,
    contentType: res.ContentType,
    contentLength: res.ContentLength,
    buffer
  };
}

/**
 * List assets in Neon bucket
 */
async function listAssets(prefix = '', maxKeys = 50) {
  if (!s3Client) {
    return { success: false, items: [], message: 'Neon S3 not configured' };
  }

  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: prefix,
    MaxKeys: maxKeys,
  });

  const res = await s3Client.send(command);
  return {
    success: true,
    bucket: BUCKET_NAME,
    itemCount: res.KeyCount || 0,
    items: (res.Contents || []).map(obj => ({
      key: obj.Key,
      size: obj.Size,
      lastModified: obj.LastModified
    }))
  };
}

/**
 * Delete an asset from Neon S3 Object Storage
 */
async function deleteAsset(key) {
  if (!s3Client) {
    throw new Error('Neon Object Storage credentials not configured.');
  }

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
  return { success: true, key };
}

/**
 * Perform a healthcheck on Neon Object Storage
 */
async function checkStorageHealth() {
  if (!s3Client) {
    return {
      status: 'disabled',
      configured: false,
      message: 'Neon S3 credentials not set'
    };
  }

  try {
    const listRes = await listAssets('', 5);
    return {
      status: 'connected',
      configured: true,
      bucket: BUCKET_NAME,
      itemCount: listRes.itemCount,
      endpoint: process.env.AWS_ENDPOINT_URL_S3
    };
  } catch (err) {
    return {
      status: 'error',
      configured: true,
      bucket: BUCKET_NAME,
      error: err.message
    };
  }
}

module.exports = {
  s3Client,
  uploadAsset,
  getAsset,
  listAssets,
  deleteAsset,
  checkStorageHealth,
  BUCKET_NAME,
  hasS3Config
};
