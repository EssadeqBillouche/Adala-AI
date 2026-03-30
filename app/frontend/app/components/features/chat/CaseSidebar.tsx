"use client";

import React from "react";
import TonalCard from "../../design/TonalCard";
import Label from "../../design/Label";
import SerifHeading from "../../design/SerifHeading";
import KeyDocuments from "./KeyDocuments";
import LegalFoundation from "./LegalFoundation";

interface Document {
  id: string;
  fileName: string;
  uploadedAt: string;
  icon?: React.ReactNode;
}

interface LegalFoundationItem {
  id: string;
  title: string;
  description: string;
  color?: "primary" | "secondary";
}

interface CaseSidebarProps {
  caseReference?: string;
  summary?: string;
  documents?: Document[];
  legalFoundation?: LegalFoundationItem[];
  onViewAllDocuments?: () => void;
}

export default function CaseSidebar({
  caseReference = "MD-2024-882",
  summary = "Inheritance dispute involving agricultural land in the Ourika Valley. Client seeking clarification on traditional vs. formal property rights.",
  documents = [
    {
      id: "1",
      fileName: "Family_Certificate.pdf",
      uploadedAt: "UPLOADED 2 DAYS AGO",
    },
    {
      id: "2",
      fileName: "Land_Map_Annotated.png",
      uploadedAt: "UPLOADED 2 DAYS AGO",
    },
  ],
  legalFoundation = [
    {
      id: "1",
      title: "Moudawana (Family Code)",
      description: "Book 6: Inheritances and its Liquidation.",
      color: "secondary",
    },
    {
      id: "2",
      title: "Royal Decree 1-11-177",
      description: "Amendments to the Land Registry procedures.",
      color: "primary",
    },
  ],
  onViewAllDocuments,
}: CaseSidebarProps) {
  return (
    <aside className="w-80 bg-surface-container-low border-l border-surface-container-high p-6 overflow-y-auto" aria-label="Case context sidebar">
      <div>
        <Label variant="muted" className="mb-1 block">REFERENCE</Label>
        <SerifHeading level="h3" size="md" className="mb-6">Case Context</SerifHeading>

        {/* Summary Card */}
        <TonalCard className="p-5 mb-6" hover={false}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-secondary-container/50 flex items-center justify-center text-secondary">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 100 2h6a1 1 0 100-2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
            </div>
            <Label>SUMMARY</Label>
          </div>
          <p className="body-sm text-gray-600 leading-relaxed">{summary}</p>
        </TonalCard>

        {/* Key Documents */}
        <KeyDocuments documents={documents} onViewAll={onViewAllDocuments} />

        {/* Legal Foundation */}
        <LegalFoundation items={legalFoundation} />
      </div>
    </aside>
  );
}
