import { registerAs } from '@nestjs/config';

export default registerAs('s3', () => ({
  region: process.env.AWS_REGION || 'ap-southeast-1',
  bucket: process.env.AWS_S3_BUCKET || 'project-management-uploads',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,

  // Public URL base (direct S3 or CloudFront domain)
  publicUrlBase:
    process.env.AWS_PUBLIC_URL_BASE ||
    `https://${process.env.AWS_S3_BUCKET || 'project-management-uploads'}.s3.${process.env.AWS_REGION || 'ap-southeast-1'}.amazonaws.com`,

  maxFileSize: {
    image: parseInt(process.env.MAX_IMAGE_SIZE || '10485760', 10), // 10 MB
    document: parseInt(process.env.MAX_DOCUMENT_SIZE || '52428800', 10), // 50 MB
  },

  allowedMimeTypes: {
    image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    document: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
  },

  maxFilesPerUpload: parseInt(process.env.MAX_FILES_PER_UPLOAD || '10', 10),
}));
