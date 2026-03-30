"use client";

import React from "react";
import Link from "next/link";
import Label from "../../design/Label";
import SerifHeading from "../../design/SerifHeading";
import Avatar from "../../design/Avatar";

interface ChatTopNavProps {
  sessionLabel?: string;
  title?: string;
  userInitials?: string;
  userName?: string;
}

export default function ChatTopNav({
  sessionLabel = "CURRENT SESSION",
  title = "Consult AI Assistant",
  userInitials = "JD",
}: ChatTopNavProps) {
  const navItems = [
    { label: "DASHBOARD", href: "/dashboard" },
    { label: "KNOWLEDGE BASE", href: "/legal-library" },
    { label: "MY CASES", href: "/case-tracker", active: true },
  ];

  return (
    <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-24 px-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          <Label variant="muted" className="mb-1">{sessionLabel}</Label>
          <SerifHeading level="h1" size="lg">{title}</SerifHeading>
        </div>

        <div className="flex items-center gap-6">
          {/* Top Navigation */}
          <nav className="flex items-center gap-1" aria-label="Main navigation">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 label-sm transition-colors ${
                  item.active
                    ? "text-secondary border-b-2 border-secondary"
                    : "text-gray-500 hover:text-on-surface"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Profile */}
          <Avatar initials={userInitials} variant="secondary" size="md" />
        </div>
      </div>
    </header>
  );
}
