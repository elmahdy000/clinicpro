import { BadRequestException } from '@nestjs/common';
import { extname } from 'path';

/**
 * Allowed MIME types — octet-stream intentionally excluded to prevent
 * extension spoofing (e.g. a .exe disguised as octet-stream).
 */
export const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'application/dicom',
  'application/x-dicom',
  // Zip allowed for bundled medical reports only
  'application/zip',
  'application/x-zip-compressed',
]);

/**
 * Allowed file extensions — acts as a second layer against MIME spoofing.
 * A file must pass BOTH mime type AND extension checks.
 */
export const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.pdf',
  '.doc', '.docx',
  '.xls', '.xlsx',
  '.txt', '.csv',
  '.dcm',          // DICOM medical imaging
  '.zip',
]);

/** Max upload size: 10 MB */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Multer fileFilter callback — rejects disallowed types early (before disk write).
 */
export function allowedFileFilter(
  _req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, accept: boolean) => void,
): void {
  const ext = extname(file.originalname).toLowerCase();

  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(
      new BadRequestException(
        `File type "${file.mimetype}" is not allowed. Allowed types: images, PDF, Word, Excel, CSV, DICOM, ZIP.`,
      ),
      false,
    );
  }

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(
      new BadRequestException(
        `File extension "${ext}" is not allowed.`,
      ),
      false,
    );
  }

  cb(null, true);
}

/**
 * Validates an already-uploaded file object (post-upload safety check).
 * Throws BadRequestException if the file fails validation.
 */
export function validateUploadedFile(file: Express.Multer.File): void {
  if (!file) throw new BadRequestException('No file was uploaded.');

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new BadRequestException(
      `File size ${(file.size / 1024 / 1024).toFixed(2)} MB exceeds the 10 MB limit.`,
    );
  }

  const ext = extname(file.originalname).toLowerCase();

  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw new BadRequestException(`File type "${file.mimetype}" is not allowed.`);
  }

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new BadRequestException(`File extension "${ext}" is not allowed.`);
  }

  // Detect double-extension attacks (e.g. "malware.php.pdf")
  const baseName = file.originalname.slice(0, file.originalname.length - ext.length);
  const innerExt = extname(baseName).toLowerCase();
  if (innerExt && !ALLOWED_EXTENSIONS.has(innerExt)) {
    throw new BadRequestException(
      `Suspicious filename "${file.originalname}" contains a potentially dangerous inner extension.`,
    );
  }
}
