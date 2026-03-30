"use client";

import React from "react";

interface AvatarProps {
  initials?: string;
  src?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "primary" | "secondary";
  className?: string;
}

export default function Avatar({
  initials = "",
  src,
  size = "md",
  variant = "default",
  className = "",
}: AvatarProps) {
  const baseStyles = "rounded-full flex items-center justify-center font-semibold shrink-0";
  
  const sizeStyles = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
  };

  const variantStyles = {
    default: "bg-surface-container-high text-gray-600",
    primary: "bg-primary text-on-primary",
    secondary: "bg-secondary-container text-on-secondary-container",
  };

  if (src) {
    return (
      <img
        src={src}
        alt={initials}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      />
    );
  }

  return (
    <div
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {initials}
    </div>
  );
}
