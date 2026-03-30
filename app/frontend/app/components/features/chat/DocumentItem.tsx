"use client";

import React from "react";
import TonalCard from "../../design/TonalCard";
import Label from "../../design/Label";
import BrassButton from "../../design/BrassButton";

interface DocumentItemProps {
  fileName: string;
  uploadedAt: string;
  icon?: React.ReactNode;
  variant?: "default" | "primary" | "secondary";
  onClick?: () => void;
}

export default function DocumentItem({
  fileName,
  uploadedAt,
  icon,
  variant = "default",
  onClick,
}: DocumentItemProps) {
  const defaultIcon = (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
    </svg>
  );

  const variantStyles = {
    default: "bg-surface-container-high text-gray-500",
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary-container/30 text-secondary",
  };

  return (
    <TonalCard className="p-3 flex items-center gap-3" hover={true} onClick={onClick}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${variantStyles[variant]}`}>
        {icon || defaultIcon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-on-surface truncate">{fileName}</p>
        <Label variant="muted" className="mt-0.5">{uploadedAt}</Label>
      </div>
    </TonalCard>
  );
}
