"use client";

import React from "react";
import TonalCard from "../../design/TonalCard";
import Label from "../../design/Label";

interface ActionCardProps {
  label: string;
  title: string;
  onClick?: () => void;
}

export default function ActionCard({ label, title, onClick }: ActionCardProps) {
  return (
    <TonalCard 
      className="p-5 group" 
      hover={true} 
      onClick={onClick}
      padding="none"
    >
      <div className="p-5">
        <Label variant="secondary" className="mb-2 block">{label}</Label>
        <p className="font-medium text-on-surface text-base group-hover:text-secondary transition-colors duration-200">
          {title}
        </p>
      </div>
    </TonalCard>
  );
}
