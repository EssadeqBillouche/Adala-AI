"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./context/AuthContext";
import TonalCard from "./components/design/TonalCard";
import BrassButton from "./components/design/BrassButton";
import SerifHeading from "./components/design/SerifHeading";
import Label from "./components/design/Label";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const capabilities = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "AI Consultation",
      description: "Engage with a specialized LLM trained on Moroccan Jurisprudence. Get immediate citations from the Official Bulletin and relevant case law history.",
      link: "/consult-ai",
      linkText: "START SESSION",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
        </svg>
      ),
      title: "Legal Library",
      description: "A curated database of the Moroccan Penal Code, Civil Code, and Moudawana.",
      link: "/legal-library",
      linkText: "BROWSE ARCHIVES",
      variant: "primary" as const,
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm14 1a1 1 0 11-2 0 1 1 0 012 0zM2 13a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2zm14 1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
        </svg>
      ),
      title: "Case Tracker",
      description: "End-to-end encrypted tracking for your active litigation and legal document workflows.",
      link: "/case-tracker",
      linkText: "VIEW CASES",
    },
  ];

  const stats = [
    { label: "Success Rate", value: "84%" },
    { label: "Resolution", value: "14 Days" },
    { label: "Verified", value: "12.5k" },
    { label: "Cost Saved", value: "35%" },
  ];

  return (
    <div className="min-h-screen bg-surface">
      {/* Navigation */}
      <header className="sticky top-0 z-40 frosted-nav border-b border-outline-low">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <SerifHeading level="h1" size="sm">Majlis Digital</SerifHeading>
          </Link>

          <nav className="flex items-center gap-1">
            <Link href="/dashboard" className="px-4 py-2 label-sm text-secondary bg-secondary-container/50 rounded-md">
              DASHBOARD
            </Link>
            <Link href="/legal-library" className="px-4 py-2 label-sm text-gray-500 hover:text-on-surface transition-colors">
              KNOWLEDGE BASE
            </Link>
            <Link href="/case-tracker" className="px-4 py-2 label-sm text-gray-500 hover:text-on-surface transition-colors">
              MY CASES
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link href="/dashboard" className="btn-primary">
                DASHBOARD
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="label-sm text-gray-500 hover:text-on-surface transition-colors">
                  Sign in
                </Link>
                <Link href="/auth/signup" className="btn-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative py-20 px-6 overflow-hidden">
          <div className="absolute inset-0 zellij-overlay opacity-50" />
          
          <div className="max-w-7xl mx-auto relative z-10">
            {/* Eyebrow */}
            <div className="text-center mb-6">
              <Label variant="secondary">JURISPRUDENCE MOROCCAN EXCELLENCE</Label>
            </div>

            {/* Main Headline */}
            <div className="text-center mb-10">
              <SerifHeading level="display" size="lg" className="mb-2">
                Navigate the <span className="italic text-secondary">Complexity</span>
              </SerifHeading>
              <SerifHeading level="display" size="lg">
                of Moroccan Law.
              </SerifHeading>
            </div>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-6">
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
                <Link href="/consult-ai">
                  <BrassButton variant="secondary" className="m-2">
                    CONSULT
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </BrassButton>
                </Link>
              </div>
            </div>

            {/* Subtitle */}
            <p className="label-sm text-center text-gray-400 mb-16">
              AI-POWERED LEGAL INTELLIGENCE BASED ON THE MOROCCAN PENAL CODE
            </p>

            {/* Hero Content Grid */}
            <div className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {/* Image Card */}
              <TonalCard className="overflow-hidden" hover={false}>
                <div className="aspect-[4/3] bg-gradient-to-br from-secondary/20 to-secondary/5 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-secondary-container/30 flex items-center justify-center">
                        <svg className="w-16 h-16 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <Label variant="secondary">Moroccan Craftsmanship</Label>
                    </div>
                  </div>
                </div>
              </TonalCard>

              {/* Info Card */}
              <TonalCard className="p-8" hover={false}>
                <SerifHeading level="h3" className="mb-4 italic text-primary">Digital Majlis</SerifHeading>
                <p className="body-md text-gray-600 mb-6">
                  Bridging ancestral wisdom with modern precision. Our platform provides instant access to digitized legal archives and AI-assisted case management tailored for the Moroccan landscape.
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-3xl font-serif font-semibold text-secondary">2.4k</p>
                    <Label variant="muted" className="mt-1">ACTIVE CASES</Label>
                  </div>
                  <div>
                    <p className="text-3xl font-serif font-semibold text-secondary">98%</p>
                    <Label variant="muted" className="mt-1">ACCURACY</Label>
                  </div>
                </div>
              </TonalCard>
            </div>
          </div>
        </section>

        {/* Capabilities Section */}
        <section className="py-20 px-6 bg-surface-container-low">
          <div className="max-w-7xl mx-auto">
            <Label variant="muted" className="mb-2">OUR CAPABILITIES</Label>
            <SerifHeading level="h2" size="lg" className="mb-12">Legal Infrastructure for the Digital Age</SerifHeading>

            <div className="grid lg:grid-cols-3 gap-6">
              {capabilities.map((cap, index) => (
                <TonalCard key={index} className={`p-8 ${cap.variant === "primary" ? "gradient-hero text-on-primary" : ""}`} hover={true}>
                  <div className={`w-12 h-12 rounded-lg mb-6 flex items-center justify-center ${cap.variant === "primary" ? "bg-white/10" : "bg-secondary-container/30 text-secondary"}`}>
                    <span className={cap.variant === "primary" ? "text-on-primary" : ""}>{cap.icon}</span>
                  </div>
                  <SerifHeading level="h3" className={`mb-3 ${cap.variant === "primary" ? "text-on-primary" : "text-on-surface"}`}>{cap.title}</SerifHeading>
                  <p className={`body-sm mb-6 ${cap.variant === "primary" ? "text-on-primary/90" : "text-gray-600"}`}>{cap.description}</p>
                  <Link
                    href={cap.link}
                    className={`inline-flex items-center label-sm transition-colors ${cap.variant === "primary" ? "text-white hover:text-secondary-container" : "text-secondary hover:text-secondary-container"}`}
                  >
                    {cap.linkText}
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </TonalCard>
              ))}
            </div>

            {/* Precedent Analytics Card */}
            <TonalCard className="mt-6 p-8" hover={false}>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <SerifHeading level="h3" className="mb-1">Precedent Analytics</SerifHeading>
                  <Label variant="muted">REAL-TIME DATA STREAM</Label>
                </div>
                <span className="px-3 py-1 bg-secondary-container text-on-secondary-container text-xs font-semibold rounded-full">
                  SYSTEM LIVE
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <div key={index} className="p-4 bg-surface-container-low rounded-lg">
                    <Label variant="muted" className="mb-2">{stat.label}</Label>
                    <p className="text-2xl font-serif font-semibold text-primary">{stat.value}</p>
                  </div>
                ))}
              </div>
            </TonalCard>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <SerifHeading level="h2" size="lg" className="mb-4">Ready to transform your legal practice?</SerifHeading>
            <p className="body-lg text-gray-600 mb-8">
              Join Morocco&apos;s leading law firms and legal professionals using Majlis Digital for AI-powered legal intelligence.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/signup">
                <BrassButton size="lg">Start Free Trial</BrassButton>
              </Link>
              <Link href="/subscription">
                <BrassButton variant="ghost" size="lg">View Pricing</BrassButton>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-surface py-12 border-t border-surface-dim">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-8">
              <SerifHeading level="h4">Majlis Digital</SerifHeading>
            </div>

            <nav className="flex items-center justify-center gap-8 mb-8">
              <Link href="/terms" className="label-sm text-gray-400 hover:text-secondary transition-colors">
                TERMS OF SERVICE
              </Link>
              <Link href="/privacy" className="label-sm text-gray-400 hover:text-secondary transition-colors">
                PRIVACY POLICY
              </Link>
              <Link href="/penal-code" className="label-sm text-gray-400 hover:text-secondary transition-colors">
                MOROCCAN PENAL CODE
              </Link>
              <Link href="/contact" className="label-sm text-gray-400 hover:text-secondary transition-colors">
                CONTACT COUNSEL
              </Link>
            </nav>

            <div className="text-center">
              <Label variant="muted">© 2024 MAJLIS DIGITAL. JURISPRUDENCE MOROCCAN EXCELLENCE.</Label>
            </div>

            {/* Social Icons */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <a href="#" className="text-gray-400 hover:text-secondary transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-secondary transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-secondary transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
