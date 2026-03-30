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
      <Label className="mb-4 block">LEGAL FOUNDATION</Label>

      <div className="space-y-5" role="list" aria-label="Legal foundation references">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3" role="listitem">
            <div
              className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${
                item.color === "secondary" ? "bg-secondary" : "bg-primary/30"
              }`}
              aria-hidden="true"
            />
            <div>
              <p className="font-medium text-on-surface text-sm">{item.title}</p>
              <p className="body-sm text-gray-500 mt-0.5 leading-relaxed">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
