
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Users, MapPin, ListChecks, BarChart3, Building2, LayoutDashboard, PanelLeft, Sun, Moon, MessageSquare, User, Settings, LogOut, Building } from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarGroup,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTheme } from 'next-themes';
import React, { useEffect, useState } from "react";
import { signOut as signOutService } from "@/services/auth-service";
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from "@/hooks/use-mobile";
import { SheetTitle } from "@/components/ui/sheet";


const adminNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/locations", label: "Location Tracking", icon: MapPin },
  { href: "/activity", label: "Activity Logs", icon: ListChecks },
  { href: "/attendance", label: "Attendance", icon: BarChart3 },
  { href: "/offices", label: "Offices", icon: Building2 },
  {
    label: "Organization", icon: Building, subItems: [
      { href: "/organization/departments", label: "Departments", icon: Users },
      { href: "/organization/positions", label: "Positions", icon: Users },
    ]
  },
  { href: "/chat", label: "Messaging", icon: MessageSquare, notificationKey: "chat" },
];

const employeeMobileNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/attendance", label: "My Attendance", icon: BarChart3 },
  { href: "/activity", label: "My Activity", icon: ListChecks },
  { href: "/chat", label: "Messaging", icon: MessageSquare },
];

const defaultUser = {
  name: "User",
  email: "user@example.com",
  role: "Employee",
  avatarUrl: ""
};

export function AppClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [loggedInUserName, setLoggedInUserName] = useState<string | null>(null);
  const [loggedInUserRole, setLoggedInUserRole] = useState<string | null>(null);
  const [loggedInUserEmail, setLoggedInUserEmail] = useState<string | null>(null);
  const [isRestrictionApplied, setIsRestrictionApplied] = useState(false);
  const [currentNavItems, setCurrentNavItems] = useState<typeof adminNavItems>([]);


  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const name = localStorage.getItem('userName');
      const role = localStorage.getItem('userRole');
      const email = localStorage.getItem('userEmail');
      setLoggedInUserName(name);
      setLoggedInUserRole(role);
      setLoggedInUserEmail(email);
    }
  }, []); // Runs once on mount to set initial user details

  const handleSignOut = async (message?: string) => {
    console.log(message || "Signing out...");
    setIsRestrictionApplied(true); // Mark that a restriction forced sign-out
    const result = await signOutService();

    if (result.serverSignOutOk) {
      toast({
        title: "Sign Out Successful",
        description: message || result.message || "You have been logged out from the server.",
      });
    } else {
      toast({
        variant: "default",
        title: "Local Sign Out Complete",
        description: message || result.message || "Your local session has been cleared. Server sign-out could not be confirmed.",
      });
    }

    setLoggedInUserName(null);
    setLoggedInUserRole(null);
    setLoggedInUserEmail(null);
    router.push('/');
  };

  useEffect(() => {
    if (!mounted) {
      return; // Wait for component to mount and isMobile/loggedInUserRole to be potentially set
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    const currentRole = loggedInUserRole; // Use the state variable

    // Handle navigation items and restrictions
    if (pathname === "/" || pathname === "/signup") {
      setCurrentNavItems([]); // No nav items on login/signup pages
      setIsRestrictionApplied(false); // No restrictions apply here
    } else if (token && currentRole) {
      const isAdmin = currentRole.toLowerCase().includes('admin');
      let restrictionTriggered = false;

      if (isMobile && isAdmin) {
        handleSignOut("Administrator access is restricted on mobile devices. You have been logged out.");
        restrictionTriggered = true;
      } else if (!isMobile && !isAdmin) {
        handleSignOut("Employee access is restricted on desktop devices. You have been logged out.");
        restrictionTriggered = true;
      } else {
        setIsRestrictionApplied(false);
      }

      if (!restrictionTriggered) {
        if (isMobile && !isAdmin) {
          setCurrentNavItems(employeeMobileNavItems);
        } else {
          setCurrentNavItems(adminNavItems);
        }
      } else {
        setCurrentNavItems([]); // Clear nav items if restriction led to sign out
      }
    } else if (!token && pathname !== "/" && pathname !== "/signup") {
      // No token, but on a protected page, should redirect (usually handled by page or main layout logic)
      // For AppClientLayout, if no token, assume redirection is happening or will happen.
      // Can set to empty or admin as a fallback before redirection.
      setCurrentNavItems([]);
      setIsRestrictionApplied(false); // Or true if redirecting, depends on overall auth flow
      router.push('/'); // Force redirect if not on public pages and no token
    } else {
      // Fallback for unhandled cases or during transition states
      setCurrentNavItems([]);
      setIsRestrictionApplied(false);
    }
  }, [mounted, isMobile, loggedInUserRole, pathname, router, toast]);


  const userToDisplay = {
    name: loggedInUserName || defaultUser.name,
    role: loggedInUserRole || defaultUser.role,
    email: loggedInUserEmail || defaultUser.email,
    avatarUrl: defaultUser.avatarUrl,
  };

  const getInitials = (name: string | null) => {
    if (!name || name.trim() === "" || name === "User") return "U";
    const nameParts = name.split(' ').filter(part => part.length > 0);
    if (nameParts.length === 1) return nameParts[0].substring(0, 2).toUpperCase();
    return nameParts.map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  if (mounted && isRestrictionApplied && (pathname !== "/" && pathname !== "/signup")) {
      return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
              <p className="text-lg">Access restricted for your account type on this device.</p>
              <p className="text-muted-foreground">You will be redirected to the login page...</p>
          </div>
      );
  }

  if (pathname === "/" || pathname === "/signup") {
    return <>{children}</>;
  }

  const getPageTitle = () => {
    const itemsToSearch = currentNavItems.length > 0 ? currentNavItems : adminNavItems; // Fallback for titles if currentNav is empty during transitions
    for (const item of itemsToSearch) {
      if (item.href && (pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)))) {
        return item.label;
      }
      if (item.subItems) {
        for (const subItem of item.subItems) {
          if (pathname === subItem.href || (subItem.href && pathname.startsWith(subItem.href))) {
            return subItem.label;
          }
        }
      }
    }
    // Keep adminNavItems check for pages not directly in employeeMobileNavItems but accessible (e.g. profile, settings)
    if (currentNavItems !== adminNavItems) {
        for (const item of adminNavItems) {
            if (item.href && (pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)))) {
                return item.label;
            }
            if (item.subItems) {
                for (const subItem of item.subItems) {
                if (pathname === subItem.href || (subItem.href && pathname.startsWith(subItem.href))) {
                    return subItem.label;
                }
                }
            }
        }
    }

    if (pathname === '/employees/add') return 'Add Employee';
    if (pathname === '/profile') return 'My Profile';
    if (pathname === '/settings') return 'Settings';
    return "EmployTrack";
  };

  let pageTitle = getPageTitle();

  return (
    <SidebarProvider defaultOpen={true} >
      <Sidebar collapsible="icon" className="border-r bg-sidebar text-sidebar-foreground">
        <SidebarHeader className="p-4">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-sidebar-primary transition-transform duration-300 group-hover:scale-110">
                <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 7L12 12M12 12L22 7M12 12V22M12 2V12M17 4.5L7 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h1 className="text-xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">EmployTrack</h1>
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {currentNavItems.map((item, index) => (
              item.subItems ? (
                <SidebarGroup key={`group-${item.label}-${index}`} className="p-0">
                   <SidebarMenuButton
                      asChild={false}
                      isActive={item.subItems.some(sub => sub.href && pathname.startsWith(sub.href))}
                      tooltip={{ children: item.label, side: "right", className: "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border shadow-md" }}
                      className="justify-start"
                      variant="default"
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                      {item.subItems.map(subItem => (
                        <SidebarMenuSubItem key={subItem.href}>
                           <SidebarMenuSubButton
                            asChild
                            isActive={pathname === subItem.href || (subItem.href && pathname.startsWith(subItem.href))}
                          >
                            <Link href={subItem.href!}>
                              <span>{subItem.label}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                </SidebarGroup>
              ) : (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (item.href !== "/dashboard" && item.href && pathname.startsWith(item.href))}
                  tooltip={{ children: item.label, side: "right", className: "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border shadow-md" }}
                  className="justify-start"
                  variant="default"
                >
                  <Link href={item.href!}>
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              )
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur-sm md:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
            <h2 className="text-xl font-semibold text-foreground">
              {pageTitle}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle theme"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun className="h-5 w-5 text-foreground" /> : <Moon className="h-5 w-5 text-foreground" />}
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={userToDisplay.avatarUrl} alt={userToDisplay.name || ""} data-ai-hint="user avatar" />
                    <AvatarFallback>{getInitials(userToDisplay.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userToDisplay.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userToDisplay.role}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground pt-1">
                      {userToDisplay.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                 <DropdownMenuItem onClick={() => handleSignOut()} className="flex items-center cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

    