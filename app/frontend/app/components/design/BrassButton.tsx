"use client";

import React from "react";

interface BrassButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
}

export default function BrassButton({
  children,
  variant = "primary",
  size = "md",
  icon,
  onClick,
  disabled = false,
  className = "",
  type = "button",
}: BrassButtonProps) {
  const baseStyles = "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantStyles = {
    primary: "bg-primary text-on-primary hover:bg-primary-container shadow-ambient hover:shadow-float",
    secondary: "bg-secondary-container text-on-secondary-container hover:bg-[#e8d5b5]",
    ghost: "bg-transparent text-on-surface hover:bg-surface-container-high",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-3 text-sm",
    lg: "px-6 py-4 text-base",
  };

  return (
    <button
      type={type}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
