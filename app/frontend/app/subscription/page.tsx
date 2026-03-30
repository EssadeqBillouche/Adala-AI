"use client";

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  highlighted?: boolean;
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "Essential legal resources for individuals",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "5 AI consultations per month",
      "Access to basic legal codes",
      "1 active case tracker",
      "Email support",
      "Legal document templates (basic)",
    ],
  },
  {
    id: "basic",
    name: "Basic",
    description: "For legal professionals starting out",
    monthlyPrice: 299,
    yearlyPrice: 2990,
    features: [
      "50 AI consultations per month",
      "Full Moroccan Penal Code access",
      "10 active case trackers",
      "Document analysis (up to 10 pages)",
      "Priority email support",
      "Legal research tools",
      "Case precedent search",
    ],
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    description: "For established law firms",
    monthlyPrice: 799,
    yearlyPrice: 7990,
    features: [
      "Unlimited AI consultations",
      "Complete legal database access",
      "Unlimited case trackers",
      "Document analysis (up to 50 pages)",
      "24/7 priority support",
      "Advanced legal research",
      "Multi-user access (up to 5)",
      "API access",
      "Custom document templates",
    ],
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations and institutions",
    monthlyPrice: 1999,
    yearlyPrice: 19990,
    features: [
      "Everything in Premium",
      "Unlimited users",
      "Dedicated account manager",
      "Custom integrations",
      "On-premise deployment option",
      "SLA guarantee",
      "Advanced analytics & reporting",
      "White-label options",
      "Training & onboarding",
    ],
  },
];

export default function SubscriptionPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectPlan = async (planId: string) => {
    if (!isAuthenticated) {
      router.push(`/auth/signup?plan=${planId}`);
      return;
    }

    setSelectedPlan(planId);
    setIsLoading(true);

    try {
      // TODO: Integrate with backend payment API
      // await fetch(`${API_BASE_URL}/api/subscription/create-checkout`, { ... })
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Redirect to payment or confirmation
      router.push("/dashboard");
    } catch (error) {
      console.error("Subscription error:", error);
    } finally {
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  const savings = {
    basic: 598,
    premium: 1598,
    enterprise: 3998,
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-40 frosted-nav border-b border-outline-low">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <h1 className="font-serif text-xl font-semibold text-primary">Majlis Digital</h1>
          </Link>
          
          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" className="label-sm text-gray-500 hover:text-on-surface transition-colors">
                  Skip to Dashboard
                </Link>
                <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                  <span className="font-semibold text-sm">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="label-sm text-gray-500 hover:text-on-surface transition-colors">
                  Sign in
                </Link>
                <Link href="/auth/signup" className="btn-primary">
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <p className="label-sm text-secondary mb-4">SUBSCRIPTION PLANS</p>
          <h1 className="display-lg mb-4">
            Choose the perfect plan for your <span className="italic text-secondary">legal practice</span>
          </h1>
          <p className="body-lg text-gray-600 max-w-2xl mx-auto">
            Access Morocco&apos;s most comprehensive legal intelligence platform. 
            Start with a 14-day free trial, cancel anytime.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`label-sm ${billingCycle === "monthly" ? "text-on-surface" : "text-gray-400"}`}>
            Monthly
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
            className="relative w-14 h-7 bg-surface-container-high rounded-full transition-colors"
          >
            <div
              className={`absolute top-1 w-5 h-5 bg-primary rounded-full transition-transform ${
                billingCycle === "yearly" ? "translate-x-8" : "translate-x-1"
              }`}
            />
          </button>
          <span className={`label-sm ${billingCycle === "yearly" ? "text-on-surface" : "text-gray-400"}`}>
            Yearly
          </span>
          <span className="ml-2 px-3 py-1 bg-secondary-container text-on-secondary-container text-xs font-semibold rounded-full">
            Save up to 17%
          </span>
        </div>

        {/* Plans Grid */}
        <div className="grid lg:grid-cols-4 gap-6 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-lg p-6 transition-all duration-300 ${
                plan.highlighted
                  ? "bg-primary text-on-primary shadow-float scale-105"
                  : plan.popular
                  ? "bg-surface-container-low border-2 border-secondary"
                  : "bg-surface-container-lowest border border-surface-dim"
              }`}
            >
              {plan.popular && !plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-secondary text-on-secondary text-xs font-semibold rounded-full whitespace-nowrap">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className={`headline-md mb-2 ${plan.highlighted ? "text-on-primary" : "text-on-surface"}`}>
                  {plan.name}
                </h3>
                <p className={`body-sm ${plan.highlighted ? "text-on-primary/80" : "text-gray-500"}`}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className={`text-4xl font-serif font-semibold ${plan.highlighted ? "text-on-primary" : "text-on-surface"}`}>
                    {plan.monthlyPrice === 0 ? "Free" : `MAD ${billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice}`}
                  </span>
                  {plan.monthlyPrice > 0 && (
                    <span className={`${plan.highlighted ? "text-on-primary/80" : "text-gray-500"}`}>
                      /{billingCycle === "monthly" ? "mo" : "yr"}
                    </span>
                  )}
                </div>
                {billingCycle === "yearly" && plan.monthlyPrice > 0 && (
                  <p className="label-sm text-secondary mt-1">
                    Save MAD {savings[plan.id as keyof typeof savings]} per year
                  </p>
                )}
              </div>

              <button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={isLoading && selectedPlan === plan.id}
                className={`w-full py-3 rounded-md font-semibold mb-6 transition-all ${
                  plan.highlighted
                    ? "bg-secondary text-on-secondary hover:bg-secondary/90"
                    : "bg-primary text-on-primary hover:bg-primary-container"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading && selectedPlan === plan.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : plan.id === "free" ? (
                  "Get Started"
                ) : (
                  "Start Free Trial"
                )}
              </button>

              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <svg
                      className={`w-5 h-5 shrink-0 mt-0.5 ${
                        plan.highlighted ? "text-secondary" : "text-secondary"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className={`body-sm ${plan.highlighted ? "text-on-primary/90" : "text-gray-600"}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Enterprise CTA */}
        <div className="bg-surface-container-low rounded-lg p-8 md:p-12 text-center">
          <h2 className="headline-lg mb-4">Need a custom solution?</h2>
          <p className="body-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            Our enterprise plans can be tailored to your organization&apos;s specific needs. 
            Contact us for a personalized quote and demonstration.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:enterprise@majlisdigital.ma"
              className="btn-primary"
            >
              Contact Sales
            </a>
            <a
              href="tel:+212512345678"
              className="btn-ghost flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              +212 5 12 34 56 78
            </a>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="headline-lg text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <FAQItem
              question="Can I cancel my subscription anytime?"
              answer="Yes, you can cancel your subscription at any time. Your access will continue until the end of your billing period."
            />
            <FAQItem
              question="Is there a free trial?"
              answer="Yes! All paid plans come with a 14-day free trial. No credit card required to start."
            />
            <FAQItem
              question="What payment methods do you accept?"
              answer="We accept all major credit cards (Visa, MasterCard, American Express) and bank transfers for enterprise plans."
            />
            <FAQItem
              question="Can I upgrade or downgrade my plan?"
              answer="Absolutely. You can change your plan at any time from your account settings. Prorated charges will apply."
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface py-12 border-t border-surface-dim">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="label-sm text-gray-400">
            © 2024 MAJLIS DIGITAL. JURISPRUDENCE MOROCCAN EXCELLENCE.
          </p>
          <div className="flex items-center justify-center gap-6 mt-4">
            <Link href="/terms" className="label-sm text-gray-400 hover:text-secondary transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="label-sm text-gray-400 hover:text-secondary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/contact" className="label-sm text-gray-400 hover:text-secondary transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-surface-container-lowest rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left"
      >
        <span className="font-medium text-on-surface">{question}</span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-6 pb-4">
          <p className="body-sm text-gray-600">{answer}</p>
        </div>
      )}
    </div>
  );
}
