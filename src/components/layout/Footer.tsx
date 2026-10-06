import React, { useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export const Footer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSectionLink = useCallback(
    (sectionId: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      if (location.pathname === '/') {
        // Already on homepage — scroll directly
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        // Navigate to homepage with hash; scroll after navigation
        navigate('/', { state: { scrollTo: sectionId } });
      }
    },
    [location.pathname, navigate]
  );

  const platformLinks: { label: string; sectionId: string }[] = [
    { label: 'How It Works', sectionId: 'how-it-works' },
    { label: 'Features', sectionId: 'features' },
    { label: 'Pricing', sectionId: 'pricing' },
    { label: 'FAQ', sectionId: 'faq' },
  ];

  const legalLinks: { label: string; path: string }[] = [
    { label: 'Terms of Service', path: '/terms' },
    { label: 'Privacy Policy', path: '/privacy' },
    { label: 'Cookie Policy', path: '/cookies' },
    { label: 'Compliance', path: '/compliance' },
  ];

  return (
    <footer className="bg-navy text-white border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand Hierarchy & Description */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="B2C Logo" className="h-10 w-auto bg-white/95 rounded-xl p-1 object-contain shadow-xs" />
              <div>
                <span className="font-bold text-xl text-white tracking-tight leading-none block">BROKER HUB</span>
                <span className="text-xs text-teal-400 font-medium italic block mt-0.5">A MYSTRIO Product</span>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed pt-1">
              Connecting verified brokers with businesses to streamline deals, appointments, and inventory management.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-gray-300">Platform</h4>
            <ul className="space-y-2.5">
              {platformLinks.map((item) => (
                <li key={item.label}>
                  <a
                    href={`/#${item.sectionId}`}
                    onClick={handleSectionLink(item.sectionId)}
                    className="text-sm text-gray-400 hover:text-primary transition-colors duration-200"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Initiative */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-gray-300">Initiative</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'About MYSTRIO', path: '/about-mystrio' },
                { label: 'Careers', path: '/careers' },
                { label: 'Blog', path: '/blog' },
                { label: 'Contact', path: '/contact' },
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.path} className="text-sm text-gray-400 hover:text-teal-400 transition-colors duration-200">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-gray-300">Legal</h4>
            <ul className="space-y-2.5">
              {legalLinks.map((item) => (
                <li key={item.label}>
                  <Link to={item.path} className="text-sm text-gray-400 hover:text-primary transition-colors duration-200">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-gray-300">Support</h4>
            <ul className="space-y-2.5">
              <li>
                <a href="mailto:mystriotechnologies@gmail.com" className="text-xs text-gray-400 hover:text-primary transition-colors duration-200">
                  mystriotechnologies@gmail.com
                </a>
              </li>
              <li>
                <a href="mailto:brokerhub07@gmail.com" className="text-xs text-gray-400 hover:text-primary transition-colors duration-200">
                  brokerhub07@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:+917339174356" className="text-sm text-gray-400 hover:text-primary transition-colors duration-200">
                  +91 73391 74356
                </a>
              </li>
              <li>
                <a href="tel:+917010158911" className="text-sm text-gray-400 hover:text-primary transition-colors duration-200">
                  +91 70101 58911
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar with Parent Brand Credit & Copyright */}
        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <p className="text-sm font-semibold text-gray-300">BROKER HUB</p>
            <p className="text-xs text-gray-400 italic">A MYSTRIO Product</p>
            <p className="text-xs text-gray-500 mt-1">© 2026 MYSTRIO. All rights reserved.</p>
          </div>
          <div className="flex items-center gap-4">
            {['Twitter', 'LinkedIn', 'Facebook'].map((social) => (
              <a key={social} href="#" className="text-xs text-gray-400 hover:text-primary transition-colors duration-200">
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
