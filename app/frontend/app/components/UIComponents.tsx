"use client";

import React from "react";

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  children,
  icon,
  className = "",
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 rounded-md";
  
  const variantStyles = {
    primary: "bg-primary text-on-primary hover:bg-primary-container shadow-ambient hover:shadow-float",
    secondary: "bg-secondary-container text-on-secondary-container hover:bg-[#e8d5b5]",
    ghost: "bg-transparent text-on-surface hover:bg-surface-container-high",
    outline: "border border-outline-variant text-on-surface hover:bg-surface-container-high",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-3 text-sm",
    lg: "px-6 py-4 text-base",
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

// Card Component
interface CardProps {
  children: React.ReactNode;
  variant?: "default" | "tonal" | "elevated";
  className?: string;
  hover?: boolean;
}

export function Card({ children, variant = "default", className = "", hover = true }: CardProps) {
  const variantStyles = {
    default: "bg-surface-container-lowest shadow-ambient",
    tonal: "bg-surface-container-low",
    elevated: "bg-surface-container-lowest shadow-float",
  };

  const hoverStyles = hover ? "hover:bg-surface-container-highest hover:shadow-float transition-all duration-300 ease-out" : "";

  return (
    <div className={`rounded-lg ${variantStyles[variant]} ${hoverStyles} ${className}`}>
      {children}
    </div>
  );
}

// Progress Bar Component
interface ProgressBarProps {
  value: number;
  variant?: "primary" | "secondary";
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({ value, variant = "primary", showLabel = true, className = "" }: ProgressBarProps) {
  const fillColors = {
    primary: "bg-primary",
    secondary: "bg-secondary",
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="label-sm text-gray-500">Progress</span>
          <span className="label-sm text-on-surface">{value}%</span>
        </div>
      )}
      <div className="h-1 bg-surface-container-high rounded-full overflow-hidden">
        <div
          className={`h-full ${fillColors[variant]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// Status Badge Component
interface StatusBadgeProps {
  status: "verified" | "inreview" | "pending" | "archived";
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({ status, children, className = "" }: StatusBadgeProps) {
  const statusStyles = {
    verified: "bg-primary/10 text-primary",
    inreview: "bg-secondary-container text-on-secondary-container",
    pending: "bg-surface-container-high text-gray-600",
    archived: "bg-surface-container text-gray-400",
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${statusStyles[status]} ${className}`}>
      {children}
    </span>
  );
}

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "minimal" | "underline" | "outlined";
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({
  variant = "minimal",
  label,
  error,
  icon,
  className = "",
  ...props
}: InputProps) {
  const baseStyles = "w-full px-4 py-3 font-sans text-on-surface transition-all duration-200 rounded-md";
  
  const variantStyles = {
    minimal: "bg-surface-container-high border-none focus:bg-surface-container-highest focus:ring-2 focus:ring-primary/10",
    underline: "bg-transparent border-b border-outline/30 rounded-none focus:border-b-primary focus:outline-none",
    outlined: "bg-surface-container-lowest border border-outline-variant focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10",
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block label-sm text-gray-500 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          className={`${baseStyles} ${variantStyles[variant]} ${icon ? "pl-10" : ""}`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-error">{error}</p>
      )}
    </div>
  );
}

// Search Input Component
interface SearchInputProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

export function SearchInput({ placeholder = "Search...", onSearch, className = "" }: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        placeholder={placeholder}
        className="w-full pl-12 pr-4 py-3 bg-surface-container-high rounded-md border-none focus:bg-surface-container-highest focus:ring-2 focus:ring-primary/10 transition-all duration-200"
        onChange={(e) => onSearch?.(e.target.value)}
      />
      <svg
        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
  );
}

// Section Header Component
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, subtitle, action, className = "" }: SectionHeaderProps) {
  return (
    <div className={`flex items-end justify-between mb-6 ${className}`}>
      <div className="section-divider">
        <h2 className="headline-md">{title}</h2>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  icon?: React.ReactNode;
  variant?: "default" | "primary" | "secondary";
  className?: string;
}

export function StatCard({
  label,
  value,
  trend,
  trendUp,
  icon,
  variant = "default",
  className = "",
}: StatCardProps) {
  const variantStyles = {
    default: "bg-surface-container-lowest",
    primary: "bg-primary text-on-primary",
    secondary: "bg-secondary-container text-on-secondary-container",
  };

  return (
    <Card className={`p-6 ${variantStyles[variant]} ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="label-sm opacity-70 mb-1">{label}</p>
          <p className={`text-4xl font-serif font-semibold ${variant === "primary" ? "text-on-primary" : "text-on-surface"}`}>
            {value}
          </p>
          {trend && (
            <p className={`label-sm mt-2 ${trendUp ? "text-secondary" : "text-gray-500"}`}>
              {trend}
            </p>
          )}
        </div>
        {icon && (
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${variant === "primary" ? "bg-white/10" : "bg-surface-container-high"}`}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

// Tag/Chip Component
interface ChipProps {
  children: React.ReactNode;
  variant?: "default" | "primary" | "secondary";
  className?: string;
}

export function Chip({ children, variant = "default", className = "" }: ChipProps) {
  const variantStyles = {
    default: "bg-surface-container-high text-gray-600",
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary-container text-on-secondary-container",
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}

// Divider Component
export function Divider({ className = "" }: { className?: string }) {
  return (
    <div className={`h-px bg-surface-dim ${className}`} />
  );
}

// Icon Button Component
interface IconButtonProps {
  icon: React.ReactNode;
  variant?: "ghost" | "filled" | "outline";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
  active?: boolean;
}

export function IconButton({
  icon,
  variant = "ghost",
  size = "md",
  onClick,
  className = "",
  active = false,
}: IconButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-md transition-all duration-200";
  
  const variantStyles = {
    ghost: active ? "bg-surface-container-high text-on-surface" : "text-gray-500 hover:bg-surface-container-high hover:text-on-surface",
    filled: "bg-primary text-on-primary hover:bg-primary-container",
    outline: "border border-outline-variant text-gray-500 hover:bg-surface-container-high",
  };

  const sizeStyles = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      onClick={onClick}
    >
      {icon}
    </button>
  );
}
