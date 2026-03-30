"use client";

import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import { Card, Button, IconButton } from "../components/UIComponents";
import ProtectedRoute from "../components/ProtectedRoute";
import Link from "next/link";

function LegalLibraryContent() {
  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar */}
      <Sidebar variant="vertical" />

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-24 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div>
                <h1 className="font-serif text-xl font-semibold text-primary">
                  Majlis Digital
                </h1>
              </div>

              {/* Top Navigation */}
              <nav className="flex items-center gap-1">
                <Link
                  href="/dashboard"
                  className="px-4 py-2 label-sm text-gray-500 hover:text-on-surface transition-colors"
                >
                  DASHBOARD
                </Link>
                <Link
                  href="/legal-library"
                  className="px-4 py-2 label-sm text-secondary border-b-2 border-secondary"
                >
                  KNOWLEDGE BASE
                </Link>
                <Link
                  href="/case-tracker"
                  className="px-4 py-2 label-sm text-gray-500 hover:text-on-surface transition-colors"
                >
                  MY CASES
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="primary">CONSULT AI</Button>
              <button className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <div className="px-8 py-6">
          {/* Hero Section */}
          <section className="mb-12">
            <p className="label-sm text-secondary mb-2">ARCHIVES & CODES</p>
            <h1 className="display-lg mb-4">The Legal Knowledge Base</h1>
            
            <div className="flex items-start gap-8 mb-8">
              {/* Search Bar */}
              <div className="flex-1 max-w-2xl">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search codes, decrees, or jurisprudence..."
                    className="w-full pl-12 pr-12 py-4 bg-surface-container-lowest rounded-md border-none focus:bg-surface-container-highest focus:ring-2 focus:ring-primary/10 transition-all duration-200 text-on-surface placeholder-gray-400"
                  />
                  <svg
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-on-surface transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="max-w-xs pt-2">
                <p className="body-sm text-gray-500">
                  Access the definitive collection of the Moroccan legal corpus, curated for precision and updated in real-time.
                </p>
              </div>
            </div>
          </section>

          {/* Legal Categories Grid */}
          <section className="mb-12">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Moroccan Penal Code - Featured Card */}
              <Card className="p-8 lg:col-span-1 bg-gradient-to-br from-surface-container-low to-surface-container-high" hover={true}>
                <div className="w-12 h-12 rounded-lg bg-secondary-container/50 flex items-center justify-center text-secondary mb-6">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="headline-md mb-3">Moroccan Penal Code</h3>
                <p className="body-sm text-gray-600 mb-6">
                  Complete documentation of criminal law, including recent amendments and specialized sections on economic crimes.
                </p>
                <div className="flex items-center gap-4">
                  <Link href="#" className="inline-flex items-center label-sm text-secondary hover:text-secondary-container transition-colors">
                    EXPLORE DOCUMENTS
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                  <span className="label-sm text-gray-400">LAST UPDATE: OCT 2023</span>
                </div>
              </Card>

              {/* Commercial Law */}
              <Card className="p-8" hover={true}>
                <div className="w-12 h-12 rounded-lg bg-secondary-container/30 flex items-center justify-center text-secondary mb-6">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="headline-md mb-3">Commercial Law</h3>
                <p className="body-sm text-gray-600 mb-6">
                  Business regulations, trade agreements, and corporate governance frameworks.
                </p>
                <Link href="#" className="inline-flex items-center label-sm text-secondary hover:text-secondary-container transition-colors">
                  OPEN LIBRARY
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </Link>
              </Card>

              {/* Placeholder for visual balance */}
              <div className="hidden lg:block" />
            </div>

            {/* Secondary Row */}
            <div className="grid md:grid-cols-3 gap-6 mt-6">
              {/* Moudawana */}
              <Card className="p-6" hover={true}>
                <div className="w-10 h-10 rounded-lg bg-secondary-container/30 flex items-center justify-center text-secondary mb-4">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M17 6a3 3 0 01-3 3h-1a1 1 0 00-1 1v3a1 1 0 01-1 1H8a1 1 0 01-1-1V9a1 1 0 00-1-1H5a3 3 0 01-3-3V5a3 3 0 013-3h9a3 3 0 013 3v1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="headline-md mb-2">Moudawana</h3>
                <p className="body-sm text-gray-600">Family code and personal status laws.</p>
              </Card>

              {/* Real Estate Law */}
              <Card className="p-6" hover={true}>
                <div className="w-10 h-10 rounded-lg bg-secondary-container/30 flex items-center justify-center text-secondary mb-4">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="headline-md mb-2">Real Estate Law</h3>
                <p className="body-sm text-gray-600">Land registration and property ownership acts.</p>
              </Card>

              {/* Labor Code */}
              <Card className="p-6" hover={true}>
                <div className="w-10 h-10 rounded-lg bg-secondary-container/30 flex items-center justify-center text-secondary mb-4">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.586a1 1 0 01-.293.707l-3.414 3.414a1 1 0 01-.707.293H5.707a1 1 0 01-.707-.293L1.586 12.293A1 1 0 011.293 11.586V8a2 2 0 012-2h3zm5-1a1 1 0 00-1-1H9a1 1 0 00-1 1v1H6a1 1 0 00-1 1v3.586l3 3h5l3-3V8a1 1 0 00-1-1h-2V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="headline-md mb-2">Labor Code</h3>
                <p className="body-sm text-gray-600">Employment contracts and workers&apos; rights.</p>
              </Card>
            </div>
          </section>

          {/* Recent Gazettes Section */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="headline-md">Recent Gazettes</h2>
                <p className="body-sm text-gray-500 mt-1">Bulletins Officiels du Royaume du Maroc</p>
              </div>
              <Link href="#" className="label-sm text-secondary hover:text-secondary-container transition-colors">
                VIEW FULL ARCHIVE
              </Link>
            </div>

            <div className="space-y-3">
              {/* Gazette Entry 1 */}
              <Card className="p-4 flex items-center gap-4" hover={true}>
                <div className="w-14 h-14 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                  <svg className="w-7 h-7 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 100 2h6a1 1 0 100-2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="label-sm text-secondary mb-1">N° 7245 — ARABIC/FRENCH</p>
                  <h3 className="font-medium text-on-surface">Decree No. 2.23.105: Administrative Reforms</h3>
                  <p className="body-sm text-gray-500">Published: October 24, 2023</p>
                </div>
                <div className="flex items-center gap-2">
                  <IconButton
                    icon={
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    }
                    variant="ghost"
                    size="md"
                    className="text-gray-400 hover:text-secondary"
                  />
                  <IconButton
                    icon={
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.21 8 15 8z" />
                      </svg>
                    }
                    variant="ghost"
                    size="md"
                    className="text-gray-400 hover:text-secondary"
                  />
                </div>
              </Card>

              {/* Gazette Entry 2 */}
              <Card className="p-4 flex items-center gap-4" hover={true}>
                <div className="w-14 h-14 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                  <svg className="w-7 h-7 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 100 2h6a1 1 0 100-2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="label-sm text-secondary mb-1">N° 7244 — ARABIC</p>
                  <h3 className="font-medium text-on-surface">Dahir No. 1.23.76: Judicial Council Regulations</h3>
                  <p className="body-sm text-gray-500">Published: October 17, 2023</p>
                </div>
                <div className="flex items-center gap-2">
                  <IconButton
                    icon={
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    }
                    variant="ghost"
                    size="md"
                    className="text-gray-400 hover:text-secondary"
                  />
                  <IconButton
                    icon={
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.21 8 15 8z" />
                      </svg>
                    }
                    variant="ghost"
                    size="md"
                    className="text-gray-400 hover:text-secondary"
                  />
                </div>
              </Card>
            </div>
          </section>
        </div>

        <Footer />
      </main>
    </div>
  );
}

export default function LegalLibraryPage() {
  return (
    <ProtectedRoute>
      <LegalLibraryContent />
    </ProtectedRoute>
  );
}
