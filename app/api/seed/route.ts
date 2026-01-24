import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import {
    User,
    Client,
    Driver,
    Vehicle,
    Destination,
    ServiceType,
    Pricing,
    Shipment,
    DeliveryTour,
    Invoice,
    Payment,
    Incident,
    Complaint,
} from '@/models';
import { UserRole, DriverStatus, VehicleStatus, VehicleType, ServiceTypeName, ShipmentStatus, TourStatus, InvoiceStatus, PaymentMethod, IncidentType, IncidentStatus, ComplaintStatus, ComplaintNature } from '@/types';
import bcrypt from 'bcryptjs';

export async function POST() {
    try {
        await connectDB();

        // 1. Clear existing data (Optional: Use with caution in production)
        // For development, we might want to clear some collections to avoid duplicates
        // But for safety, let's just create new ones or skip if they exist.
        // Actually, to ensure a clean state for the demo, let's clear them.
        
        await Promise.all([
            User.deleteMany({ email: { $ne: 'keep@example.com' } }), // Keep some if needed
            Client.deleteMany({}),
            Driver.deleteMany({}),
            Vehicle.deleteMany({}),
            Destination.deleteMany({}),
            ServiceType.deleteMany({}),
            Pricing.deleteMany({}),
            Shipment.deleteMany({}),
            DeliveryTour.deleteMany({}),
            Invoice.deleteMany({}),
            Payment.deleteMany({}),
            Incident.deleteMany({}),
            Complaint.deleteMany({}),
        ]);

        const plaintextPassword = 'password123';

        // 2. Create Users
        const users = await User.create([
            { name: 'System Admin', email: 'admin@example.com', password: plaintextPassword, role: UserRole.ADMIN, isActive: true },
            { name: 'Senior Agent Sarah', email: 'sarah.agent@example.com', password: plaintextPassword, role: UserRole.AGENT, isActive: true },
            { name: 'Agent John', email: 'john@example.com', password: plaintextPassword, role: UserRole.AGENT, isActive: true },
            { name: 'Agent Mike', email: 'mike@example.com', password: plaintextPassword, role: UserRole.AGENT, isActive: true },
            { name: 'Lead Driver Bob', email: 'bob.driver@example.com', password: plaintextPassword, role: UserRole.DRIVER, isActive: true },
            { name: 'Driver Alice', email: 'alice.driver@example.com', password: plaintextPassword, role: UserRole.DRIVER, isActive: true },
            { name: 'Driver Tom', email: 'tom@example.com', password: plaintextPassword, role: UserRole.DRIVER, isActive: true },
            { name: 'Driver Jerry', email: 'jerry@example.com', password: plaintextPassword, role: UserRole.DRIVER, isActive: true },
            { name: 'Driver Spike', email: 'spike@example.com', password: plaintextPassword, role: UserRole.DRIVER, isActive: true },
        ]);

        const adminUser = users[0];

        // 3. Create Service Types
        const serviceTypes = await ServiceType.create([
            { code: 'STD', name: ServiceTypeName.STANDARD, displayName: 'Standard Delivery', description: '3-5 business days', estimatedDeliveryDays: { min: 3, max: 5 }, multiplier: 1 },
            { code: 'EXP', name: ServiceTypeName.EXPRESS, displayName: 'Express Delivery', description: '1-2 business days', estimatedDeliveryDays: { min: 1, max: 2 }, multiplier: 1.5 },
            { code: 'INT', name: ServiceTypeName.INTERNATIONAL, displayName: 'International', description: '7-14 business days', estimatedDeliveryDays: { min: 7, max: 14 }, multiplier: 2.5 },
        ]);

        // 4. Create Destinations
        const destinations = await Destination.create([
            { code: 'FR-PAR', city: 'Paris', country: 'France', zone: 'Zone A', baseRate: 10 },
            { code: 'FR-LYO', city: 'Lyon', country: 'France', zone: 'Zone B', baseRate: 15 },
            { code: 'FR-MAR', city: 'Marseille', country: 'France', zone: 'Zone C', baseRate: 18 },
            { code: 'FR-BOR', city: 'Bordeaux', country: 'France', zone: 'Zone B', baseRate: 14 },
            { code: 'FR-LIL', city: 'Lille', country: 'France', zone: 'Zone A', baseRate: 12 },
        ]);

        // 5. Create Pricing
        const pricings = [];
        for (const st of serviceTypes) {
            for (const dest of destinations) {
                pricings.push({
                    serviceType: st._id,
                    destination: dest._id,
                    baseRate: dest.baseRate * st.multiplier,
                    weightRate: 2 * st.multiplier,
                    volumeRate: 1 * st.multiplier,
                    minCharge: dest.baseRate * 1.5 * st.multiplier,
                    effectiveFrom: new Date(),
                });
            }
        }
        await Pricing.create(pricings);

        // 6. Create Clients
        const clients = await Client.create([
            { code: 'CLT000001', firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', phone: '0123456789', address: { street: '123 Rue de la Paix', city: 'Paris', postalCode: '75001', country: 'France' } },
            { code: 'CLT000002', companyName: 'Tech Corp', firstName: 'Charlie', lastName: 'Brown', email: 'charlie@techcorp.com', phone: '0987654321', address: { street: '456 Business Blvd', city: 'Lyon', postalCode: '69001', country: 'France' } },
            { code: 'CLT000003', firstName: 'David', lastName: 'Miller', email: 'david@example.com', phone: '0111222333', address: { street: '789 Pine Rd', city: 'Marseille', postalCode: '13001', country: 'France' } },
            { code: 'CLT000004', companyName: 'Global Logistics', firstName: 'Eva', lastName: 'Green', email: 'eva@global.com', phone: '0444555666', address: { street: '101 Port Way', city: 'Bordeaux', postalCode: '33000', country: 'France' } },
            { code: 'CLT000005', firstName: 'Frank', lastName: 'Ocean', email: 'frank@example.com', phone: '0777888999', address: { street: '202 Wave St', city: 'Lille', postalCode: '59000', country: 'France' } },
        ]);

        // 7. Create Drivers
        const drivers = await Driver.create([
            { employeeId: 'DRV0001', firstName: 'Bob', lastName: 'Driver', email: 'bob.driver@example.com', phone: '0700000001', licenseNumber: 'LIC0001', licenseExpiry: new Date('2030-01-01'), licenseType: 'Class B', status: DriverStatus.AVAILABLE, hireDate: new Date('2022-01-01'), address: { street: '1 Driver St', city: 'Paris', postalCode: '75001', country: 'France' } },
            { employeeId: 'DRV0002', firstName: 'Alice', lastName: 'Wheel', email: 'alice.driver@example.com', phone: '0700000002', licenseNumber: 'LIC0002', licenseExpiry: new Date('2030-01-01'), licenseType: 'Class B', status: DriverStatus.ON_TOUR, hireDate: new Date('2022-02-01'), address: { street: '2 Driver St', city: 'Lyon', postalCode: '69001', country: 'France' } },
            { employeeId: 'DRV0003', firstName: 'Tom', lastName: 'Road', email: 'tom@example.com', phone: '0700000003', licenseNumber: 'LIC0003', licenseExpiry: new Date('2030-01-01'), licenseType: 'Class C', status: DriverStatus.AVAILABLE, hireDate: new Date('2022-03-01'), address: { street: '3 Driver St', city: 'Marseille', postalCode: '13001', country: 'France' } },
            { employeeId: 'DRV0004', firstName: 'Jerry', lastName: 'Track', email: 'jerry@example.com', phone: '0700000004', licenseNumber: 'LIC0004', licenseExpiry: new Date('2030-01-01'), licenseType: 'Class C', status: DriverStatus.OFF_DUTY, hireDate: new Date('2022-04-01'), address: { street: '4 Driver St', city: 'Bordeaux', postalCode: '33000', country: 'France' } },
            { employeeId: 'DRV0005', firstName: 'Spike', lastName: 'Dog', email: 'spike@example.com', phone: '0700000005', licenseNumber: 'LIC0005', licenseExpiry: new Date('2030-01-01'), licenseType: 'Class B', status: DriverStatus.ON_LEAVE, hireDate: new Date('2022-05-01'), address: { street: '5 Driver St', city: 'Lille', postalCode: '59000', country: 'France' } },
        ]);

        // 8. Create Vehicles
        const vehicles = await Vehicle.create([
            { registrationNumber: 'AB-123-CD', type: VehicleType.TRUCK, brand: 'Renault', model: 'Master', year: 2022, capacity: { weight: 3500, volume: 15 }, fuelType: 'Diesel', fuelConsumption: 10, status: VehicleStatus.AVAILABLE },
            { registrationNumber: 'EF-456-GH', type: VehicleType.VAN, brand: 'Mercedes', model: 'Sprinter', year: 2023, capacity: { weight: 2000, volume: 10 }, fuelType: 'Diesel', fuelConsumption: 8, status: VehicleStatus.IN_USE },
            { registrationNumber: 'IJ-789-KL', type: VehicleType.MOTORCYCLE, brand: 'Yamaha', model: 'NMAX', year: 2021, capacity: { weight: 50, volume: 0.2 }, fuelType: 'Gasoline', fuelConsumption: 3, status: VehicleStatus.AVAILABLE },
            { registrationNumber: 'MN-012-OP', type: VehicleType.TRUCK, brand: 'Volvo', model: 'FH', year: 2020, capacity: { weight: 15000, volume: 50 }, fuelType: 'Diesel', fuelConsumption: 25, status: VehicleStatus.MAINTENANCE },
            { registrationNumber: 'QR-345-ST', type: VehicleType.VAN, brand: 'Peugeot', model: 'Expert', year: 2022, capacity: { weight: 1500, volume: 7 }, fuelType: 'Electric', fuelConsumption: 0, status: VehicleStatus.AVAILABLE },
        ]);

        // 9. Create Shipments
        const shipmentsData = [];
        for (let i = 1; i <= 15; i++) {
            const clientIdx = i % clients.length;
            const destIdx = i % destinations.length;
            const stIdx = i % serviceTypes.length;
            shipmentsData.push({
                shipmentNumber: `SHP-20260123-${i.toString().padStart(4, '0')}`,
                client: clients[clientIdx]._id,
                serviceType: serviceTypes[stIdx]._id,
                destination: destinations[destIdx]._id,
                senderName: `${clients[clientIdx].firstName} ${clients[clientIdx].lastName}`,
                senderPhone: clients[clientIdx].phone,
                senderAddress: clients[clientIdx].address,
                receiverName: `Receiver ${i}`,
                receiverPhone: '0100000000',
                receiverAddress: { street: `${i} Receiver St`, city: destinations[destIdx].city, postalCode: '00000', country: 'France' },
                packages: [{ description: `Package ${i}`, weight: 1 + i, volume: 0.1 * i, quantity: 1 }],
                status: i % 5 === 0 ? ShipmentStatus.DELIVERED : ShipmentStatus.PENDING,
                totalWeight: 1 + i,
                totalVolume: 0.1 * i,
                priceBreakdown: { baseAmount: 10 * i, weightAmount: 2 * i, volumeAmount: i, additionalFees: 0, discount: 0 },
                totalAmount: 13 * i,
                isInvoiced: i % 5 === 0,
            });
        }
        const shipments = await Shipment.create(shipmentsData);

        // 10. Create Delivery Tours
        const tours = await DeliveryTour.create([
            { tourNumber: 'TOR-20260123-001', date: new Date(), driver: drivers[0]._id, vehicle: vehicles[0]._id, shipments: [shipments[0]._id, shipments[1]._id], status: TourStatus.PLANNED, plannedRoute: { startLocation: 'Warehouse A', endLocation: 'Warehouse A', estimatedDistance: 50, estimatedDuration: 120 } },
            { tourNumber: 'TOR-20260123-002', date: new Date(), driver: drivers[1]._id, vehicle: vehicles[1]._id, shipments: [shipments[2]._id, shipments[3]._id], status: TourStatus.IN_PROGRESS, plannedRoute: { startLocation: 'Warehouse B', endLocation: 'Warehouse B', estimatedDistance: 80, estimatedDuration: 180 } },
            { tourNumber: 'TOR-20260123-003', date: new Date(), driver: drivers[2]._id, vehicle: vehicles[2]._id, shipments: [shipments[4]._id], status: TourStatus.COMPLETED, plannedRoute: { startLocation: 'Warehouse A', endLocation: 'Warehouse A', estimatedDistance: 30, estimatedDuration: 60 }, actualRoute: { startTime: new Date(), endTime: new Date(), actualDistance: 32, actualDuration: 70, fuelConsumed: 2 }, deliveriesCompleted: 1 },
        ]);

        // 11. Create Invoices
        const invoicesData = [];
        for (let i = 0; i < 5; i++) {
            const deliveredShipment = shipments.find((s, idx) => s.status === ShipmentStatus.DELIVERED && idx >= i);
            if (deliveredShipment) {
                invoicesData.push({
                    invoiceNumber: `INV-202601-${(i + 1).toString().padStart(4, '0')}`,
                    client: deliveredShipment.client,
                    shipments: [deliveredShipment._id],
                    amountHT: deliveredShipment.totalAmount,
                    tvaRate: 0.19,
                    tvaAmount: deliveredShipment.totalAmount * 0.19,
                    totalTTC: deliveredShipment.totalAmount * 1.19,
                    amountPaid: i % 2 === 0 ? deliveredShipment.totalAmount * 1.19 : 0,
                    amountDue: i % 2 === 0 ? 0 : deliveredShipment.totalAmount * 1.19,
                    status: i % 2 === 0 ? InvoiceStatus.PAID : InvoiceStatus.PENDING,
                    issueDate: new Date(),
                    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                });
            }
        }
        const invoices = await Invoice.create(invoicesData);

        // 12. Create Payments
        for (let i = 0; i < invoices.length; i++) {
            if (invoices[i].status === InvoiceStatus.PAID) {
                await Payment.create({
                    paymentNumber: `PAY-20260123-${(i + 1).toString().padStart(4, '0')}`,
                    invoice: invoices[i]._id,
                    client: invoices[i].client,
                    amount: invoices[i].totalTTC,
                    paymentMethod: PaymentMethod.BANK_TRANSFER,
                    paymentDate: new Date(),
                });
            }
        }

        // 13. Create Incidents
        await Incident.create([
            { incidentNumber: 'INC-20260123-001', type: IncidentType.ACCIDENT, deliveryTour: tours[0]._id, vehicle: vehicles[0]._id, driver: drivers[0]._id, description: 'Minor scratch during backup.', location: 'Paris', occurredAt: new Date(), status: IncidentStatus.REPORTED, reportedBy: adminUser._id },
            { incidentNumber: 'INC-20260123-002', type: IncidentType.LOSS, shipment: shipments[5]._id, description: 'Package reported missing from porch.', location: 'Lyon', occurredAt: new Date(), status: IncidentStatus.UNDER_INVESTIGATION, reportedBy: adminUser._id },
            { incidentNumber: 'INC-20260123-003', type: IncidentType.TECHNICAL_ISSUE, deliveryTour: tours[1]._id, vehicle: vehicles[1]._id, driver: drivers[1]._id, description: 'Engine overheating.', location: 'Marselle Rd', occurredAt: new Date(), status: IncidentStatus.RESOLVED, resolution: 'Tow truck called, load transferred.', resolvedAt: new Date(), resolvedBy: adminUser._id, reportedBy: adminUser._id },
        ]);

        // 14. Create Complaints
        await Complaint.create([
            { complaintNumber: 'CMP-202601-0001', client: clients[0]._id, shipments: [shipments[0]._id], nature: ComplaintNature.DELAY, description: 'Package is 2 days late.', status: ComplaintStatus.PENDING, priority: 'medium' },
            { complaintNumber: 'CMP-202601-0002', client: clients[1]._id, shipments: [shipments[2]._id], nature: ComplaintNature.DAMAGE, description: 'Box was crushed upon arrival.', status: ComplaintStatus.IN_PROGRESS, priority: 'high' },
            { complaintNumber: 'CMP-202601-0003', client: clients[2]._id, nature: ComplaintNature.SERVICE_QUALITY, description: 'Driver was rude.', status: ComplaintStatus.RESOLVED, resolution: 'Warning issued to driver.', resolvedAt: new Date(), priority: 'low' },
            { complaintNumber: 'CMP-202601-0004', client: clients[3]._id, invoice: invoices[0]._id, nature: ComplaintNature.BILLING, description: 'Overcharged for shipping.', status: ComplaintStatus.PENDING, priority: 'medium' },
        ]);

        return NextResponse.json({
            message: 'Database expanded successfully',
            summary: {
                users: users.length,
                serviceTypes: serviceTypes.length,
                destinations: destinations.length,
                clients: clients.length,
                drivers: drivers.length,
                vehicles: vehicles.length,
                shipments: shipments.length,
                tours: tours.length,
                invoices: invoices.length,
                payments: await Payment.countDocuments(),
                incidents: 3,
                complaints: 4,
            }
        });
    } catch (error: any) {
        console.error('Seeding error:', error);
        return NextResponse.json({ message: 'Seeding failed', error: error.message }, { status: 500 });
    }
}
