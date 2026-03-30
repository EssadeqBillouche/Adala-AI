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
    <TonalCard className="p-4" hover={true} onClick={onClick}>
      <Label variant="secondary" className="mb-1">{label}</Label>
      <p className="font-medium text-on-surface">{title}</p>
    </TonalCard>
  );
}
