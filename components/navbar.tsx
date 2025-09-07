import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuContent,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  MenuIcon,
  HeartPulse,
  ShoppingCart,
  Cloud,
  School,
  Home,
  Plane,
  Gamepad2,
} from "lucide-react";

const NavBar = () => {
  const navItems = [
    {
      name: "Solutions",
      href: "/solutions",
      dropdown: [
        {
          title: "By Industry",
          items: [
            {
              name: "Healthcare",
              icon: <HeartPulse className="size-5 mr-2 text-gray-500" />,
              items: [
                { name: "Elle-healthcare-base" },
                { name: "Elle-healthcare-pro" },
              ],
            },
            {
              name: "E-commerce",
              icon: <ShoppingCart className="size-5 mr-2 text-gray-500" />,
              items: [
                { name: "Elle-commerce-base" },
                { name: "Elle-commerce-pro" },
              ],
            },
            {
              name: "SaaS",
              icon: <Cloud className="size-5 mr-2 text-gray-500" />,
              items: [{ name: "Elle-saas-base" }, { name: "Elle-saas-pro" }],
            },
            {
              name: "EdTech",
              icon: <School className="size-5 mr-2 text-gray-500" />,
              items: [
                { name: "Elle-edtech-base" },
                { name: "Elle-edtech-pro" },
              ],
            },
            {
              name: "Real Estate",
              icon: <Home className="size-5 mr-2 text-gray-500" />,
              items: [
                { name: "Elle-real-estate-base" },
                { name: "Elle-real-estate-pro" },
              ],
            },
            {
              name: "Travel & Hospitality",
              icon: <Plane className="size-5 mr-2 text-gray-500" />,
              items: [
                { name: "Elle-travel-base" },
                { name: "Elle-travel-pro" },
              ],
            },
            {
              name: "Gaming & Esports",
              icon: <Gamepad2 className="size-5 mr-2 text-gray-500" />,
              items: [
                { name: "Elle-esports-base" },
                { name: "Elle-esports-pro" },
              ],
            },
          ],
        },
      ],
    },
    { name: "Pricing", href: "/pricing" },
    { name: "Security", href: "/security" },
    { name: "Help", href: "/help" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-10">
        {/* Logo */}
        <Link href="/">
          <div className="font-bold text-2xl whitespace-nowrap min-w-[120px] flex items-center">
            <span
              style={{
                fontFamily: "Roboto, sans-serif",
                color: "#FC7B11",
                fontWeight: 700,
                fontSize: "1.8rem",
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

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden md:flex flex-1 justify-center pl-10">
          <NavigationMenuList>
            {navItems.map((item) => (
              <NavigationMenuItem key={item.name}>
                {item.dropdown ? (
                  <>
                    <NavigationMenuTrigger className="bg-transparent flex items-center gap-1 text-gray-800 [&>svg]:size-4 hover:bg-[#FC7B11]/50 rounded-full">
                      {item.name}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="p-6 w-[800px]">
                        {item.dropdown.map((section, sectionIndex) => (
                          <div key={section.title}>
                            <h4 className="text-sm font-medium text-gray-500 mb-4">
                              {section.title}
                            </h4>
                            <div className="grid grid-cols-3 gap-6">
                              {section.items.map((industry, industryIndex) => (
                                <div key={industry.name} className="space-y-2">
                                  <div className="flex items-center">
                                    {industry.icon}
                                    <h5 className="font-medium text-gray-900">
                                      {industry.name}
                                    </h5>
                                  </div>
                                  <ul className="space-y-1">
                                    {industry.items.map(
                                      (product, productIndex) => (
                                        <li key={product.name}>
                                          <NavigationMenuLink asChild>
                                            <a
                                              href="/"
                                              className="block py-1.5 text-gray-600 hover:text-gray-900 transition-colors"
                                            >
                                              {product.name}
                                            </a>
                                          </NavigationMenuLink>
                                        </li>
                                      )
                                    )}
                                  </ul>
                                  {industryIndex < section.items.length - 1 && (
                                    <div className="border-t border-gray-100 pt-2" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </NavigationMenuContent>
                  </>
                ) : (
                  <Link href={item.href} legacyBehavior passHref>
                    <NavigationMenuLink
                      className={`${navigationMenuTriggerStyle()} bg-transparent text-gray-9z00 transition-colors hover:bg-[#FC7B11]/50 rounded-full`}
                    >
                      {item.name}
                    </NavigationMenuLink>
                  </Link>
                )}
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right Buttons */}
        <div className="hidden items-center space-x-2 md:flex">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button
            asChild
            className="rounded-full bg-[#FC7B11] hover:bg-[#FC7B11]/90 font-semibold transition-colors"
          >
            <Link href="/register">Sign up for Free</Link>
          </Button>
        </div>

        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="outline" size="icon">
              <MenuIcon className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[500px] px-10 overflow-y-auto"
          >
            <SheetTitle>Solutions</SheetTitle>
            <div className="mt-4 flex flex-col space-y-4">
              {navItems.map((item) => (
                <div key={item.name}>
                  {item.dropdown && (
                    <div className="ml-4 mt-2 space-y-2 border-l border-gray-200 pl-4">
                      {item.dropdown[0].items.map((industry) => (
                        <div key={industry.name} className="space-y-1">
                          <div className="flex items-center font-medium text-gray-900">
                            {industry.icon}
                            {industry.name}
                          </div>
                          <div className="ml-2 space-y-1">
                            {industry.items.map((product) => (
                              <Button
                                key={product.name}
                                variant="ghost"
                                className="justify-start text-left w-full"
                                asChild
                              >
                                <Link href={product.name}>
                                  <div className="text-gray-600">
                                    {product.name}
                                  </div>
                                </Link>
                              </Button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="mt-8 flex flex-col space-y-2">
                <Button variant="outline" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Sign up for Free</Link>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export default NavBar;
