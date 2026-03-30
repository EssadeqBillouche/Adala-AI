"use client";

import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import { Button, Card, Input, Chip, Divider } from "../components/UIComponents";
import ProtectedRoute from "../components/ProtectedRoute";
import Link from "next/link";

function DashboardContent() {
  return (
    <div className="min-h-screen bg-surface flex">
      {/* Hidden sidebar for layout consistency */}
      <div className="hidden lg:block w-64 shrink-0">
        <Sidebar variant="vertical" />
      </div>

      <div className="flex-1 flex flex-col">
        <Sidebar variant="horizontal" />

        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative py-16 px-6 overflow-hidden">
            <div className="absolute inset-0 zellij-overlay opacity-50" />
            
            <div className="max-w-7xl mx-auto relative z-10">
              {/* Eyebrow */}
              <p className="label-sm text-secondary mb-4 text-center">
                JURISPRUDENCE MOROCCAN EXCELLENCE
              </p>

              {/* Main Headline */}
              <h1 className="display-lg text-center mb-8">
                Navigate the <span className="italic text-secondary">Complexity</span>
                <br />
                of Moroccan Law.
              </h1>

              {/* Search Bar */}
              <div className="max-w-2xl mx-auto mb-4">
                <div className="flex items-center bg-surface-container-lowest rounded-md shadow-float">
                  <div className="pl-4 text-secondary">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12l2 2m0 0l2-2m-2 2V5m9 9l2-2m0 0l2 2m-2-2v9M5 12a7 7 0 007 7m0 0a7 7 0 007-7m-7 7V5" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Ask about labor law, property disputes, or family code..."
                    className="flex-1 px-4 py-4 bg-transparent border-none focus:outline-none text-on-surface placeholder-gray-400"
                  />
                  <Button variant="secondary" className="m-2">
                    CONSULT
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Button>
                </div>
              </div>

              {/* Subtitle */}
              <p className="label-sm text-center text-gray-400 mb-12">
                AI-POWERED LEGAL INTELLIGENCE BASED ON THE MOROCCAN PENAL CODE
              </p>

              {/* Hero Content Grid */}
              <div className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {/* Image Card */}
                <Card className="overflow-hidden" hover={false}>
                  <div className="aspect-[4/3] bg-gradient-to-br from-secondary/20 to-secondary/5 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center p-8">
                        <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-secondary-container/30 flex items-center justify-center">
                          <svg className="w-16 h-16 text-secondary" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M4 4h16v16H4z" fill="none"/>
                            <path d="M6 6h12v12H6z" fill="currentColor" opacity="0.3"/>
                          </svg>
                        </div>
                        <p className="label-sm text-secondary">Moroccan Craftsmanship</p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Info Card */}
                <Card className="p-8" hover={false}>
                  <h3 className="headline-md mb-4 italic text-primary">Digital Majlis</h3>
                  <p className="body-md text-gray-600 mb-6">
                    Bridging ancestral wisdom with modern precision. Our platform provides instant access to digitized legal archives and AI-assisted case management tailored for the Moroccan landscape.
                  </p>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-3xl font-serif font-semibold text-secondary">2.4k</p>
                      <p className="label-sm text-gray-400 mt-1">ACTIVE CASES</p>
                    </div>
                    <div>
                      <p className="text-3xl font-serif font-semibold text-secondary">98%</p>
                      <p className="label-sm text-gray-400 mt-1">ACCURACY</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </section>

          {/* Capabilities Section */}
          <section className="py-16 px-6 bg-surface-container-low">
            <div className="max-w-7xl mx-auto">
              <p className="label-sm text-gray-400 mb-2">OUR CAPABILITIES</p>
              <h2 className="display-md mb-12">Legal Infrastructure for the Digital Age</h2>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* AI Consultation Card */}
                <Card className="p-8 lg:col-span-1" hover={true}>
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-12 h-12 rounded-lg bg-secondary-container/30 flex items-center justify-center text-secondary">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="w-24 h-24 bg-surface-container-high rounded-md" />
                  </div>
                  <h3 className="headline-md mb-3">AI Consultation</h3>
                  <p className="body-sm text-gray-600 mb-6">
                    Engage with a specialized LLM trained on Moroccan Jurisprudence. Get immediate citations from the Official Bulletin and relevant case law history.
                  </p>
                  <Link href="/consult-ai" className="inline-flex items-center label-sm text-secondary hover:text-secondary-container transition-colors">
                    START SESSION
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </Card>

                {/* Legal Library Card */}
                <Card className="p-8 gradient-hero text-on-primary lg:col-span-1" hover={true}>
                  <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center mb-6">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                    </svg>
                  </div>
                  <h3 className="headline-md mb-3">Legal Library</h3>
                  <p className="body-sm opacity-90 mb-6">
                    A curated database of the Moroccan Penal Code, Civil Code, and Moudawana.
                  </p>
                  <Link href="/legal-library" className="inline-flex items-center label-sm text-white hover:text-secondary-container transition-colors underline decoration-white/50 underline-offset-4">
                    BROWSE ARCHIVES
                  </Link>
                </Card>

                {/* Case Tracker Card */}
                <Card className="p-8 bg-surface-container-low lg:col-span-1" hover={true}>
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm14 1a1 1 0 11-2 0 1 1 0 012 0zM2 13a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2zm14 1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="headline-md mb-3">Case Tracker</h3>
                  <p className="body-sm text-gray-600 mb-6">
                    End-to-end encrypted tracking for your active litigation and legal document workflows.
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-xs font-semibold text-on-secondary-container border-2 border-surface-container-low">MK</div>
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary border-2 border-surface-container-low">SA</div>
                    </div>
                    <p className="label-sm text-gray-400">12 UPDATES TODAY</p>
                  </div>
                </Card>
              </div>

              {/* Precedent Analytics Card */}
              <Card className="mt-6 p-8" hover={false}>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="headline-md mb-1">Precedent Analytics</h3>
                    <p className="label-sm text-gray-400">REAL-TIME DATA STREAM</p>
                  </div>
                  <Chip variant="secondary">SYSTEM LIVE</Chip>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="p-4 bg-surface-container-low rounded-lg">
                    <p className="label-sm text-gray-500 mb-2">Success Rate</p>
                    <p className="text-2xl font-serif font-semibold text-primary">84%</p>
                  </div>
                  <div className="p-4 bg-surface-container-low rounded-lg">
                    <p className="label-sm text-gray-500 mb-2">Resolution</p>
                    <p className="text-2xl font-serif font-semibold text-primary">14 Days</p>
                  </div>
                  <div className="p-4 bg-surface-container-low rounded-lg">
                    <p className="label-sm text-gray-500 mb-2">Verified</p>
                    <p className="text-2xl font-serif font-semibold text-primary">12.5k</p>
                  </div>
                  <div className="p-4 bg-surface-container-low rounded-lg">
                    <p className="label-sm text-gray-500 mb-2">Cost Saved</p>
                    <p className="text-2xl font-serif font-semibold text-primary">35%</p>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          <Footer />
        </main>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
