import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, LayoutDashboard, LogOut, User } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

const navLinks = [
  { label: 'Home', href: '/', sectionId: null },
  { label: 'How It Works', href: '/', sectionId: 'how-it-works' },
  { label: 'Features', href: '/', sectionId: 'features' },
  { label: 'Testimonials', href: '/', sectionId: 'testimonials' },
];

export const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Add shadow when page is scrolled
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Track active section via IntersectionObserver
  useEffect(() => {
    if (location.pathname !== '/') {
      setActiveSection(null);
      return;
    }
    const sectionIds = navLinks
      .filter((l) => l.sectionId)
      .map((l) => l.sectionId as string);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [location.pathname]);

  // Close user dropdown when clicking outside
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = () => setUserMenuOpen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [userMenuOpen]);

  const isLinkActive = (link: (typeof navLinks)[0]) => {
    if (link.sectionId) return activeSection === link.sectionId;
    return location.pathname === '/' && activeSection === null;
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, link: (typeof navLinks)[0]) => {
    setMobileOpen(false);
    if (!link.sectionId) return;
    e.preventDefault();
    if (location.pathname === '/') {
      document.getElementById(link.sectionId)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/', { state: { scrollTo: link.sectionId } });
    }
  };

  const dashboardPath =
    user?.role === 'admin'
      ? '/admin/dashboard'
      : user?.role === 'broker'
      ? '/broker/dashboard'
      : '/customer/dashboard';

  const settingsPath =
    user?.role === 'admin'
      ? '/admin/settings'
      : user?.role === 'broker'
      ? '/broker/settings'
      : '/customer/settings';

  const initials = user?.fullName
    ? user.fullName.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
    : '?';

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-border transition-shadow duration-200 ${
        scrolled ? 'shadow-md' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0" onClick={() => setMobileOpen(false)}>
            <img src="/logo.png" alt="B2C Logo" className="h-9 w-auto object-contain" />
            <span className="font-bold text-base text-text-primary tracking-tight leading-tight">BROKER HUB</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.sectionId ? '/' : link.href}
                onClick={(e) => handleNavClick(e, link)}
                className={`text-sm font-medium transition-colors duration-200 hover:text-primary relative group ${
                  isLinkActive(link) ? 'text-primary' : 'text-gray-text'
                }`}
              >
                {link.label}
                <span
                  className={`absolute -bottom-1 left-0 h-0.5 bg-primary rounded-full transition-all duration-200 ${
                    isLinkActive(link) ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
                />
              </Link>
            ))}
          </div>

          {/* Desktop Auth / User Section */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  id="navbar-user-menu-btn"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors duration-200 focus:outline-none"
                  aria-haspopup="true"
                  aria-expanded={userMenuOpen}
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.fullName} className="w-8 h-8 rounded-full object-cover border border-gray-border" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-teal-500 text-white text-xs font-bold flex items-center justify-center">
                      {initials}
                    </div>
                  )}
                  <span className="text-sm font-medium text-text-primary max-w-[120px] truncate">{user.fullName}</span>
                  <ChevronDown size={14} className={`text-gray-text transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl border border-gray-border shadow-xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-border mb-1">
                      <p className="text-xs font-semibold text-text-primary truncate">{user.fullName}</p>
                      <p className="text-xs text-gray-text truncate">{user.email}</p>
                    </div>
                    <Link to={dashboardPath} onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-primary hover:bg-gray-50 transition-colors">
                      <LayoutDashboard size={15} className="text-primary" /> Dashboard
                    </Link>
                    <Link to={settingsPath} onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-primary hover:bg-gray-50 transition-colors">
                      <User size={15} className="text-gray-text" /> Profile & Settings
                    </Link>
                    <hr className="border-gray-border my-1" />
                    <button
                      onClick={async () => { setUserMenuOpen(false); await signOut(); navigate('/'); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login"><Button variant="ghost" size="sm">Login</Button></Link>
                <Link to="/signup"><Button variant="primary" size="sm">Sign Up</Button></Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            id="navbar-mobile-menu-btn"
            className="md:hidden text-text-primary p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-border shadow-lg">
          <div className="flex flex-col py-3 px-4 gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.sectionId ? '/' : link.href}
                onClick={(e) => handleNavClick(e, link)}
                className={`text-sm font-medium py-2.5 px-3 rounded-lg transition-colors ${
                  isLinkActive(link) ? 'text-primary bg-primary-50' : 'text-gray-text hover:text-primary hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}

            <hr className="border-gray-border my-2" />

            {user ? (
              <>
                <div className="flex items-center gap-3 px-3 py-2">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.fullName} className="w-9 h-9 rounded-full object-cover border border-gray-border" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-teal-500 text-white text-xs font-bold flex items-center justify-center">{initials}</div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{user.fullName}</p>
                    <p className="text-xs text-gray-text">{user.email}</p>
                  </div>
                </div>
                <Link to={dashboardPath} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-text-primary hover:bg-gray-50 rounded-lg transition-colors">
                  <LayoutDashboard size={16} className="text-primary" /> Dashboard
                </Link>
                <button
                  onClick={async () => { setMobileOpen(false); await signOut(); navigate('/'); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <LogOut size={16} /> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" size="sm" fullWidth>Login</Button>
                </Link>
                <Link to="/signup" onClick={() => setMobileOpen(false)}>
                  <Button variant="primary" size="sm" fullWidth>Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
