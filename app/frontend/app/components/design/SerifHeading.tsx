"use client";

import React from "react";

interface SerifHeadingProps {
  children: React.ReactNode;
  level?: "display" | "h1" | "h2" | "h3" | "h4";
  size?: "lg" | "md" | "sm";
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
}

export default function SerifHeading({
  children,
  level = "h2",
  size = "md",
  className = "",
  as: Component = "h2",
}: SerifHeadingProps) {
  const baseStyles = "font-serif font-semibold text-on-surface";
  
  const sizeStyles = {
    display: "text-5xl leading-tight tracking-tight",
    lg: "text-3xl leading-snug",
    md: "text-2xl leading-relaxed",
    sm: "text-xl leading-relaxed",
  };

  const levelStyles = {
    display: "text-5xl",
    h1: "text-4xl",
    h2: "text-2xl",
    h3: "text-xl",
    h4: "text-lg",
  };

  return (
    <Component className={`${baseStyles} ${size === "md" ? levelStyles[level] : sizeStyles[size]} ${className}`}>
      {children}
    </Component>
  );
}
