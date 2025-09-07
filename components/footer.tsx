import { FaInstagram, FaTwitter } from "react-icons/fa";
import Link from "next/link";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: "About Us",
      links: [
        { name: "Our Mission", href: "/company/our-mission" },
        { name: "Our Culture", href: "/company/our-culture" },
      ],
    },
    {
      title: "Solutions",
      links: [
        { name: "Healthcare", href: "/solutions/healthcare" },
        { name: "E-commerce", href: "/solutions/ecommerce" },
        { name: "SaaS", href: "/solutions/saas" },
        { name: "EdTech", href: "/solutions/edtech" },
        { name: "Real Estate", href: "/solutions/real-estate" },
        { name: "Travel & Hospitality", href: "/solutions/travel-hospitality" },
        { name: "Gaming & Esports", href: "/solutions/gaming-esports" },
      ],
    },
    {
      title: "Legal",
      links: [
        { name: "Privacy Policy", href: "/legal/privacy-policy" },
        { name: "Terms of Service", href: "/legal/terms-of-service" },
        { name: "Customer Business Agreement", href: "/legal/customer-business-agreement" },
        { name: "Security", href: "/legal/security" },
        { name: "Accessibility", href: "/legal/accessibility" },
      ],
    },
    {
      title: "Learn More",
      links: [
        { name: "Pricing", href: "/learn-more/pricing" },
        { name: "Generative AI", href: "/learn-more/generative-ai" },
        { name: "Agentic AI", href: "/learn-more/agentic-ai" },
        { name: "Why choose us", href: "/learn-more/why-choose-us" },
      ],
    },
    {
      title: "Connect",
      links: [
        { name: "Contact Us", href: "/connect/contact-us" }
      ],
    },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-7 gap-10">
          {/* Brand Column */}

          <Link href="/">
            <div className="font-bold text-3xl whitespace-nowrap min-w-[120px] flex items-center">
              <span
                style={{
                  fontFamily: "Roboto, sans-serif",
                  color: "#FC7B11",
                  fontWeight: 700,
                  fontSize: "2.4rem",
                  lineHeight: 1,
                }}
              >
                &Sigma;
              </span>
              <span
                className="ml-0.5"
                style={{ fontFamily: "geist, sans-serif" }}
              >
                lle AI
              </span>
            </div>
          </Link>

          {/* Links Columns */}
          {footerLinks.map((section) => (
            <div key={section.title} className="space-y-4">
              <h4 className="text-lg font-semibold text-white tracking-wider">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="flex items-center transition-colors hover:text-white group"
                    >
                      <span>{link.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 my-12" />

        {/* Copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">
            &copy; {currentYear} Elle AI. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link
              href="/connect/instagram"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <FaInstagram className="size-5" />
            </Link>
            <Link
              href="/connect/twitter"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <FaTwitter className="size-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
