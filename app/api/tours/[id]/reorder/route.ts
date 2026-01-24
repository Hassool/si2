import { connectDB } from '@/lib/db';
import DeliveryTour from '@/models/DeliveryTour';
import {
    withErrorHandler,
    successResponse,
    errorResponse,
} from '@/lib/api-utils';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const reorderSchema = z.object({
    shipmentIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)),
});

/**
 * PATCH /api/tours/[id]/reorder
 * Reorder shipments in a tour
 */
export const PATCH = withErrorHandler(async (
    request: Request,
    context?: { params: Promise<Record<string, string>> }
) => {
    await requireAuth();
    await connectDB();

    const { id } = await context!.params;
    const body = await request.json();

    const parsed = reorderSchema.safeParse(body);
    if (!parsed.success) {
        return errorResponse('Invalid shipment IDs provided', 400);
    }

    const tour = await DeliveryTour.findById(id);
    if (!tour) {
        return errorResponse('Delivery tour not found', 404);
    }

    // Update the shipments array order
    tour.shipments = parsed.data.shipmentIds as any;
    await tour.save();

    await tour.populate([
        'driver',
        'vehicle',
        {
            path: 'shipments',
            populate: ['client', 'destination'],
        }
    ]);

    return successResponse(tour, 'Shipments reordered successfully');
});
