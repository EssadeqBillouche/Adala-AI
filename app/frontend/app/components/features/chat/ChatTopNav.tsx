"use client";

import React from "react";
import Link from "next/link";
import Label from "../../design/Label";
import SerifHeading from "../../design/SerifHeading";
import Avatar from "../../design/Avatar";

interface NavItem {
  label: string;
  href: string;
  active?: boolean;
}

interface ChatTopNavProps {
  sessionLabel?: string;
  title?: string;
  userInitials?: string;
  userName?: string;
  navItems?: NavItem[];
}

export default function ChatTopNav({
  sessionLabel = "CURRENT SESSION",
  title = "Consult AI Assistant",
  userInitials = "JD",
  navItems = [
    { label: "DASHBOARD", href: "/dashboard" },
    { label: "KNOWLEDGE BASE", href: "/legal-library" },
    { label: "MY CASES", href: "/case-tracker", active: true },
  ],
}: ChatTopNavProps) {
  return (
    <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-24 px-8 py-4 border-b border-surface-container-high/50" role="banner">
      <div className="flex items-center justify-between">
        <div>
          <Label variant="muted" className="mb-1.5 block">{sessionLabel}</Label>
          <SerifHeading level="h1" size="lg" weight="semibold">{title}</SerifHeading>
        </div>

        <div className="flex items-center gap-6">
          {/* Top Navigation */}
          <nav className="flex items-center gap-1" aria-label="Main navigation">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 label-sm rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  item.active
                    ? "text-secondary bg-secondary-container/50"
                    : "text-gray-500 hover:text-on-surface hover:bg-surface-container-low"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Profile */}
          <Avatar 
            initials={userInitials} 
            variant="secondary" 
            size="md" 
            alt="User profile"
            className="ring-2 ring-surface-container-low"
          />
        </div>
      </div>
    </header>
  );
}
