import { NextResponse } from 'next/server';
import { withErrorHandler, successResponse, errorResponse } from '@/lib/api-utils';
import { requireAuth } from '@/lib/auth';
import { uploadToCloudinary, uploadMultipleToCloudinary } from '@/lib/cloudinary';
import { uploadFileSchema } from '@/lib/validations/schemas';

/**
 * POST /api/upload
 * Upload file(s) to Cloudinary
 */
export const POST = withErrorHandler(async (request: Request) => {
    // Require authentication
    await requireAuth();

    const body = await request.json();
    console.log('Upload request body keys:', Object.keys(body));
    console.log('Folder:', body.folder);

    // Handle multiple files
    if (Array.isArray(body.files)) {
        const results = await uploadMultipleToCloudinary(
            body.files,
            {
                folder: body.folder || 'transport-delivery',
                resourceType: body.resourceType || 'auto',
            }
        );

        return successResponse(results, 'Files uploaded successfully');
    }

    // Handle single file
    const parsed = uploadFileSchema.safeParse(body);
    if (!parsed.success) {
        return errorResponse(parsed.error.issues.map(e => e.message).join(', '), 400);
    }

    const { file, folder, resourceType } = parsed.data;

    const result = await uploadToCloudinary(file, {
        folder: folder || 'transport-delivery',
        resourceType: resourceType || 'auto',
    });

    return successResponse(result, 'File uploaded successfully');
});
