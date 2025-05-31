
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
  { href: "/employees", label: "Employés", icon: Users },
  { href: "/locations", label: "Suivi de Localisation", icon: MapPin },
  { href: "/activity", label: "Logs d'Activité", icon: ListChecks },
  { href: "/attendance", label: "Présence", icon: BarChart3 },
  { href: "/offices", label: "Bureaux", icon: Building2 },
  { 
    label: "Organisation", icon: Building, subItems: [
      { href: "/organization/departments", label: "Départements", icon: Users /* Placeholder icon */ },
      { href: "/organization/positions", label: "Postes", icon: Users /* Placeholder icon */ },
    ] 
  },
  { href: "/chat", label: "Messagerie", icon: MessageSquare, notificationKey: "chat" },
];

const employeeMobileNavItems = [
  { href: "/dashboard", label: "Tableau de Bord", icon: LayoutDashboard },
  { href: "/attendance", label: "Ma Présence", icon: BarChart3 },
  { href: "/activity", label: "Mon Activité", icon: ListChecks },
  { href: "/chat", label: "Messagerie", icon: MessageSquare },
];

const defaultUser = {
  name: "Utilisateur",
  email: "utilisateur@example.com",
  role: "Employé",
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
  const [currentNavItems, setCurrentNavItems] = useState(adminNavItems);


  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const name = localStorage.getItem('userName');
      const role = localStorage.getItem('userRole');
      const email = localStorage.getItem('userEmail');
      setLoggedInUserName(name);
      setLoggedInUserRole(role);
      setLoggedInUserEmail(email);

      if (role) {
        const isAdmin = role.toLowerCase().includes('admin');
        if (isMobile && !isAdmin) {
          setCurrentNavItems(employeeMobileNavItems);
        } else {
          setCurrentNavItems(adminNavItems);
        }
      } else {
        setCurrentNavItems(adminNavItems); // Default to admin if role not found, though user would be logged out
      }
    }
  }, [pathname, isMobile]); // Add isMobile to dependencies
  
  const handleSignOut = async (message?: string) => {
    console.log(message || "Signing out...");
    const result = await signOutService(); 
  
    if (result.serverSignOutOk) {
      toast({
        title: "Déconnexion Réussie",
        description: message || result.message || "Vous avez été déconnecté du serveur.",
      });
    } else {
      toast({
        variant: "default", 
        title: "Déconnexion Locale Effectuée",
        description: message || result.message || "Votre session locale a été effacée. La déconnexion du serveur n'a pu être confirmée.",
      });
    }
    
    setLoggedInUserName(null);
    setLoggedInUserRole(null);
    setLoggedInUserEmail(null);
    setIsRestrictionApplied(true); // Indicate that a restriction forced a logout
    router.push('/'); 
  };

  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole');
      const token = localStorage.getItem('authToken');

      if (token && role) {
        const isAdmin = role.toLowerCase().includes('admin');
        if (isMobile && isAdmin) {
          handleSignOut("L'accès administrateur est restreint sur les appareils mobiles. Vous avez été déconnecté.");
        } else if (!isMobile && !isAdmin) {
          handleSignOut("L'accès employé est restreint sur les appareils de bureau. Vous avez été déconnecté.");
        } else {
            setIsRestrictionApplied(false); // Reset if no restriction applies
        }
        // Update nav items based on role and device
        if (isMobile && !isAdmin) {
          setCurrentNavItems(employeeMobileNavItems);
        } else {
          setCurrentNavItems(adminNavItems);
        }

      } else {
        setIsRestrictionApplied(false); // No token or role, no restriction applies
        setCurrentNavItems(adminNavItems); // Default if no role, will be redirected soon anyway
      }
    }
  }, [mounted, isMobile, loggedInUserRole, pathname]);


  const userToDisplay = {
    name: loggedInUserName || defaultUser.name,
    role: loggedInUserRole || defaultUser.role,
    email: loggedInUserEmail || defaultUser.email,
    avatarUrl: defaultUser.avatarUrl, 
  };

  const getInitials = (name: string | null) => {
    if (!name || name.trim() === "" || name === "User" || name === "Utilisateur") return "U";
    const nameParts = name.split(' ').filter(part => part.length > 0);
    if (nameParts.length === 1) return nameParts[0].substring(0, 2).toUpperCase();
    return nameParts.map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  if (mounted && isRestrictionApplied && (pathname !== "/" && pathname !== "/signup")) {
      const role = localStorage.getItem('userRole'); 
      const token = localStorage.getItem('authToken');
      let restricted = false;
      if (token && role) {
          const isAdmin = role.toLowerCase().includes('admin');
          if (isMobile && isAdmin) restricted = true;
          if (!isMobile && !isAdmin) restricted = true;
      }
      if (restricted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
                <p className="text-lg">Accès restreint pour votre type de compte sur cet appareil.</p>
                <p className="text-muted-foreground">Vous allez être redirigé vers la page de connexion...</p>
            </div>
        );
      }
  }


  if (pathname === "/" || pathname === "/signup") { 
    return <>{children}</>;
  }

  const getPageTitle = () => {
    // Use currentNavItems for title generation
    for (const item of currentNavItems) {
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
    // Check admin items only if currentNavItems might not cover it (e.g. specific sub-pages not in employee menu)
    if (currentNavItems !== adminNavItems) {
        for (const item of adminNavItems) { // Fallback check against admin items for titles like Add Employee
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

    if (pathname === '/employees/add') return 'Ajouter un Employé'; // Keep specific fallbacks
    if (pathname === '/profile') return 'Mon Profil';
    if (pathname === '/settings') return 'Paramètres';
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
                title={`Passer en mode ${theme === 'dark' ? 'clair' : 'sombre'}`}
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
                    Profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Paramètres
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                 <DropdownMenuItem onClick={() => handleSignOut()} className="flex items-center cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Se déconnecter
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
