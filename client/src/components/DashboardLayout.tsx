import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { useTheme } from "@/contexts/ThemeContext";
import {
  CreditCard,
  LayoutDashboard,
  LogOut,
  MailCheck,
  Megaphone,
  MessageSquare,
  Moon,
  Package,
  PanelLeft,
  ShoppingBag,
  Sparkles,
  Store,
  Sun,
  Tag,
  Tags,
  Users,
  X,
  Zap,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

const menuItems = [
  {
    icon: LayoutDashboard,
    label: "Overview",
    path: "/admin",
  },
  {
    icon: Package,
    label: "Products",
    path: "/admin/products",
  },
  {
    icon: Zap,
    label: "Flash Sale",
    path: "/admin/flash-sale",
  },
  {
    icon: Sparkles,
    label: "Featured Collection",
    path: "/admin/featured",
  },
  {
    icon: Megaphone,
    label: "Announcements",
    path: "/admin/announcements",
  },
  {
    icon: Tags,
    label: "Categories",
    path: "/admin/categories",
  },
  {
    icon: ShoppingBag,
    label: "Orders",
    path: "/admin/orders",
  },
  {
    icon: Tag,
    label: "Coupons",
    path: "/admin/coupons",
  },
  {
    icon: Users,
    label: "Customers",
    path: "/admin/customers",
  },
  {
    icon: MessageSquare,
    label: "Reviews",
    path: "/admin/reviews",
  },
  {
    icon: Sparkles,
    label: "Offer Banners",
    path: "/admin/offers",
  },
  {
    icon: MailCheck,
    label: "Subscribers",
    path: "/admin/subscribers",
  },
  {
    icon: CreditCard,
    label: "Payment & Settings",
    path: "/admin/settings",
  },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });

  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(
      SIDEBAR_WIDTH_KEY,
      sidebarWidth.toString(),
    );
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex w-full max-w-md flex-col items-center gap-8 p-8">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-center text-2xl font-semibold tracking-tight">
              Sign in to continue
            </h1>

            <p className="max-w-sm text-center text-sm text-muted-foreground">
              Access to this dashboard requires authentication.
              Continue to launch the login flow.
            </p>
          </div>

          <Button
            onClick={() => startLogin()}
            size="lg"
            className="w-full shadow-lg transition-all hover:shadow-xl"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent
        setSidebarWidth={setSidebarWidth}
      >
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar, openMobile, setOpenMobile } = useSidebar();

  const isCollapsed = state === "collapsed";

  const [isResizing, setIsResizing] = useState(false);

  const sidebarRef = useRef<HTMLDivElement>(null);

  const activeMenuItem = menuItems.find(
    (item) => item.path === location,
  );

  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile && openMobile) {
      setOpenMobile(false);
    }
  }, [location, isMobile, setOpenMobile]);

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft =
        sidebarRef.current?.getBoundingClientRect().left ?? 0;

      const newWidth = event.clientX - sidebarLeft;

      if (
        newWidth >= MIN_WIDTH &&
        newWidth <= MAX_WIDTH
      ) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener(
        "mousemove",
        handleMouseMove,
      );

      document.addEventListener(
        "mouseup",
        handleMouseUp,
      );

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener(
        "mousemove",
        handleMouseMove,
      );

      document.removeEventListener(
        "mouseup",
        handleMouseUp,
      );

      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div
        className="relative"
        ref={sidebarRef}
      >
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center">
            <div className="flex w-full items-center justify-between gap-3 px-2 transition-all">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleSidebar}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Toggle navigation"
                  type="button"
                >
                  <PanelLeft className="h-4 w-4 text-muted-foreground" />
                </button>

                {!isCollapsed && (
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-semibold tracking-tight">
                      Navigation
                    </span>
                  </div>
                )}
              </div>

              {isMobile && (
                <button
                  onClick={() => setOpenMobile(false)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-accent focus:outline-none text-muted-foreground hover:text-foreground"
                  aria-label="Close sidebar"
                  type="button"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-1">
              {menuItems.map((item) => {
                const isActive =
                  location === item.path;

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => {
                        setLocation(item.path);
                        if (isMobile) {
                          setOpenMobile(false);
                        }
                      }}
                      tooltip={item.label}
                      className="h-10 font-normal transition-all"
                    >
                      <item.icon
                        className={`h-4 w-4 ${
                          isActive
                            ? "text-primary"
                            : ""
                        }`}
                      />

                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 flex flex-col gap-2">
            <div className="flex items-center gap-1 group-data-[collapsible=icon]:flex-col">
              <button
                type="button"
                onClick={() => setLocation("/")}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors group-data-[collapsible=icon]:w-full"
                title="View Customer Storefront"
              >
                <Store className="h-4 w-4 shrink-0 text-primary" />
                <span className="group-data-[collapsible=icon]:hidden">Storefront</span>
              </button>

              {toggleTheme && (
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors group-data-[collapsible=icon]:w-full"
                  title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  aria-label="Toggle Color Theme"
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4 shrink-0 text-amber-400" />
                  ) : (
                    <Moon className="h-4 w-4 shrink-0 text-primary" />
                  )}
                  <span className="group-data-[collapsible=icon]:hidden">
                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                  </span>
                </button>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="group flex w-full items-center gap-3 rounded-lg px-1 py-1 text-left transition-colors hover:bg-accent/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring group-data-[collapsible=icon]:justify-center"
                >
                  <Avatar className="h-9 w-9 shrink-0 border">
                    <AvatarFallback className="text-xs font-medium">
                      {user?.name
                        ?.charAt(0)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                    <p className="truncate text-sm font-medium leading-none">
                      {user?.name || "-"}
                    </p>

                    <p className="mt-1.5 truncate text-xs text-muted-foreground">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-48"
              >
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <div
          className={`absolute right-0 top-0 z-50 h-full w-1 cursor-col-resize transition-colors hover:bg-primary/20 ${
            isCollapsed ? "hidden" : ""
          }`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />

              <div className="flex items-center gap-2">
                <span className="tracking-tight font-semibold text-foreground text-sm">
                  {activeMenuItem?.label ?? "Rabiora Admin"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {toggleTheme && (
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  aria-label="Toggle theme"
                  title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-primary" />}
                </button>
              )}

              <button
                type="button"
                onClick={() => setLocation("/")}
                className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                title="View Store"
              >
                <Store className="h-3.5 w-3.5 text-primary" />
                <span>Store</span>
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-x-hidden">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}