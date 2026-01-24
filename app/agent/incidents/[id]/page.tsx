"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { IIncident, IncidentStatus, IShipment, IDriver, IVehicle, IDeliveryTour, IUser } from "@/types";
import { incidentsApi } from "@/lib/api/incidents";
import { IncidentStatusBadge, IncidentTypeBadge } from "@/components/incidents/incident-status-badge";
import { ResolveIncidentModal } from "@/components/incidents/resolve-incident-modal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { formatDateTime, formatDate } from "@/lib/utils/formatting";
import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    MapPin,
    Calendar,
    User,
    Truck,
    Package,
    FileText,
    Image,
    Loader2,
    RefreshCw,
    Eye,
} from "lucide-react";

export default function IncidentDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const incidentId = params.id as string;

    const [incident, setIncident] = useState<IIncident | null>(null);
    const [loading, setLoading] = useState(true);
    const [resolveModal, setResolveModal] = useState(false);
    const [closeDialog, setCloseDialog] = useState(false);

    const loadIncident = async () => {
        setLoading(true);
        try {
            const data = await incidentsApi.getById(incidentId);
            setIncident(data);
        } catch (error: any) {
            toast.error(error.message || "Failed to load incident");
            router.push("/agent/incidents");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (incidentId) loadIncident();
    }, [incidentId]);

    const handleClose = async () => {
        try {
            await incidentsApi.close(incidentId);
            toast.success("Incident closed");
            loadIncident();
        } catch (error: any) {
            toast.error(error.message || "Failed to close incident");
        } finally {
            setCloseDialog(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!incident) {
        return (
            <div className="container mx-auto py-6 text-center">
                <p>Incident not found</p>
                <Button className="mt-4" onClick={() => router.push("/agent/incidents")}>
                    Back to Incidents
                </Button>
            </div>
        );
    }

    const shipment = incident.shipment as IShipment | undefined;
    const driver = incident.driver as IDriver | undefined;
    const vehicle = incident.vehicle as IVehicle | undefined;
    const tour = incident.deliveryTour as IDeliveryTour | undefined;
    const reporter = incident.reportedBy as IUser | undefined;
    const resolver = incident.resolvedBy as IUser | undefined;

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold font-mono">{incident.incidentNumber}</h1>
                            <IncidentTypeBadge type={incident.type} />
                            <IncidentStatusBadge status={incident.status} />
                        </div>
                        <p className="text-muted-foreground text-sm">
                            Reported {formatDateTime(incident.createdAt)}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {incident.status !== IncidentStatus.RESOLVED && incident.status !== IncidentStatus.CLOSED && (
                        <Button onClick={() => setResolveModal(true)}>
                            <CheckCircle className="h-4 w-4 mr-2" /> Resolve
                        </Button>
                    )}
                    {incident.status === IncidentStatus.RESOLVED && (
                        <Button variant="outline" onClick={() => setCloseDialog(true)}>
                            <XCircle className="h-4 w-4 mr-2" /> Close
                        </Button>
                    )}
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Incident Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase">Occurred At</p>
                                    <p className="font-medium flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        {formatDateTime(incident.occurredAt)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase">Location</p>
                                    <p className="font-medium flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        {incident.location || "Not specified"}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase mb-1">Description</p>
                                <p className="text-sm bg-muted p-3 rounded">{incident.description}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Related Entities */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {shipment && (
                            <Card className="hover:border-blue-500/30 transition-colors cursor-pointer group" onClick={() => router.push(`/agent/shipments/${shipment._id}`)}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                                            <Package className="h-4 w-4 text-blue-500" />
                                            Shipment Details
                                        </CardTitle>
                                        <ArrowLeft className="h-4 w-4 rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-1">
                                        <p className="text-lg font-mono font-bold">{shipment.shipmentNumber}</p>
                                        <p className="text-sm text-muted-foreground">{shipment.senderName} → {shipment.receiverName}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        {driver && (
                            <Card className="hover:border-green-500/30 transition-colors">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <User className="h-4 w-4 text-green-500" />
                                        Driver Assignment
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-1">
                                        <p className="text-lg font-bold">{driver.firstName} {driver.lastName}</p>
                                        <p className="text-sm text-muted-foreground">{driver.phone} | ID: {driver.employeeId}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        {vehicle && (
                            <Card className="hover:border-orange-500/30 transition-colors">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <Truck className="h-4 w-4 text-orange-500" />
                                        Vehicle Context
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-1">
                                        <p className="text-lg font-mono font-bold">{vehicle.registrationNumber}</p>
                                        <p className="text-sm text-muted-foreground">{vehicle.brand} {vehicle.model} ({vehicle.type})</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        {tour && (
                            <Card className="hover:border-purple-500/30 transition-colors cursor-pointer group" onClick={() => router.push(`/agent/tours/${tour._id}`)}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-purple-600">
                                            <RefreshCw className="h-4 w-4" />
                                            Delivery Manifest
                                        </CardTitle>
                                        <ArrowLeft className="h-4 w-4 rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-1">
                                        <p className="text-lg font-mono font-bold">{tour.tourNumber}</p>
                                        <p className="text-sm text-muted-foreground">Tour on {formatDate(tour.date)} | {tour.status}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Evidence Showcase */}
                    {(incident.photos?.length > 0 || incident.documents?.length > 0) && (
                        <Card className="bg-zinc-950 border-zinc-900 overflow-hidden">
                            <CardHeader className="border-b border-zinc-900 pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-zinc-500" /> Evidence Logs
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-8">
                                {incident.photos?.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                                            <Image className="h-4 w-4" /> Photographic Proof ({incident.photos.length})
                                        </h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {incident.photos.map((photo, idx) => (
                                                <div key={idx} className="group relative aspect-square rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 transition-all hover:border-zinc-500 shadow-2xl">
                                                    <img src={photo} alt={`Incident photo ${idx + 1}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                    <a 
                                                        href={photo} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                                    >
                                                        <Eye className="h-8 w-8 text-white" />
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {incident.documents?.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">Supporting Documentation</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {incident.documents.map((doc, idx) => (
                                                <a 
                                                    key={idx} 
                                                    href={doc} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="flex items-center gap-3 p-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl transition-all group"
                                                >
                                                    <div className="p-2 bg-blue-500/10 rounded-xl">
                                                        <FileText className="h-5 w-5 text-blue-500" />
                                                    </div>
                                                    <div className="flex-1 overflow-hidden">
                                                        <p className="text-sm font-bold truncate">Legal_Doc_{idx + 1}.pdf</p>
                                                        <p className="text-[10px] text-zinc-500 uppercase">External Source</p>
                                                    </div>
                                                    <ArrowLeft className="h-4 w-4 rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Reporter */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="h-5 w-5" /> Reported By
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {reporter ? (
                                <div>
                                    <p className="font-medium">{reporter.name}</p>
                                    <p className="text-sm text-muted-foreground">{reporter.email}</p>
                                    <p className="text-sm text-muted-foreground">{formatDateTime(incident.createdAt)}</p>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">Unknown</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Resolution */}
                    {incident.resolution && (
                        <Card className="border-green-200 bg-green-50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                                    <CheckCircle className="h-5 w-5" /> Resolution
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-green-800">{incident.resolution}</p>
                                {resolver && (
                                    <p className="text-xs text-green-600 mt-2">
                                        Resolved by {resolver.name} on {formatDateTime(incident.resolvedAt!)}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Status Timeline */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Timeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex gap-3">
                                    <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white">
                                        <CheckCircle className="h-3 w-3" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Reported</p>
                                        <p className="text-xs text-muted-foreground">{formatDateTime(incident.createdAt)}</p>
                                    </div>
                                </div>
                                {incident.resolvedAt && (
                                    <div className="flex gap-3">
                                        <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center text-white">
                                            <CheckCircle className="h-3 w-3" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Resolved</p>
                                            <p className="text-xs text-muted-foreground">{formatDateTime(incident.resolvedAt)}</p>
                                        </div>
                                    </div>
                                )}
                                {incident.status === IncidentStatus.CLOSED && (
                                    <div className="flex gap-3">
                                        <div className="h-6 w-6 rounded-full bg-gray-400 flex items-center justify-center text-white">
                                            <XCircle className="h-3 w-3" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Closed</p>
                                            <p className="text-xs text-muted-foreground">{formatDateTime(incident.updatedAt)}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Modals */}
            {resolveModal && incident && (
                <ResolveIncidentModal
                    isOpen={true}
                    onClose={() => setResolveModal(false)}
                    incident={incident}
                    onSuccess={loadIncident}
                />
            )}

            <ConfirmDialog
                open={closeDialog}
                onOpenChange={() => setCloseDialog(false)}
                onConfirm={handleClose}
                title="Close Incident"
                description="Are you sure you want to close this incident? This marks it as complete."
            />
        </div>
    );
}
