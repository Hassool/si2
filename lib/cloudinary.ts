import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
console.log('Cloudinary Config:', {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY ? 'Present' : 'Missing',
    api_secret: process.env.CLOUDINARY_API_SECRET ? 'Present' : 'Missing',
});

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
    publicId: string;
    url: string;
    secureUrl: string;
    format: string;
    width?: number;
    height?: number;
    bytes: number;
    resourceType: string;
}

export interface UploadOptions {
    folder?: string;
    resourceType?: 'image' | 'video' | 'raw' | 'auto';
    allowedFormats?: string[];
    maxFileSize?: number; // in bytes
    transformation?: Record<string, unknown>;
}

const DEFAULT_OPTIONS: UploadOptions = {
    folder: 'transport-delivery',
    resourceType: 'auto',
    maxFileSize: 10 * 1024 * 1024, // 10MB
};

/**
 * Upload a file to Cloudinary from a base64 string or URL
 */
export async function uploadToCloudinary(
    file: string,
    options: UploadOptions = {}
): Promise<UploadResult> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    try {
        const result = await cloudinary.uploader.upload(file, {
            folder: opts.folder,
            resource_type: opts.resourceType,
            allowed_formats: opts.allowedFormats,
            transformation: opts.transformation,
        });

        return {
            publicId: result.public_id,
            url: result.url,
            secureUrl: result.secure_url,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
            resourceType: result.resource_type,
        };
    } catch (error: any) {
        console.error('Cloudinary upload error:', error);
        throw new Error(`Failed to upload file to cloud storage: ${error.message || 'Unknown error'}`);
    }
}

/**
 * Upload multiple files to Cloudinary
 */
export async function uploadMultipleToCloudinary(
    files: string[],
    options: UploadOptions = {}
): Promise<UploadResult[]> {
    const uploadPromises = files.map((file) => uploadToCloudinary(file, options));
    return Promise.all(uploadPromises);
}

/**
 * Delete a file from Cloudinary by public ID
 */
export async function deleteFromCloudinary(
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<boolean> {
    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        });
        return result.result === 'ok';
    } catch (error) {
        return false;
    }
}

/**
 * Delete multiple files from Cloudinary
 */
export async function deleteMultipleFromCloudinary(
    publicIds: string[],
    resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<{ deleted: string[]; failed: string[] }> {
    try {
        const result = await cloudinary.api.delete_resources(publicIds, {
            resource_type: resourceType,
        });

        const deleted: string[] = [];
        const failed: string[] = [];

        for (const [id, status] of Object.entries(result.deleted)) {
            if (status === 'deleted') {
                deleted.push(id);
            } else {
                failed.push(id);
            }
        }

        return { deleted, failed };
    } catch (error) {
        return { deleted: [], failed: publicIds };
    }
}

/**
 * Generate a transformation URL for an existing image
 */
export function getTransformedUrl(
    publicId: string,
    transformations: Record<string, unknown>
): string {
    return cloudinary.url(publicId, transformations);
}

/**
 * Convert a File/Blob to base64 for upload (client-side helper)
 */
export function fileToBase64(file: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export { cloudinary };
