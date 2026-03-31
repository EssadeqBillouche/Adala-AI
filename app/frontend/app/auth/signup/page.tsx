"use client";

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const { signup, isLoading, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
    acceptNewsletter: false,
    organizationName: "",
  });
  
  const [fieldErrors, setFieldErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    acceptTerms?: string;
  }>({});

  const validateForm = () => {
    const errors: typeof fieldErrors = {};
    
    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    }
    
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email";
    }
    
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = "Password must contain uppercase, lowercase, and number";
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    
    if (!formData.acceptTerms) {
      errors.acceptTerms = "You must accept the terms and conditions";
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!validateForm()) return;
    
    try {
      await signup({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        acceptTerms: formData.acceptTerms,
        organizationName: formData.organizationName || undefined,
      });
      router.push("/subscription");
    } catch (err) {
      // Error is handled by context
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear field error when user starts typing
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthLabels = ["Weak", "Fair", "Good", "Strong", "Very Strong"];
  const strengthColors = ["bg-error", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-green-500"];

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 zellij-overlay opacity-10" />
        
        <div className="relative z-10 max-w-md">
          <h1 className="display-lg text-on-primary mb-6">
            Join <span className="italic">Majlis Digital</span>
          </h1>
          <p className="body-lg text-on-primary/90 mb-8">
            Start your journey with Morocco&apos;s premier legal intelligence platform. 
            Get instant access to AI-powered legal consultation and comprehensive legal resources.
          </p>
          
          {/* Benefits */}
          <div className="space-y-4">
            <div className="flex items-start gap-3 text-on-primary/90">
              <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-on-secondary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <span className="font-medium">14-day free trial</span>
                <p className="text-sm opacity-80">No credit card required</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-on-primary/90">
              <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-on-secondary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <span className="font-medium">Access to Moroccan Penal Code</span>
                <p className="text-sm opacity-80">Complete legal database</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-on-primary/90">
              <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-on-secondary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <span className="font-medium">AI Legal Assistant</span>
                <p className="text-sm opacity-80">24/7 legal consultation</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-lg py-8">
          {/* Logo for mobile */}
          <div className="lg:hidden mb-8">
            <h1 className="font-serif text-2xl font-semibold text-primary">Majlis Digital</h1>
            <p className="label-sm text-gray-500 mt-1">MOROCCAN LEGAL PORTAL</p>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="headline-md mb-2">Create your account</h2>
            <p className="body-sm text-gray-500">
              Start your 14-day free trial. No credit card required.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-md">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block label-sm text-gray-500 mb-2">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-surface-container-high rounded-md border ${
                    fieldErrors.firstName ? "border-error" : "border-transparent"
                  } focus:bg-surface-container-highest focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all duration-200`}
                  placeholder="Ahmed"
                />
                {fieldErrors.firstName && (
                  <p className="mt-1 text-sm text-error">{fieldErrors.firstName}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="lastName" className="block label-sm text-gray-500 mb-2">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-surface-container-high rounded-md border ${
                    fieldErrors.lastName ? "border-error" : "border-transparent"
                  } focus:bg-surface-container-highest focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all duration-200`}
                  placeholder="Alami"
                />
                {fieldErrors.lastName && (
                  <p className="mt-1 text-sm text-error">{fieldErrors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block label-sm text-gray-500 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-surface-container-high rounded-md border ${
                  fieldErrors.email ? "border-error" : "border-transparent"
                } focus:bg-surface-container-highest focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all duration-200`}
                placeholder="ahmed@example.com"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-error">{fieldErrors.email}</p>
              )}
            </div>

            {/* Organization Name Field (Optional) */}
            <div>
              <label htmlFor="organizationName" className="block label-sm text-gray-500 mb-2">
                Organization Name <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                id="organizationName"
                name="organizationName"
                type="text"
                autoComplete="organization"
                value={formData.organizationName}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-surface-container-high rounded-md border border-transparent focus:bg-surface-container-highest focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all duration-200`}
                placeholder="e.g., Alami Law Firm"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block label-sm text-gray-500 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-surface-container-high rounded-md border ${
                  fieldErrors.password ? "border-error" : "border-transparent"
                } focus:bg-surface-container-highest focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all duration-200`}
                placeholder="Create a strong password"
              />
              {formData.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[0, 1, 2, 3, 4].map((index) => (
                      <div
                        key={index}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          index < passwordStrength ? strengthColors[passwordStrength - 1] || "bg-gray-300" : "bg-surface-dim"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">{strengthLabels[passwordStrength - 1] || "Enter password"}</p>
                </div>
              )}
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-error">{fieldErrors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block label-sm text-gray-500 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-surface-container-high rounded-md border ${
                  fieldErrors.confirmPassword ? "border-error" : "border-transparent"
                } focus:bg-surface-container-highest focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all duration-200`}
                placeholder="Confirm your password"
              />
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-sm text-error">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {/* Terms & Newsletter */}
            <div className="space-y-3">
              <label className={`flex items-start gap-3 cursor-pointer ${fieldErrors.acceptTerms ? "text-error" : ""}`}>
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary mt-0.5"
                />
                <span className="body-sm text-gray-600">
                  I agree to the{" "}
                  <Link href="/terms" className="text-secondary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-secondary hover:underline">
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {fieldErrors.acceptTerms && (
                <p className="text-sm text-error">{fieldErrors.acceptTerms}</p>
              )}
              
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="acceptNewsletter"
                  checked={formData.acceptNewsletter}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary mt-0.5"
                />
                <span className="body-sm text-gray-600">
                  Send me legal updates, new features, and occasional product news.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-dim" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-surface label-sm text-gray-500">Or sign up with</span>
            </div>
          </div>

          {/* Social Signup */}
          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-md hover:bg-surface-container-high transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="body-sm font-medium">Google</span>
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-md hover:bg-surface-container-high transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span className="body-sm font-medium">GitHub</span>
            </button>
          </div>

          {/* Login Link */}
          <p className="mt-8 text-center body-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-secondary hover:text-secondary-container font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
