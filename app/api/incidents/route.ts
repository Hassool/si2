import { connectDB } from '@/lib/db';
import Incident from '@/models/Incident';
import Shipment from '@/models/Shipment';
import { ShipmentStatus } from '@/types';
import {
    withErrorHandler,
    successResponse,
    createdResponse,
    errorResponse,
    getPaginationParams,
    createPaginationMeta,
    buildSortOptions,
    buildStatusFilter,
} from '@/lib/api-utils';
import { requireAuth } from '@/lib/auth';
import { createIncidentSchema, updateIncidentSchema } from '@/lib/validations/schemas';

/**
 * GET /api/incidents
 */
export const GET = withErrorHandler(async (request: Request) => {
    await requireAuth();
    await connectDB();

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(searchParams);
    const statusFilter = buildStatusFilter(searchParams);
    const sortOptions = buildSortOptions(searchParams, '-occurredAt');

    const filter: Record<string, unknown> = { ...statusFilter };

    const type = searchParams.get('type');
    if (type) {
        filter.type = type;
    }

    const shipment = searchParams.get('shipment');
    if (shipment) {
        filter.shipment = shipment;
    }

    const tour = searchParams.get('tour');
    if (tour) {
        filter.deliveryTour = tour;
    }

    const unresolved = searchParams.get('unresolved');
    if (unresolved === 'true') {
        const incidents = await Incident.findUnresolved();
        return successResponse(incidents);
    }

    const [incidents, total] = await Promise.all([
        Incident.find(filter)
            .populate('shipment')
            .populate('deliveryTour')
            .populate('vehicle')
            .populate('driver')
            .populate('reportedBy', 'name')
            .sort(sortOptions)
            .skip(skip)
            .limit(limit),
        Incident.countDocuments(filter),
    ]);

    const pagination = createPaginationMeta(page, limit, total);

    return successResponse(incidents, undefined, pagination);
});

/**
 * POST /api/incidents
 */
export const POST = withErrorHandler(async (request: Request) => {
    const { user } = await requireAuth();
    await connectDB();

    const body = await request.json();
    const parsed = createIncidentSchema.safeParse(body);

    if (!parsed.success) {

        return errorResponse(parsed.error.issues.map(e => e.message).join(', '), 400);
    }

    // Generate incident number here to avoid validation issues
    const incidentNumber = await (Incident as any).generateIncidentNumber();

    const incident = new Incident({
        ...parsed.data,
        incidentNumber,
        reportedBy: user.id,
    });

    await incident.save();

    // If incident is related to a shipment, update shipment status
    if (incident.shipment) {
        await Shipment.findByIdAndUpdate(incident.shipment, {
            $push: {
                trackingHistory: {
                    timestamp: new Date(),
                    status: ShipmentStatus.FAILED_DELIVERY,
                    description: `Incident reported: ${incident.type}`,
                    updatedBy: user.id,
                },
            },
        });
    }

    await incident.populate('shipment deliveryTour vehicle driver reportedBy');

    return createdResponse(incident, 'Incident reported successfully');
});
