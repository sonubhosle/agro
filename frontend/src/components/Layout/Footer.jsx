import React from 'react';
import { Link } from 'react-router-dom';
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Marketplace: [
      { name: 'Browse Crops', path: '/crops' },
      { name: 'Price Dashboard', path: '/prices' },
      { name: 'Top Farmers', path: '/farmers' },
      { name: 'Featured Crops', path: '/featured' },
    ],
    Farmers: [
      { name: 'Sell Crops', path: '/register?role=farmer' },
      { name: 'Farmer Dashboard', path: '/dashboard/farmer' },
      { name: 'Price Alerts', path: '/prices/alerts' },
      { name: 'Farmer Resources', path: '/resources/farmers' },
    ],
    Buyers: [
      { name: 'Buy Crops', path: '/register?role=buyer' },
      { name: 'Buyer Dashboard', path: '/dashboard/buyer' },
      { name: 'Bulk Orders', path: '/bulk-orders' },
      { name: 'Quality Standards', path: '/quality' },
    ],
    Company: [
      { name: 'About Us', path: '/about' },
      { name: 'Contact', path: '/contact' },
      { name: 'Careers', path: '/careers' },
      { name: 'Blog', path: '/blog' },
      { name: 'Press', path: '/press' },
    ],
    Legal: [
      { name: 'Privacy Policy', path: '/privacy' },
      { name: 'Terms of Service', path: '/terms' },
      { name: 'Refund Policy', path: '/refund' },
      { name: 'Shipping Policy', path: '/shipping' },
    ],
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Logo and Description */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <span className="text-2xl font-bold">FarmConnect</span>
            </div>
            <p className="text-gray-400 mb-6">
              Directly connecting farmers and buyers for fair prices and quality produce.
              No middlemen, better profits.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Footer Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-4">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Info */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start">
              <Phone className="h-5 w-5 text-primary-400 mr-3 mt-1" />
              <div>
                <h4 className="font-semibold mb-1">Call Us</h4>
                <p className="text-gray-400">+91 1800 123 4567</p>
                <p className="text-gray-400 text-sm">Mon-Fri, 9AM-6PM</p>
              </div>
            </div>
            <div className="flex items-start">
              <Mail className="h-5 w-5 text-primary-400 mr-3 mt-1" />
              <div>
                <h4 className="font-semibold mb-1">Email Us</h4>
                <p className="text-gray-400">support@farmconnect.com</p>
                <p className="text-gray-400 text-sm">24/7 Support</p>
              </div>
            </div>
            <div className="flex items-start">
              <MapPin className="h-5 w-5 text-primary-400 mr-3 mt-1" />
              <div>
                <h4 className="font-semibold mb-1">Visit Us</h4>
                <p className="text-gray-400">123 Farm Street</p>
                <p className="text-gray-400 text-sm">Pune, Maharashtra 411001</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm">
              © {currentYear} FarmConnect. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <Link to="/privacy" className="text-gray-400 hover:text-white text-sm">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-white text-sm">
                Terms of Service
              </Link>
              <Link to="/cookies" className="text-gray-400 hover:text-white text-sm">
                Cookie Policy
              </Link>
              <div className="flex items-center text-sm text-gray-400">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                System Status: <span className="text-green-400 ml-1">Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;