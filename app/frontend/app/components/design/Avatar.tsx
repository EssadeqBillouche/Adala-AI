"use client";

import React from "react";

interface AvatarProps {
  initials?: string;
  src?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "default" | "primary" | "secondary";
  className?: string;
  alt?: string;
}

export default function Avatar({
  initials = "",
  src,
  size = "md",
  variant = "default",
  className = "",
  alt = "User avatar",
}: AvatarProps) {
  const baseStyles = "rounded-full flex items-center justify-center font-semibold shrink-0 overflow-hidden";
  
  const sizeStyles = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
  };

  const variantStyles = {
    default: "bg-surface-container-high text-gray-600",
    primary: "gradient-hero text-on-primary",
    secondary: "bg-secondary-container text-on-secondary-container",
  };

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      />
    );
  }

  return (
    <div
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      aria-label={alt}
      role="img"
    >
      {initials}
    </div>
  );
}
