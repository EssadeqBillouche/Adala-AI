"use client";

import React from "react";
import ActionCard from "./ActionCard";

interface ActionCardsProps {
  actions: Array<{
    id: string;
    label: string;
    title: string;
    onClick?: () => void;
  }>;
}

export default function ActionCards({ actions }: ActionCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 max-w-2xl">
      {actions.map((action) => (
        <ActionCard
          key={action.id}
          label={action.label}
          title={action.title}
          onClick={action.onClick}
        />
      ))}
    </div>
  );
}
