"use client";

import React from "react";

interface LabelProps {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "muted" | "primary";
  className?: string;
  as?: "span" | "p" | "label" | "div";
  size?: "xs" | "sm";
}

export default function Label({
  children,
  variant = "default",
  className = "",
  as: Component = "span",
  size = "xs",
}: LabelProps) {
  const baseStyles = "font-semibold uppercase tracking-widest font-sans";
  
  const sizeStyles = {
    xs: "text-[0.65rem]",
    sm: "text-xs",
  };

  const variantStyles = {
    default: "text-on-surface",
    secondary: "text-secondary",
    muted: "text-gray-400",
    primary: "text-primary",
  };

  return (
    <Component className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {children}
    </Component>
  );
}
