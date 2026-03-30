"use client";

import React from "react";
import Label from "../../design/Label";

interface DateDividerProps {
  date: string;
}

export default function DateDivider({ date }: DateDividerProps) {
  return (
    <div className="flex items-center justify-center py-4">
      <span className="label-sm text-gray-400 px-4 py-1 bg-surface-container-low rounded-full">
        {date}
      </span>
    </div>
  );
}
