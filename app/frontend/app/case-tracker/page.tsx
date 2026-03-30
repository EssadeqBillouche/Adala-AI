"use client";

import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import { Card, Button, ProgressBar, StatusBadge, Chip, IconButton } from "../components/UIComponents";
import ProtectedRoute from "../components/ProtectedRoute";
import Link from "next/link";

function CaseTrackerContent() {
  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar */}
      <Sidebar variant="vertical" />

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-24 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="label-sm text-secondary mb-1">CASE MANAGEMENT</p>
              <h1 className="display-md">My Case Tracker</h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search dossiers..."
                  className="w-64 pl-10 pr-4 py-2.5 bg-surface-container-high rounded-md border-none focus:bg-surface-container-highest focus:ring-2 focus:ring-primary/10 transition-all duration-200"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Notifications */}
              <button className="relative w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-gray-600 hover:bg-surface-container-highest transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
                <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full" />
              </button>

              {/* Profile */}
              <button className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <div className="px-8 py-6">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* Total Active Matters */}
            <Card className="p-6" hover={false}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="label-sm text-gray-500">TOTAL ACTIVE MATTERS</p>
                  <p className="text-5xl font-serif font-semibold text-primary mt-2">07</p>
                </div>
                <div className="w-16 h-8 bg-surface-container-high rounded-full flex items-center px-1">
                  <div className="w-6 h-6 bg-secondary-container rounded-full" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-secondary font-semibold">+2 this month</span>
              </div>
            </Card>

            {/* Pending Review */}
            <Card className="p-6 bg-surface-container-low" hover={false}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-secondary-container/50 flex items-center justify-center text-secondary">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="label-sm text-gray-500">PENDING REVIEW</p>
                  <p className="text-3xl font-serif font-semibold text-on-surface">03</p>
                </div>
              </div>
            </Card>

            {/* Resolved Cases */}
            <Card className="p-6 gradient-hero text-on-primary" hover={false}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="label-sm opacity-70">RESOLVED CASES</p>
                  <p className="text-3xl font-serif font-semibold">24</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Active Jurisprudence Section */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="section-divider">
                <h2 className="headline-md">Active Jurisprudence</h2>
              </div>
              <div className="flex items-center gap-2">
                <button className="label-sm text-secondary border-b-2 border-secondary px-2 py-1">
                  ALL CASES
                </button>
                <button className="label-sm text-gray-400 hover:text-on-surface px-2 py-1 transition-colors">
                  ARCHIVED
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Case Card 1 - Marrakesh Heritage */}
              <Card className="p-6" hover={true}>
                <div className="flex items-start justify-between mb-4">
                  <Chip variant="secondary">REAL ESTATE LAW</Chip>
                  <IconButton
                    icon={
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    }
                    variant="ghost"
                    size="sm"
                  />
                </div>

                <h3 className="headline-md mb-1">Marrakesh Heritage Property Dispute</h3>
                <p className="body-sm text-gray-500 mb-4">Ref: MD-2024-MAR-882</p>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="label-sm text-gray-500">PROCEDURAL PROGRESS</span>
                    <span className="label-sm text-on-surface">65%</span>
                  </div>
                  <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: "65%" }} />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-surface-container-high">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary-container/30 flex items-center justify-center text-secondary">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="label-sm text-gray-500">NEXT HEARING</p>
                      <p className="font-medium text-on-surface">Oct 24, 2024</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <IconButton
                      icon={
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                      }
                      variant="filled"
                      size="sm"
                    />
                    <Button variant="secondary" size="sm">
                      VIEW FILE
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Case Card 2 - Casablanca Port */}
              <Card className="p-6" hover={true}>
                <div className="flex items-start justify-between mb-4">
                  <Chip>COMMERCIAL CODE</Chip>
                  <IconButton
                    icon={
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    }
                    variant="ghost"
                    size="sm"
                  />
                </div>

                <h3 className="headline-md mb-1">Casablanca Port Logistics Agreement</h3>
                <p className="body-sm text-gray-500 mb-4">Ref: MD-2024-CAS-104</p>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="label-sm text-gray-500">DRAFTING STAGE</span>
                    <span className="label-sm text-on-surface">90%</span>
                  </div>
                  <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{ width: "90%" }} />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-surface-container-high">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="label-sm text-gray-500">LAST UPDATE</p>
                      <p className="font-medium text-on-surface">2 hours ago</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <IconButton
                      icon={
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                      }
                      variant="filled"
                      size="sm"
                    />
                    <Button variant="secondary" size="sm">
                      VIEW FILE
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* Legal Documentation Section */}
          <section className="mb-12">
            <div className="section-divider mb-6">
              <h2 className="headline-md">Legal Documentation</h2>
            </div>

            <Card className="overflow-hidden" hover={false}>
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-surface-container-low label-sm text-gray-500">
                <div className="col-span-4">DOCUMENT NAME</div>
                <div className="col-span-3">CASE REFERENCE</div>
                <div className="col-span-2">STATUS</div>
                <div className="col-span-1">SIZE</div>
                <div className="col-span-2 text-right">ACTION</div>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-surface-container-high">
                {/* Row 1 */}
                <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-surface-container-high transition-colors">
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 100 2h6a1 1 0 100-2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-on-surface">Notarized Property Deed.pdf</p>
                      <p className="label-sm text-gray-400">Added Oct 12, 2024</p>
                    </div>
                  </div>
                  <div className="col-span-3 text-on-surface">MD-2024-MAR-882</div>
                  <div className="col-span-2">
                    <StatusBadge status="verified">VERIFIED</StatusBadge>
                  </div>
                  <div className="col-span-1 text-gray-500">2.4 MB</div>
                  <div className="col-span-2 flex justify-end">
                    <IconButton
                      icon={
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      }
                      variant="ghost"
                      size="sm"
                      className="text-secondary hover:text-secondary"
                    />
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-surface-container-high transition-colors">
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary-container/30 flex items-center justify-center text-secondary shrink-0">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-on-surface">Court Summons_Draft_V2.docx</p>
                      <p className="label-sm text-gray-400">Added Yesterday</p>
                    </div>
                  </div>
                  <div className="col-span-3 text-on-surface">MD-2024-CAS-104</div>
                  <div className="col-span-2">
                    <StatusBadge status="inreview">IN REVIEW</StatusBadge>
                  </div>
                  <div className="col-span-1 text-gray-500">11 MB</div>
                  <div className="col-span-2 flex justify-end">
                    <IconButton
                      icon={
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      }
                      variant="ghost"
                      size="sm"
                      className="text-secondary hover:text-secondary"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </section>
        </div>

        <Footer />
      </main>
    </div>
  );
}

export default function CaseTrackerPage() {
  return (
    <ProtectedRoute>
      <CaseTrackerContent />
    </ProtectedRoute>
  );
}
