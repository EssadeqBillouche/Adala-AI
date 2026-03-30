"use client";

import React from "react";
import TonalCard from "../../design/TonalCard";
import Label from "../../design/Label";
import DocumentItem from "./DocumentItem";

interface Document {
  id: string;
  fileName: string;
  uploadedAt: string;
  icon?: React.ReactNode;
}

interface KeyDocumentsProps {
  documents: Document[];
  onViewAll?: () => void;
}

export default function KeyDocuments({ documents, onViewAll }: KeyDocumentsProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <Label>KEY DOCUMENTS</Label>
        <button
          onClick={onViewAll}
          className="label-sm text-secondary hover:text-secondary-container transition-colors"
        >
          VIEW ALL
        </button>
      </div>

      <div className="space-y-3">
        {documents.map((doc) => (
          <DocumentItem
            key={doc.id}
            fileName={doc.fileName}
            uploadedAt={doc.uploadedAt}
            icon={doc.icon}
            variant={doc.id === "1" ? "primary" : "secondary"}
          />
        ))}
      </div>
    </div>
  );
}
