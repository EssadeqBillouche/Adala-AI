"use client";

import React from "react";
import Label from "../../design/Label";

interface LegalFoundationItem {
  id: string;
  title: string;
  description: string;
  color?: "primary" | "secondary";
}

interface LegalFoundationProps {
  items: LegalFoundationItem[];
}

export default function LegalFoundation({ items }: LegalFoundationProps) {
  return (
    <div>
      <Label className="mb-4">LEGAL FOUNDATION</Label>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3">
            <div
              className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${
                item.color === "secondary" ? "bg-secondary" : "bg-primary/30"
              }`}
            />
            <div>
              <p className="font-medium text-on-surface">{item.title}</p>
              <p className="body-sm text-gray-500">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
