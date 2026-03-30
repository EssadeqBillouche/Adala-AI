"use client";

import React from "react";

interface TonalCardProps {
  children: React.ReactNode;
  variant?: "default" | "tonal" | "elevated" | "primary" | "secondary";
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function TonalCard({
  children,
  variant = "default",
  hover = true,
  className = "",
  onClick,
}: TonalCardProps) {
  const baseStyles = "rounded-lg transition-all duration-300 ease-out";
  
  const variantStyles = {
    default: "bg-surface-container-lowest shadow-ambient",
    tonal: "bg-surface-container-low",
    elevated: "bg-surface-container-lowest shadow-float",
    primary: "bg-primary text-on-primary shadow-float",
    secondary: "bg-secondary-container text-on-secondary-container",
  };

  const hoverStyles = hover && onClick ? "hover:bg-surface-container-highest hover:shadow-float cursor-pointer" : "";
  const clickStyles = onClick ? "cursor-pointer" : "";

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${hoverStyles} ${clickStyles} ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      {children}
    </div>
  );
}
