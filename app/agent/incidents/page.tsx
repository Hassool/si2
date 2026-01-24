"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { IIncident, IncidentType, IncidentStatus, IShipment, IDriver, IVehicle, IDeliveryTour } from "@/types";
import { incidentsApi, IncidentFilters } from "@/lib/api/incidents";
import { DataTable } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { IncidentStatusBadge, IncidentTypeBadge } from "@/components/incidents/incident-status-badge";
import { ResolveIncidentModal } from "@/components/incidents/resolve-incident-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { formatDate, formatDateTime } from "@/lib/utils/formatting";
import { exportToExcel, printTable } from "@/lib/utils/export";
import {
    Plus,
    FileDown,
    Printer,
    Eye,
    CheckCircle,
    Trash2,
    Filter,
    ChevronDown,
    ChevronUp,
    RefreshCw,
    AlertTriangle,
    Clock,
    Search,
    User,
    Truck,
    Package,
    MapPin,
} from "lucide-react";

export default function IncidentsPage() {
    const router = useRouter();
    const [incidents, setIncidents] = useState<IIncident[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [filters, setFilters] = useState<IncidentFilters>({});
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [resolveIncident, setResolveIncident] = useState<IIncident | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await incidentsApi.getAll(filters);
            setIncidents(data);
        } catch (error) {
            toast.error("Failed to load incidents");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await incidentsApi.delete(deleteId);
            toast.success("Incident deleted");
            loadData();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete incident");
        } finally {
            setDeleteId(null);
        }
    };

    const handleExport = () => {
        const data = incidents.map((inc) => ({
            "Incident #": inc.incidentNumber,
            Type: inc.type,
            Status: inc.status,
            Description: inc.description,
            Location: inc.location || "-",
            "Occurred At": formatDateTime(inc.occurredAt),
            "Reported": formatDateTime(inc.createdAt),
        }));
        exportToExcel(data, "incidents");
    };

    // Stats
    const stats = useMemo(() => {
        const open = incidents.filter((i) => i.status !== IncidentStatus.CLOSED && i.status !== IncidentStatus.RESOLVED).length;
        const resolved = incidents.filter((i) => i.status === IncidentStatus.RESOLVED).length;
        const today = incidents.filter(
            (i) => new Date(i.createdAt).toDateString() === new Date().toDateString()
        ).length;
        return { total: incidents.length, open, resolved, today };
    }, [incidents]);

    const columns: ColumnDef<IIncident>[] = [
        {
            accessorKey: "incidentNumber",
            header: "Incident #",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <Button
                        variant="link"
                        className="font-mono font-bold p-0 h-auto justify-start"
                        onClick={() => router.push(`/agent/incidents/${row.original._id}`)}
                    >
                        {row.original.incidentNumber}
                    </Button>
                    <span className="text-[10px] text-muted-foreground uppercase">{row.original.type}</span>
                </div>
            ),
        },
        {
            id: "related",
            header: "Related Entity",
            cell: ({ row }) => {
                const inc = row.original;
                const shipment = inc.shipment as any;
                const vehicle = inc.vehicle as any;
                const driver = inc.driver as any;
                const tour = inc.deliveryTour as any;

                return (
                    <div className="flex flex-col gap-1 text-xs">
                        {shipment && (
                            <div className="flex items-center gap-1" title="Shipment">
                                <Package className="h-3 w-3 text-blue-500" />
                                <span className="font-mono">{shipment.shipmentNumber}</span>
                            </div>
                        )}
                        {driver && (
                            <div className="flex items-center gap-1" title="Driver">
                                <User className="h-3 w-3 text-green-500" />
                                <span>{driver.firstName} {driver.lastName}</span>
                            </div>
                        )}
                        {vehicle && (
                            <div className="flex items-center gap-1" title="Vehicle">
                                <Truck className="h-3 w-3 text-orange-500" />
                                <span className="font-mono">{vehicle.registrationNumber}</span>
                            </div>
                        )}
                        {!shipment && !driver && !vehicle && tour && (
                            <div className="flex items-center gap-1" title="Tour">
                                <RefreshCw className="h-3 w-3 text-purple-500" />
                                <span className="font-mono">{tour.tourNumber}</span>
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            accessorKey: "description",
            header: "Description",
            cell: ({ row }) => (
                <div className="max-w-[250px]">
                    <p className="text-sm line-clamp-2" title={row.original.description}>
                        {row.original.description}
                    </p>
                    {row.original.location && (
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-2.5 w-2.5" /> {row.original.location}
                        </p>
                    )}
                </div>
            ),
        },
        {
            accessorKey: "photos",
            header: "Evidence",
            cell: ({ row }) => {
                const photos = row.original.photos || [];
                if (photos.length === 0) return <span className="text-muted-foreground text-xs italic">No images</span>;
                return (
                    <div className="flex -space-x-2 overflow-hidden">
                        {photos.slice(0, 3).map((photo, i) => (
                            <div key={i} className="relative h-8 w-8 rounded-full border-2 border-background ring-2 ring-muted overflow-hidden bg-muted">
                                <img src={photo} alt="" className="h-full w-full object-cover" />
                            </div>
                        ))}
                        {photos.length > 3 && (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-bold">
                                +{photos.length - 3}
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <div className="flex flex-col gap-1">
                    <IncidentStatusBadge status={row.original.status} size="sm" />
                    <span className="text-[10px] text-muted-foreground">{formatDate(row.original.occurredAt)}</span>
                </div>
            ),
        },
        {
            id: "actions",
            header: "",
            cell: ({ row }) => (
                <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/agent/incidents/${row.original._id}`)}>
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-600" onClick={() => setDeleteId(row.original._id.toString())}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Incidents Management</h1>
                    <p className="text-muted-foreground">Track and manage operational incidents</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button onClick={() => router.push("/agent/incidents/report")}>
                        <Plus className="h-4 w-4 mr-2" /> Report Incident
                    </Button>
                    <Button variant="outline" onClick={handleExport}>
                        <FileDown className="h-4 w-4 mr-2" /> Export
                    </Button>
                    <Button variant="outline" onClick={() => printTable()}>
                        <Printer className="h-4 w-4 mr-2" /> Print
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-blue-500" />
                            <div>
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-xs text-muted-foreground">Total</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-orange-500" />
                            <div>
                                <p className={`text-2xl font-bold ${stats.open > 0 ? "text-orange-600" : ""}`}>{stats.open}</p>
                                <p className="text-xs text-muted-foreground">Open</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <div>
                                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                                <p className="text-xs text-muted-foreground">Resolved</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            <div>
                                <p className="text-2xl font-bold">{stats.today}</p>
                                <p className="text-xs text-muted-foreground">Today</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader className="pb-2">
                    <button
                        className="flex items-center justify-between w-full"
                        onClick={() => setFiltersOpen(!filtersOpen)}
                    >
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Filter className="h-4 w-4" /> Filters
                        </CardTitle>
                        {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                </CardHeader>
                {filtersOpen && (
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Select
                                value={filters.type || ""}
                                onValueChange={(v) => setFilters({ ...filters, type: v as IncidentType || undefined })}
                            >
                                <SelectTrigger><SelectValue placeholder="All Types" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Types</SelectItem>
                                    {Object.values(IncidentType).map((t) => (
                                        <SelectItem key={t} value={t}>{t.replace(/_/g, " ").toUpperCase()}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters.status?.[0] || ""}
                                onValueChange={(v) => setFilters({ ...filters, status: v ? [v as IncidentStatus] : undefined })}
                            >
                                <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Statuses</SelectItem>
                                    {Object.values(IncidentStatus).map((s) => (
                                        <SelectItem key={s} value={s}>{s.replace(/_/g, " ").toUpperCase()}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="flex gap-2 col-span-2">
                                <Button onClick={loadData} className="flex-1">
                                    <Search className="h-4 w-4 mr-2" /> Apply
                                </Button>
                                <Button variant="outline" onClick={() => { setFilters({}); loadData(); }}>
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Data Table */}
            <DataTable
                columns={columns}
                data={incidents}
                searchKey="incidentNumber"
                loading={loading}
            />

            {/* Modals */}
            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Incident"
                description="Are you sure you want to delete this incident?"
                variant="destructive"
            />

            {resolveIncident && (
                <ResolveIncidentModal
                    isOpen={true}
                    onClose={() => setResolveIncident(null)}
                    incident={resolveIncident}
                    onSuccess={loadData}
                />
            )}
        </div>
    );
}
