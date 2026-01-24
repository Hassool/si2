
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
    LayoutDashboard,
    Package,
    Truck,
    FileText,
    CreditCard,
    Users,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Bell,
    Search,
    Menu,
    X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const getNavItems = (role?: string) => {
    const common = [
        { label: "Settings", href: "/profile", icon: Settings },
    ];

    const agentItems = [
        { label: "Dashboard", href: "/agent/dashboard", icon: LayoutDashboard },
        { label: "Shipments", href: "/agent/shipments", icon: Package },
        { label: "Tours", href: "/agent/tours", icon: Truck },
        { label: "Vehicles", href: "/agent/vehicles", icon: Truck },
        { label: "Invoices", href: "/agent/invoices", icon: FileText },
        { label: "Analytics", href: "/agent/analytics", icon: CreditCard },
        { label: "Clients", href: "/agent/clients", icon: Users },
    ];

    const adminItems = [
        { label: "Admin Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { label: "User Management", href: "/admin/users", icon: Users },
        { label: "Audit Logs", href: "/admin/audit-logs", icon: FileText },
        { label: "Agent Controls", href: "/agent/dashboard", icon: Truck },
    ];

    if (role === 'admin') return [...adminItems, ...common];
    if (role === 'agent') return [...agentItems, ...common];
    return common;
};

export function Sidebar({ 
    className,
    collapsed,
    setCollapsed
}: { 
    className?: string;
    collapsed: boolean;
    setCollapsed: (v: boolean) => void;
}) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const navItems = getNavItems(session?.user?.role);

    return (
        <aside className={cn(
            "fixed inset-y-0 left-0 z-50 hidden md:flex flex-col border-r bg-background transition-all duration-300",
            collapsed ? "w-20" : "w-64",
            className
        )}>
            <div className="flex items-center justify-between p-4 border-b h-16">
                {!collapsed && <span className="font-bold text-xl text-primary">TransLog</span>}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCollapsed(!collapsed)}
                    className="ml-auto"
                >
                    {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </Button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-2 pt-6">
                {navItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                        <div className={cn(
                            "flex items-center gap-3 p-3 rounded-lg transition-colors group",
                            pathname === item.href
                                ? "bg-primary text-primary-foreground shadow-md"
                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}>
                            <item.icon size={20} className={cn(
                                pathname === item.href ? "text-primary-foreground" : "text-primary group-hover:text-primary transition-colors"
                            )} />
                            {!collapsed && <span className="font-medium">{item.label}</span>}
                        </div>
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t">
                <Button 
                    variant="ghost" 
                    className={cn("w-full justify-start gap-3", collapsed && "px-2")}
                    onClick={() => signOut({ callbackUrl: "/signin-up" })}
                >
                    <LogOut size={20} className="text-destructive" />
                    {!collapsed && <span>Logout</span>}
                </Button>
            </div>
        </aside>
    );
}

export function MobileNav() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [open, setOpen] = useState(false);
    const navItems = getNavItems(session?.user?.role);

    return (
        <div className="md:hidden flex items-center justify-between p-4 border-b h-16 sticky top-0 bg-background z-50">
            <Link href="/" className="font-bold text-xl text-primary">TransLog</Link>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu className="h-6 w-6" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                    <div className="flex flex-col h-full bg-background">
                        <div className="p-6 border-b flex items-center justify-between">
                            <span className="font-bold text-xl text-primary">TransLog</span>
                            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                                <X className="h-6 w-6" />
                            </Button>
                        </div>
                        <nav className="flex-1 p-6 space-y-4">
                            {navItems.map((item) => (
                                <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                                    <div className={cn(
                                        "flex items-center gap-4 p-4 rounded-xl font-medium transition-all text-lg",
                                        pathname === item.href
                                            ? "bg-primary text-primary-foreground shadow-lg scale-[1.02]"
                                            : "text-muted-foreground hover:bg-muted"
                                    )}>
                                        <item.icon size={24} />
                                        <span>{item.label}</span>
                                    </div>
                                </Link>
                            ))}
                        </nav>
                        <div className="p-6 border-t mt-auto">
                            <Button 
                                variant="destructive" 
                                className="w-full h-12 text-lg rounded-xl gap-3"
                                onClick={() => signOut({ callbackUrl: "/signin-up" })}
                            >
                                <LogOut size={24} />
                                Logout
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
