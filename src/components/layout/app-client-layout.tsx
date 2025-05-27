
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  SidebarGroupLabel,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTheme } from 'next-themes';
import React, { useEffect, useState } from "react";
// import { getUnreadMessages } from '@/services/message-service'; // For unread message count
// import { signOut } from "@/services/auth-service"; // For sign out

const navItems = [
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

// Placeholder user data - replace with actual data from auth context or API
const placeholderUser = {
  id: "user123", // Added ID for service calls
  name: "Alex Dubois", 
  email: "alex.dubois@example.com",
  jobTitle: "Product Design Lead",
  role: "Team Lead", 
  avatarUrl: "https://placehold.co/120x120.png?text=AD" 
};

export function AppClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // const [unreadChatCount, setUnreadChatCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    // Example: Fetch unread messages count
    // const fetchUnreads = async () => {
    //   try {
    //     // Assuming placeholderUser.id is the current logged-in user's ID
    //     // const unreadInfo = await getUnreadMessages(placeholderUser.id); 
    //     // setUnreadChatCount(unreadInfo.count); 
    //     // console.log("Unread chat messages:", unreadInfo.count);
    //     console.log("Placeholder: Would fetch unread messages for user:", placeholderUser.id);
    //   } catch (error) {
    //     console.error("Failed to fetch unread messages:", error);
    //   }
    // };
    // fetchUnreads();
  }, []);

  if (pathname === "/" || pathname === "/signup") { // Login and Signup pages
    return <>{children}</>;
  }

  const getPageTitle = () => {
    for (const item of navItems) {
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
    if (pathname === '/employees/add') return 'Ajouter un Employé';
    if (pathname === '/profile') return 'Mon Profil';
    if (pathname === '/settings') return 'Paramètres';
    return "EmployTrack";
  };
  
  let pageTitle = getPageTitle();

  const handleSignOut = async () => {
    console.log("Signing out...");
    // Example: Call signOut service function
    // try {
    //   await signOut();
    //   console.log('Sign out successful via service');
    //   // Clear local user state/token
    //   window.location.href = '/'; 
    // } catch (error) {
    //   console.error('Sign out failed:', error);
    //   alert(`Sign out failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    // }
    window.location.href = '/'; // Current behavior
  };


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
            {navItems.map((item, index) => (
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
                    {/* {item.notificationKey === "chat" && unreadChatCount > 0 && (
                        <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                            {unreadChatCount}
                        </span>
                    )} */}
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
                    <AvatarImage src={placeholderUser.avatarUrl} alt={placeholderUser.name} data-ai-hint="user avatar" />
                    <AvatarFallback>{placeholderUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{placeholderUser.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {placeholderUser.jobTitle} - {placeholderUser.role}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground pt-1">
                      {placeholderUser.email}
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
                 <DropdownMenuItem onClick={handleSignOut} className="flex items-center cursor-pointer">
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

    