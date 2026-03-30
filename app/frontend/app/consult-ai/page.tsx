"use client";

import ProtectedRoute from "../components/ProtectedRoute";
import { ChatLayout, type Message, type Action } from "../components/features/chat";

function ConsultAIContent() {
  const handleSendMessage = (message: string) => {
    console.log("Sending message:", message);
    // TODO: Integrate with backend AI API
  };

  const handleAttachFile = () => {
    console.log("Attaching file");
    // TODO: Implement file upload
  };

  const handleActionClick = (actionId: string) => {
    console.log("Action clicked:", actionId);
    // TODO: Handle action clicks
  };

  return (
    <ChatLayout
      messages={[
        {
          id: "1",
          type: "ai",
          content: (
            <>
              Good morning. I have reviewed the documents you uploaded regarding the property dispute in Marrakech. Based on the{" "}
              <strong className="font-serif">Moroccan Code of Obligations and Contracts</strong>, there are three primary articles that apply to your current situation. How would you like to proceed?
            </>
          ),
          timestamp: "09:41 AM",
          senderName: "Majlis Counsel",
        },
        {
          id: "2",
          type: "user",
          content: "Please explain Article 488 in the context of family-owned land that hasn't been formally registered in the Land Registry (Conservation Foncière) yet.",
          timestamp: "09:45 AM",
        },
      ]}
      actions={[
        {
          id: "1",
          label: "ARTICLE 488",
          title: "Review Property Transfer Laws",
          onClick: () => handleActionClick("1"),
        },
        {
          id: "2",
          label: "PROCEDURAL",
          title: "Generate Draft Petition",
          onClick: () => handleActionClick("2"),
        },
      ]}
      showTyping
      onSendMessage={handleSendMessage}
      onAttachFile={handleAttachFile}
      caseContext={{
        reference: "MD-2024-882",
        summary: "Inheritance dispute involving agricultural land in the Ourika Valley. Client seeking clarification on traditional vs. formal property rights.",
        documents: [
          { id: "1", fileName: "Family_Certificate.pdf", uploadedAt: "UPLOADED 2 DAYS AGO" },
          { id: "2", fileName: "Land_Map_Annotated.png", uploadedAt: "UPLOADED 2 DAYS AGO" },
        ],
        legalFoundation: [
          { id: "1", title: "Moudawana (Family Code)", description: "Book 6: Inheritances and its Liquidation.", color: "secondary" },
          { id: "2", title: "Royal Decree 1-11-177", description: "Amendments to the Land Registry procedures.", color: "primary" },
        ],
      }}
    />
  );
}

export default function ConsultAIPage() {
  return (
    <ProtectedRoute>
      <ConsultAIContent />
    </ProtectedRoute>
  );
}
