import { render, screen } from '@testing-library/react';
import HomePage from './page';
import { useAuth } from './context/AuthContext';

// Mock the auth context
jest.mock('./context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock the design components
jest.mock('./components/design/TonalCard', () => {
  return ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`tonal-card ${className}`}>{children}</div>
  );
});

jest.mock('./components/design/BrassButton', () => {
  return ({ children, variant, className = '' }: { children: React.ReactNode; variant?: string; className?: string }) => (
    <button className={`brass-button ${variant || ''} ${className}`}>{children}</button>
  );
});

jest.mock('./components/design/SerifHeading', () => {
  return ({ children, level, size, className = '' }: { children: React.ReactNode; level?: string; size?: string; className?: string }) => (
    <h2 className={`serif-heading ${level} ${size} ${className}`}>{children}</h2>
  );
});

jest.mock('./components/design/Label', () => {
  return ({ children, variant, className = '' }: { children: React.ReactNode; variant?: string; className?: string }) => (
    <span className={`label ${variant} ${className}`}>{children}</span>
  );
});

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the main heading', () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false });
    
    render(<HomePage />);
    
    expect(screen.getByText('Navigate the')).toBeInTheDocument();
    expect(screen.getByText('Complexity')).toBeInTheDocument();
    expect(screen.getByText('of Moroccan Law.')).toBeInTheDocument();
  });

  it('renders the eyebrow label', () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false });
    
    render(<HomePage />);
    
    expect(screen.getByText('JURISPRUDENCE MOROCCAN EXCELLENCE')).toBeInTheDocument();
  });

  it('renders the search input', () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false });
    
    render(<HomePage />);
    
    const input = screen.getByPlaceholderText(/Ask about labor law, property disputes, or family code/i);
    expect(input).toBeInTheDocument();
  });

  it('renders the consult button', () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false });
    
    render(<HomePage />);
    
    expect(screen.getByText('CONSULT')).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false });
    
    render(<HomePage />);
    
    expect(screen.getByText('AI-POWERED LEGAL INTELLIGENCE BASED ON THE MOROCCAN PENAL CODE')).toBeInTheDocument();
  });

  it('renders Digital Majlis section', () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false });
    
    render(<HomePage />);
    
    expect(screen.getByText('Digital Majlis')).toBeInTheDocument();
    expect(screen.getByText(/Bridging ancestral wisdom with modern precision/i)).toBeInTheDocument();
  });

  it('renders stats section', () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false });
    
    render(<HomePage />);
    
    expect(screen.getByText('2.4k')).toBeInTheDocument();
    expect(screen.getByText('98%')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE CASES')).toBeInTheDocument();
    expect(screen.getByText('ACCURACY')).toBeInTheDocument();
  });

  it('renders capabilities section heading', () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false });
    
    render(<HomePage />);
    
    expect(screen.getByText('OUR CAPABILITIES')).toBeInTheDocument();
    expect(screen.getByText('Legal Infrastructure for the Digital Age')).toBeInTheDocument();
  });

  it('renders AI Consultation capability', () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false });
    
    render(<HomePage />);
    
    expect(screen.getByText('AI Consultation')).toBeInTheDocument();
    expect(screen.getByText(/Engage with a specialized LLM/i)).toBeInTheDocument();
    expect(screen.getByText('START SESSION')).toBeInTheDocument();
  });

  it('renders Legal Library capability', () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false });
    
    render(<HomePage />);
    
    expect(screen.getByText('Legal Library')).toBeInTheDocument();
    expect(screen.getByText(/A curated database of the Moroccan Penal Code/i)).toBeInTheDocument();
    expect(screen.getByText('BROWSE ARCHIVES')).toBeInTheDocument();
  });

  it('renders Case Tracker capability', () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false });
    
    render(<HomePage />);
    
    expect(screen.getByText('Case Tracker')).toBeInTheDocument();
    expect(screen.getByText(/End-to-end encrypted tracking/i)).toBeInTheDocument();
    expect(screen.getByText('VIEW CASES')).toBeInTheDocument();
  });

  it('renders Precedent Analytics section', () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false });
    
    render(<HomePage />);
    
    expect(screen.getByText('Precedent Analytics')).toBeInTheDocument();
    expect(screen.getByText('REAL-TIME DATA STREAM')).toBeInTheDocument();
    expect(screen.getByText('SYSTEM LIVE')).toBeInTheDocument();
  });

  it('renders all stats', () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false });
    
    render(<HomePage />);
    
    expect(screen.getByText('Success Rate')).toBeInTheDocument();
    expect(screen.getByText('84%')).toBeInTheDocument();
    expect(screen.getByText('Resolution')).toBeInTheDocument();
    expect(screen.getByText('14 Days')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByText('12.5k')).toBeInTheDocument();
    expect(screen.getByText('Cost Saved')).toBeInTheDocument();
    expect(screen.getByText('35%')).toBeInTheDocument();
  });

  it('renders CTA section', () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false });
    
    render(<HomePage />);
    
    expect(screen.getByText(/Ready to transform your legal practice/i)).toBeInTheDocument();
    expect(screen.getByText(/Join Morocco's leading law firms/i)).toBeInTheDocument();
    expect(screen.getByText('Start Free Trial')).toBeInTheDocument();
    expect(screen.getByText('View Pricing')).toBeInTheDocument();
  });

  it('renders footer with company name', () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false });
    
    render(<HomePage />);
    
    const majlisDigitalElements = screen.getAllByText('Majlis Digital');
    expect(majlisDigitalElements.length).toBeGreaterThan(0);
    expect(screen.getByText('© 2024 MAJLIS DIGITAL. JURISPRUDENCE MOROCCAN EXCELLENCE.')).toBeInTheDocument();
  });

  it('renders footer navigation links', () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false });
    
    render(<HomePage />);
    
    expect(screen.getByText('TERMS OF SERVICE')).toBeInTheDocument();
    expect(screen.getByText('PRIVACY POLICY')).toBeInTheDocument();
    expect(screen.getByText('MOROCCAN PENAL CODE')).toBeInTheDocument();
    expect(screen.getByText('CONTACT COUNSEL')).toBeInTheDocument();
  });

  it('shows sign in links when not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false });
    
    render(<HomePage />);
    
    expect(screen.getByText('Sign in')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
    expect(screen.getAllByText('DASHBOARD').length).toBeGreaterThan(0);
  });

  it('shows dashboard button when authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: true });
    
    render(<HomePage />);
    
    const dashboardLinks = screen.getAllByText('DASHBOARD');
    expect(dashboardLinks.length).toBeGreaterThan(0);
    expect(dashboardLinks[dashboardLinks.length - 1]).toHaveAttribute('href', '/dashboard');
  });

  it('has navigation links', () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false });
    
    render(<HomePage />);
    
    expect(screen.getAllByText('DASHBOARD')[0]).toHaveAttribute('href', '/dashboard');
    expect(screen.getByText('KNOWLEDGE BASE')).toHaveAttribute('href', '/legal-library');
    expect(screen.getByText('MY CASES')).toHaveAttribute('href', '/case-tracker');
  });

  it('has social media icons', () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false });
    
    render(<HomePage />);
    
    // Check for social media SVG icons (Twitter, LinkedIn, Instagram)
    const socialIcons = document.querySelectorAll('svg');
    expect(socialIcons.length).toBeGreaterThan(0);
  });

  it('has search bar with icon', () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false });
    
    render(<HomePage />);
    
    const searchInput = screen.getByPlaceholderText(/Ask about labor law, property disputes, or family code/i);
    expect(searchInput).toHaveAttribute('type', 'text');
  });

  it('has hero section with zellij overlay', () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false });
    
    render(<HomePage />);
    
    expect(document.querySelector('.zellij-overlay')).toBeInTheDocument();
  });

  it('renders Moroccan Craftsmanship card', () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false });
    
    render(<HomePage />);
    
    expect(screen.getByText('Moroccan Craftsmanship')).toBeInTheDocument();
  });
});
