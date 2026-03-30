"use client";

import React from "react";

interface LabelProps {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "muted";
  className?: string;
  as?: "span" | "p" | "label";
}

export default function Label({
  children,
  variant = "default",
  className = "",
  as: Component = "span",
}: LabelProps) {
  const baseStyles = "text-xs font-semibold uppercase tracking-widest font-sans";
  
  const variantStyles = {
    default: "text-on-surface",
    secondary: "text-secondary",
    muted: "text-gray-400",
  };

  return (
    <Component className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </Component>
  );
}
