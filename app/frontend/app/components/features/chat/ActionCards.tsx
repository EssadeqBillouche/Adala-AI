"use client";

import React from "react";
import ActionCard from "./ActionCard";

interface Action {
  id: string;
  label: string;
  title: string;
  onClick?: () => void;
}

interface ActionCardsProps {
  actions: Action[];
}

export default function ActionCards({ actions }: ActionCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl" role="group" aria-label="Suggested actions">
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
