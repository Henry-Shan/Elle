import Link from "next/link";


const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: "About Us",
      links: [{ name: "Our Mission", href: "/company/our-mission" }],
    },
    {
      title: "Solutions",
      links: [
        { name: "Healthcare", href: "/chat" },
        { name: "E-commerce", href: "/chat" },
        { name: "SaaS", href: "/chat" },
        { name: "EdTech", href: "/chat" },
        { name: "Real Estate", href: "/chat" },
        { name: "Travel & Hospitality", href: "/chat" },
        { name: "Gaming & Esports", href: "/chat" },
      ],
    },
    {
      title: "Legal",
      links: [
        { name: "Privacy Policy", href: "/legal/privacy-policy" },
        { name: "Terms of Service", href: "/legal/terms-of-service" },
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
      links: [{ name: "Contact Us", href: "/connect/contact-us" }],
    },
  ];

  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-gray-300 dark:text-gray-400">
      <div className="container mx-auto px-4 py-10">
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
              <h4 className="text-lg font-semibold text-white dark:text-gray-100 tracking-wider">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="flex items-center transition-colors hover:text-white dark:hover:text-gray-200 group"
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
        <div className="border-t border-gray-800 my-8" />

        {/* Copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &copy; {currentYear} Elle AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
