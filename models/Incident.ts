import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { IIncident, IncidentType, IncidentStatus } from '@/types';

export interface IIncidentDocument extends Omit<IIncident, '_id' | 'shipment' | 'deliveryTour' | 'vehicle' | 'driver' | 'resolvedBy' | 'reportedBy'>, Document {
    shipment?: Types.ObjectId;
    deliveryTour?: Types.ObjectId;
    vehicle?: Types.ObjectId;
    driver?: Types.ObjectId;
    resolvedBy?: Types.ObjectId;
    reportedBy: Types.ObjectId;
}

interface IIncidentModel extends Model<IIncidentDocument> {
    generateIncidentNumber(): Promise<string>;
    findByShipment(shipmentId: Types.ObjectId | string): Promise<IIncidentDocument[]>;
    findByTour(tourId: Types.ObjectId | string): Promise<IIncidentDocument[]>;
    findUnresolved(): Promise<IIncidentDocument[]>;
}

const incidentSchema = new Schema<IIncidentDocument>(
    {
        incidentNumber: {
            type: String,
        },
        type: {
            type: String,
            enum: Object.values(IncidentType),
            required: [true, 'Incident type is required'],
        },

        // Related entities (at least one required)
        shipment: {
            type: Schema.Types.ObjectId,
            ref: 'Shipment',
        },
        deliveryTour: {
            type: Schema.Types.ObjectId,
            ref: 'DeliveryTour',
        },
        vehicle: {
            type: Schema.Types.ObjectId,
            ref: 'Vehicle',
        },
        driver: {
            type: Schema.Types.ObjectId,
            ref: 'Driver',
        },

        description: {
            type: String,
            required: [true, 'Description is required'],
        },
        location: String,
        occurredAt: {
            type: Date,
            required: [true, 'Occurrence date is required'],
        },

        // Evidence (Cloudinary URLs)
        documents: [{
            type: String,
        }],
        photos: [{
            type: String,
        }],

        status: {
            type: String,
            enum: Object.values(IncidentStatus),
            default: IncidentStatus.REPORTED,
        },
        resolution: String,
        resolvedAt: Date,
        resolvedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },

        reportedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Reporter is required'],
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual: is resolved
incidentSchema.virtual('isResolved').get(function () {
    return this.status === IncidentStatus.RESOLVED || this.status === IncidentStatus.CLOSED;
});

// Virtual: time to resolution
incidentSchema.virtual('resolutionTime').get(function () {
    if (!this.resolvedAt) return null;
    const diffMs = this.resolvedAt.getTime() - this.createdAt.getTime();
    return Math.round(diffMs / (1000 * 60 * 60)); // hours
});

// Generate unique incident number
incidentSchema.statics.generateIncidentNumber = async function (): Promise<string> {
    const prefix = 'INC';
    const date = new Date();
    const dateStr = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;

    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const count = await this.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    return `${prefix}-${dateStr}-${(count + 1).toString().padStart(3, '0')}`;
};

// Find incidents by shipment
incidentSchema.statics.findByShipment = function (shipmentId: Types.ObjectId | string) {
    return this.find({ shipment: shipmentId })
        .populate('reportedBy resolvedBy')
        .sort({ occurredAt: -1 });
};

// Find incidents by tour
incidentSchema.statics.findByTour = function (tourId: Types.ObjectId | string) {
    return this.find({ deliveryTour: tourId })
        .populate('reportedBy resolvedBy shipment')
        .sort({ occurredAt: -1 });
};

// Find unresolved incidents
incidentSchema.statics.findUnresolved = function () {
    return this.find({
        status: { $in: [IncidentStatus.REPORTED, IncidentStatus.UNDER_INVESTIGATION] },
    })
        .populate('shipment deliveryTour vehicle driver reportedBy')
        .sort({ occurredAt: -1 });
};

// Pre-save: generate incident number if missing
incidentSchema.pre('save', async function () {
    if (!this.incidentNumber) {
        const IncidentModel = this.constructor as any;
        this.incidentNumber = await IncidentModel.generateIncidentNumber();
    }
});

// Validate at least one related entity
incidentSchema.pre('save', function () {
    if (!this.shipment && !this.deliveryTour && !this.vehicle && !this.driver) {
        throw new Error('At least one related entity is required');
    }
});

// Indexes
incidentSchema.index({ incidentNumber: 1 });
incidentSchema.index({ type: 1 });
incidentSchema.index({ status: 1 });
incidentSchema.index({ shipment: 1 });
incidentSchema.index({ deliveryTour: 1 });
incidentSchema.index({ occurredAt: -1 });

const Incident: IIncidentModel =
    (mongoose.models.Incident as IIncidentModel) ||
    mongoose.model<IIncidentDocument, IIncidentModel>('Incident', incidentSchema);

export default Incident;
