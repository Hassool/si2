import { z } from 'zod';
import {
    UserRole,
    DriverStatus,
    VehicleStatus,
    VehicleType,
    ServiceTypeName,
    ShipmentStatus,
    TourStatus,
    InvoiceStatus,
    PaymentMethod,
    IncidentType,
    IncidentStatus,
    ComplaintStatus,
    ComplaintNature,
} from '@/types';

// ============================================================================
// Common Schemas
// ============================================================================

export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');
export const optionalObjectIdSchema = z.union([objectIdSchema, z.string().length(0), z.null()]).optional().transform(val => val === "" || val === null ? undefined : val);

export const addressSchema = z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().min(1, 'Country is required'),
});

export const paginationSchema = z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(10),
});

// ============================================================================
// User Schemas
// ============================================================================

export const createUserSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    role: z.nativeEnum(UserRole),
});

export const updateUserSchema = z.object({
    email: z.string().email('Invalid email address').optional(),
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    role: z.nativeEnum(UserRole).optional(),
    isActive: z.boolean().optional(),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const signUpSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z.string(),
    role: z.nativeEnum(UserRole),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

// ============================================================================
// Client Schemas
// ============================================================================

export const createClientSchema = z.object({
    code: z.string().optional(),
    companyName: z.string().optional(),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(1, 'Phone is required'),
    address: addressSchema,
    notes: z.string().optional(),
});

export const updateClientSchema = createClientSchema.partial().extend({
    isActive: z.boolean().optional(),
    accountBalance: z.number().optional(),
});

// ============================================================================
// Driver Schemas
// ============================================================================

export const createDriverSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(1, 'Phone is required'),
    address: addressSchema,
    licenseNumber: z.string().min(1, 'License number is required'),
    licenseExpiry: z.coerce.date(),
    licenseType: z.string().min(1, 'License type is required'),
    status: z.nativeEnum(DriverStatus).optional().default(DriverStatus.AVAILABLE),
    hireDate: z.coerce.date(),
    notes: z.string().optional(),
});

export const updateDriverSchema = createDriverSchema.partial().extend({
    isActive: z.boolean().optional(),
});

// ============================================================================
// Vehicle Schemas
// ============================================================================

export const createVehicleSchema = z.object({
    registrationNumber: z.string().min(1, 'Registration number is required'),
    type: z.nativeEnum(VehicleType),
    brand: z.string().min(1, 'Brand is required'),
    model: z.string().min(1, 'Model is required'),
    year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
    capacity: z.object({
        weight: z.number().positive('Weight capacity must be positive'),
        volume: z.number().positive('Volume capacity must be positive'),
    }),
    fuelType: z.string().min(1, 'Fuel type is required'),
    fuelConsumption: z.number().positive('Fuel consumption must be positive'),
    status: z.nativeEnum(VehicleStatus).optional().default(VehicleStatus.AVAILABLE),
    lastMaintenanceDate: z.coerce.date().optional(),
    nextMaintenanceDate: z.coerce.date().optional(),
    mileage: z.number().nonnegative().optional().default(0),
    notes: z.string().optional(),
});

export const updateVehicleSchema = createVehicleSchema.partial().extend({
    isActive: z.boolean().optional(),
});

// ============================================================================
// Destination Schemas
// ============================================================================

export const createDestinationSchema = z.object({
    city: z.string().min(1, 'City is required'),
    country: z.string().min(1, 'Country is required'),
    zone: z.string().min(1, 'Zone is required'),
    postalCodeRange: z.object({
        from: z.string(),
        to: z.string(),
    }).optional(),
    baseRate: z.number().nonnegative('Base rate must be non-negative'),
});

export const updateDestinationSchema = createDestinationSchema.partial().extend({
    isActive: z.boolean().optional(),
});

// ============================================================================
// Service Type Schemas
// ============================================================================

export const createServiceTypeSchema = z.object({
    name: z.nativeEnum(ServiceTypeName),
    displayName: z.string().min(1, 'Display name is required'),
    description: z.string().optional(),
    estimatedDeliveryDays: z.object({
        min: z.number().int().positive(),
        max: z.number().int().positive(),
    }),
    multiplier: z.number().positive('Multiplier must be positive'),
});

export const updateServiceTypeSchema = createServiceTypeSchema.partial().extend({
    isActive: z.boolean().optional(),
});

// ============================================================================
// Pricing Schemas
// ============================================================================

export const createPricingSchema = z.object({
    serviceType: objectIdSchema,
    destination: objectIdSchema,
    baseRate: z.number().nonnegative('Base rate must be non-negative'),
    weightRate: z.number().nonnegative('Weight rate must be non-negative'),
    volumeRate: z.number().nonnegative('Volume rate must be non-negative'),
    minCharge: z.number().nonnegative('Minimum charge must be non-negative'),
    effectiveFrom: z.coerce.date(),
    effectiveTo: z.coerce.date().optional(),
});

export const updatePricingSchema = createPricingSchema.partial().extend({
    isActive: z.boolean().optional(),
});

// ============================================================================
// Shipment Schemas
// ============================================================================

export const packageDetailsSchema = z.object({
    description: z.string().min(1, 'Description is required'),
    weight: z.number().positive('Weight must be positive'),
    volume: z.number().positive('Volume must be positive'),
    quantity: z.number().int().positive('Quantity must be positive'),
    declaredValue: z.number().nonnegative().optional(),
});

export const createShipmentSchema = z.object({
    client: objectIdSchema,
    serviceType: objectIdSchema,
    destination: objectIdSchema,

    senderName: z.string().min(1, 'Sender name is required'),
    senderPhone: z.string().min(1, 'Sender phone is required'),
    senderAddress: addressSchema,

    receiverName: z.string().min(1, 'Receiver name is required'),
    receiverPhone: z.string().min(1, 'Receiver phone is required'),
    receiverAddress: addressSchema,

    packages: z.array(packageDetailsSchema).min(1, 'At least one package is required'),

    pickupDate: z.coerce.date().optional(),
    notes: z.string().optional(),
});

export const updateShipmentSchema = createShipmentSchema.partial();

export const updateShipmentStatusSchema = z.object({
    status: z.nativeEnum(ShipmentStatus),
    location: z.string().optional(),
    description: z.string().min(1, 'Description is required'),
});

export const calculatePriceSchema = z.object({
    serviceTypeId: objectIdSchema,
    destinationId: objectIdSchema,
    packages: z.array(z.object({
        weight: z.number().positive(),
        volume: z.number().positive(),
        quantity: z.number().int().positive(),
    })).min(1),
});

// ============================================================================
// Delivery Tour Schemas
// ============================================================================

export const createTourSchema = z.object({
    date: z.coerce.date(),
    driver: objectIdSchema,
    vehicle: objectIdSchema,
    shipments: z.array(objectIdSchema).min(1, 'At least one shipment is required'),
    plannedRoute: z.object({
        startLocation: z.string().min(1),
        endLocation: z.string().min(1),
        estimatedDistance: z.number().positive(),
        estimatedDuration: z.number().positive(),
    }),
    notes: z.string().optional(),
});

export const updateTourSchema = createTourSchema.partial();

export const completeTourSchema = z.object({
    actualRoute: z.object({
        startTime: z.coerce.date(),
        endTime: z.coerce.date(),
        actualDistance: z.number().positive(),
        actualDuration: z.number().positive(),
        fuelConsumed: z.number().positive(),
    }),
    deliveriesCompleted: z.number().int().nonnegative(),
    deliveriesFailed: z.number().int().nonnegative(),
    notes: z.string().optional(),
});

// ============================================================================
// Invoice Schemas
// ============================================================================

export const generateInvoiceSchema = z.object({
    clientId: objectIdSchema,
    shipmentIds: z.array(objectIdSchema).min(1, 'At least one shipment is required'),
    dueInDays: z.number().int().positive().optional().default(30),
    notes: z.string().optional(),
});

export const updateInvoiceSchema = z.object({
    dueDate: z.coerce.date().optional(),
    notes: z.string().optional(),
    status: z.nativeEnum(InvoiceStatus).optional(),
});

// ============================================================================
// Payment Schemas
// ============================================================================

export const createPaymentSchema = z.object({
    invoice: objectIdSchema,
    amount: z.number().positive('Amount must be positive'),
    paymentMethod: z.nativeEnum(PaymentMethod),
    paymentDate: z.coerce.date().optional(),
    reference: z.string().optional(),
    notes: z.string().optional(),
});

export const recordPaymentSchema = z.object({
    amount: z.number().positive('Amount must be positive'),
    paymentMethod: z.nativeEnum(PaymentMethod),
    paymentDate: z.coerce.date().optional(),
    reference: z.string().optional(),
    notes: z.string().optional(),
});

// ============================================================================
// Incident Schemas
// ============================================================================

export const createIncidentSchema = z.object({
    type: z.nativeEnum(IncidentType),
    shipment: optionalObjectIdSchema,
    deliveryTour: optionalObjectIdSchema,
    vehicle: optionalObjectIdSchema,
    driver: optionalObjectIdSchema,
    description: z.string().min(1, 'Description is required'),
    location: z.string().optional(),
    occurredAt: z.coerce.date(),
    documents: z.array(z.string().url()).optional().default([]),
    photos: z.array(z.string().url()).optional().default([]),
}).refine(
    (data) => data.shipment || data.deliveryTour || data.vehicle || data.driver,
    { message: 'At least one related entity (shipment, tour, vehicle, or driver) is required' }
);

export const updateIncidentSchema = z.object({
    type: z.nativeEnum(IncidentType).optional(),
    description: z.string().min(1).optional(),
    location: z.string().optional(),
    documents: z.array(z.string().url()).optional(),
    photos: z.array(z.string().url()).optional(),
    status: z.nativeEnum(IncidentStatus).optional(),
    resolution: z.string().optional(),
});

// ============================================================================
// Complaint Schemas
// ============================================================================

export const createComplaintSchema = z.object({
    client: objectIdSchema.optional(),
    deliveryTour: objectIdSchema.optional(),
    shipments: z.array(objectIdSchema).optional(),
    invoice: objectIdSchema.optional(),
    nature: z.nativeEnum(ComplaintNature),
    description: z.string().min(1, 'Description is required'),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
    attachments: z.array(z.string().url()).optional().default([]),
}).refine(data => data.client || data.deliveryTour, {
    message: "At least a client or a delivery tour must be associated with the complaint",
    path: ["client"]
});

export const updateComplaintSchema = z.object({
    nature: z.nativeEnum(ComplaintNature).optional(),
    description: z.string().min(1).optional(),
    status: z.nativeEnum(ComplaintStatus).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    resolution: z.string().optional(),
    assignedTo: objectIdSchema.optional(),
    attachments: z.array(z.string().url()).optional(),
});

// ============================================================================
// Favorite Schemas
// ============================================================================

export const createFavoriteSchema = z.object({
    featureType: z.enum(['menu', 'report', 'client', 'shipment', 'custom']),
    featureId: z.string().min(1, 'Feature ID is required'),
    label: z.string().min(1, 'Label is required'),
    path: z.string().optional(),
    order: z.number().int().nonnegative().optional().default(0),
});

export const updateFavoriteSchema = createFavoriteSchema.partial();

// ============================================================================
// Upload Schema
// ============================================================================

export const uploadFileSchema = z.object({
    file: z.string().min(1, 'File is required'),
    folder: z.string().optional(),
    resourceType: z.enum(['image', 'video', 'raw', 'auto']).optional(),
});
