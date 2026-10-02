import { supabase } from './supabase';

export interface UploadedCaseFile {
  name: string;
  size: number;
  type: string;
  storagePath?: string;
  publicUrl?: string;
  uploadedAt: string;
}

const BUCKET_NAME = 'case-documents';

/**
 * Upload a document to Supabase Storage 'case-documents' bucket.
 * Gracefully falls back to local blob URL if bucket is not yet provisioned.
 */
export async function uploadCaseDocument(
  file: File,
  userId: string = 'anonymous',
  threadId?: string
): Promise<UploadedCaseFile> {
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${userId}/${threadId || 'general'}/${timestamp}_${sanitizedName}`;

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.warn("Notice: Supabase Storage upload failed, using client fallback:", error.message);
      return {
        name: file.name,
        size: file.size,
        type: file.type,
        publicUrl: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString()
      };
    }

    // Get public or signed URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return {
      name: file.name,
      size: file.size,
      type: file.type,
      storagePath: data.path,
      publicUrl: urlData?.publicUrl || URL.createObjectURL(file),
      uploadedAt: new Date().toISOString()
    };
  } catch (err) {
    console.warn("Storage upload exception, using local object URL:", err);
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      publicUrl: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString()
    };
  }
}

/**
 * Upload multiple files concurrently.
 */
export async function uploadMultipleCaseDocuments(
  files: File[],
  userId: string = 'anonymous',
  threadId?: string
): Promise<UploadedCaseFile[]> {
  const uploadPromises = files.map(file => uploadCaseDocument(file, userId, threadId));
  return Promise.all(uploadPromises);
}
