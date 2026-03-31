"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Avatar from "./design/Avatar";
import Label from "./design/Label";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  variant?: "vertical" | "horizontal";
}

export default function Sidebar({ variant = "vertical" }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();

  const navItems: NavItem[] = [
    {
      label: "Home",
      href: "/dashboard",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
      ),
    },
    {
      label: "Legal Library",
      href: "/legal-library",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
        </svg>
      ),
    },
    {
      label: "Case Tracker",
      href: "/case-tracker",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm14 1a1 1 0 11-2 0 1 1 0 012 0zM2 13a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2zm14 1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      ),
    },
  ];

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  // Vertical Sidebar (for Case Tracker, Consult AI, Legal Library)
  if (variant === "vertical") {
    return (
      <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-low z-40 flex flex-col shadow-elevated" role="navigation" aria-label="Main navigation">
        {/* Logo */}
        <div className="p-6 pb-4">
          <Link href="/dashboard" className="block group">
            <h1 className="font-serif text-xl font-semibold text-primary group-hover:text-primary-container transition-colors duration-200">
              Majlis Digital
            </h1>
            <p className="label-sm text-gray-500 mt-1.5">
              MOROCCAN LEGAL PORTAL
            </p>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  isActive
                    ? "bg-secondary-container/50 text-secondary"
                    : "text-gray-600 hover:bg-surface-container-high hover:text-on-surface"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <span className={`${isActive ? "text-secondary" : "text-gray-500 group-hover:text-on-surface"} transition-colors`}>
                  {item.icon}
                </span>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 space-y-3">
          <Link 
            href="/consult-ai" 
            className="btn-primary w-full justify-center flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Start New Consultation
          </Link>

          <div className="pt-3 border-t border-surface-dim">
            <button className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-gray-500 hover:bg-surface-container-high hover:text-on-surface transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <Label size="sm">HELP CENTER</Label>
            </button>

            {/* User Profile */}
            {isAuthenticated && user && (
              <div className="mt-3 pt-3 border-t border-surface-dim">
                <div className="flex items-center gap-3 px-2">
                  <Avatar
                    initials={`${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`}
                    variant="secondary"
                    size="sm"
                    alt={`${user.firstName} ${user.lastName}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
              </div>
            )}

            <button 
              onClick={handleLogout} 
              className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-gray-400 hover:bg-surface-container-high hover:text-error transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-error/20 mt-1"
              aria-label="Log out"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <Label size="sm">LOGOUT</Label>
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // Horizontal Navigation (for Dashboard)
  return (
    <header className="sticky top-0 z-40 frosted-nav border-b border-surface-container-high/50 shadow-ambient" role="banner">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-8 group">
          <div>
            <h1 className="font-serif text-xl font-semibold text-primary group-hover:text-primary-container transition-colors duration-200">
              Majlis Digital
            </h1>
          </div>

          {/* Top Nav */}
          <nav className="flex items-center gap-1" aria-label="Main navigation">
            <Link
              href="/dashboard"
              className={`px-4 py-2 label-sm rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                pathname === "/dashboard"
                  ? "text-secondary bg-secondary-container/50"
                  : "text-gray-500 hover:text-on-surface hover:bg-surface-container-low"
              }`}
              aria-current={pathname === "/dashboard" ? "page" : undefined}
            >
              DASHBOARD
            </Link>
            <Link
              href="/legal-library"
              className={`px-4 py-2 label-sm rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                pathname === "/legal-library"
                  ? "text-secondary bg-secondary-container/50"
                  : "text-gray-500 hover:text-on-surface hover:bg-surface-container-low"
              }`}
              aria-current={pathname === "/legal-library" ? "page" : undefined}
            >
              KNOWLEDGE BASE
            </Link>
            <Link
              href="/case-tracker"
              className={`px-4 py-2 label-sm rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                pathname === "/case-tracker"
                  ? "text-secondary bg-secondary-container/50"
                  : "text-gray-500 hover:text-on-surface hover:bg-surface-container-low"
              }`}
              aria-current={pathname === "/case-tracker" ? "page" : undefined}
            >
              MY CASES
            </Link>
          </nav>
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <Link href="/subscription" className="btn-primary shadow-md hover:shadow-lg transition-all duration-200">
            CONSULT AI
          </Link>
          
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-on-surface">
                  {user.firstName} {user.lastName}
                </p>
                <Label variant="muted" className="capitalize">
                  {user.role || "Member"}
                </Label>
              </div>
              <Avatar
                initials={`${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`}
                variant="secondary"
                size="md"
                alt={`${user.firstName} ${user.lastName}`}
                className="ring-2 ring-surface-container-low shadow-md"
              />
            </div>
          ) : (
            <Link 
              href="/auth/login" 
              className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container hover:bg-secondary-container/80 transition-colors duration-200"
              aria-label="Sign in"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
