"use client";

import React from "react";

interface TonalCardProps {
  children: React.ReactNode;
  variant?: "default" | "tonal" | "elevated" | "primary" | "secondary";
  hover?: boolean;
  className?: string;
  onClick?: () => void;
  padding?: "none" | "sm" | "md" | "lg";
}

export default function TonalCard({
  children,
  variant = "default",
  hover = true,
  className = "",
  onClick,
  padding = "md",
}: TonalCardProps) {
  const baseStyles = "rounded-lg transition-all duration-300 ease-out";
  
  const variantStyles = {
    default: "bg-surface-container-lowest shadow-ambient",
    tonal: "bg-surface-container-low",
    elevated: "bg-surface-container-lowest shadow-float",
    primary: "bg-primary text-on-primary shadow-elevated",
    secondary: "bg-secondary-container text-on-secondary-container",
  };

  const hoverStyles = hover && onClick 
    ? "hover:bg-surface-container-highest hover:shadow-float hover:-translate-y-0.5 cursor-pointer" 
    : "";
  const clickStyles = onClick ? "cursor-pointer active:scale-[0.99]" : "";

  const paddingStyles = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${hoverStyles} ${clickStyles} ${paddingStyles[padding]} ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      aria-label={onClick ? "Interactive card" : undefined}
    >
      {children}
    </div>
  );
}
