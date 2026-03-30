"use client";

import React from "react";

interface SerifHeadingProps {
  children: React.ReactNode;
  level?: "display" | "h1" | "h2" | "h3" | "h4";
  size?: "lg" | "md" | "sm";
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
  weight?: "normal" | "medium" | "semibold";
}

export default function SerifHeading({
  children,
  level = "h2",
  size = "md",
  className = "",
  as: Component = "h2",
  weight = "semibold",
}: SerifHeadingProps) {
  const baseStyles = "font-serif text-on-surface";
  
  const weightStyles = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
  };

  const sizeStyles = {
    display: "text-4xl md:text-5xl lg:text-6xl leading-tight tracking-tight",
    lg: "text-3xl md:text-4xl leading-snug",
    md: "text-2xl md:text-3xl leading-relaxed",
    sm: "text-xl md:text-2xl leading-relaxed",
  };

  const levelStyles = {
    display: "text-4xl md:text-5xl lg:text-6xl",
    h1: "text-3xl md:text-4xl",
    h2: "text-2xl md:text-3xl",
    h3: "text-xl md:text-2xl",
    h4: "text-lg md:text-xl",
  };

  return (
    <Component 
      className={`${baseStyles} ${weightStyles[weight]} ${size === "md" ? levelStyles[level] : sizeStyles[size]} ${className}`}
    >
      {children}
    </Component>
  );
}
