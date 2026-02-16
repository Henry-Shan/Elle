"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MenuIcon,
  HeartPulse,
  ShoppingCart,
  Cloud,
  School,
  Home,
  Plane,
  Gamepad2,
  User,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";

const NavBar = () => {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

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
                { name: "Elle-healthcare-base", href: "/chat" },
                { name: "Elle-healthcare-pro", href: "/chat" },
              ],
            },
            {
              name: "E-commerce",
              icon: <ShoppingCart className="size-5 mr-2 text-gray-500" />,
              items: [
                { name: "Elle-commerce-base", href: "/chat" },
                { name: "Elle-commerce-pro", href: "/chat" },
              ],
            },
            {
              name: "SaaS",
              icon: <Cloud className="size-5 mr-2 text-gray-500" />,
              items: [
                { name: "Elle-saas-base", href: "/chat" },
                { name: "Elle-saas-pro", href: "/chat" },
              ],
            },
            {
              name: "EdTech",
              icon: <School className="size-5 mr-2 text-gray-500" />,
              items: [
                { name: "Elle-edtech-base", href: "/chat" },
                { name: "Elle-edtech-pro", href: "/chat" },
              ],
            },
            {
              name: "Real Estate",
              icon: <Home className="size-5 mr-2 text-gray-500" />,
              items: [
                { name: "Elle-real-estate-base", href: "/chat" },
                { name: "Elle-real-estate-pro", href: "/chat" },
              ],
            },
            {
              name: "Travel & Hospitality",
              icon: <Plane className="size-5 mr-2 text-gray-500" />,
              items: [
                { name: "Elle-travel-base", href: "/chat" },
                { name: "Elle-travel-pro", href: "/chat" },
              ],
            },
            {
              name: "Gaming & Esports",
              icon: <Gamepad2 className="size-5 mr-2 text-gray-500" />,
              items: [
                { name: "Elle-esports-base", href: "/chat" },
                { name: "Elle-esports-pro", href: "/chat" },
              ],
            },
          ],
        },
      ],
    },
    { name: "Security", href: "/security" },
    { name: "Help", href: "mailto:help.elleai@outlook.com" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b backdrop-blur-md bg-white/15 dark:bg-gray-900/95 border-gray-100 dark:border-gray-800">
      <div className="flex h-14 items-center justify-between px-6 max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <div className="relative">
            <span
              className="text-3xl font-bold text-[#FC7B11] group-hover:scale-110 transition-transform duration-200"
              style={{
                fontFamily: "Roboto, sans-serif",
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              &Sigma;
            </span>
          </div>
          <span
            className="text-2xl font-semibold text-gray-900 dark:text-white group-hover:text-[#FC7B11] transition-colors duration-200 mb-1 ml-[2px]"
            style={{ fontFamily: "geist, sans-serif" }}
          >
            lle AI
          </span>
        </Link>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden md:flex flex-1 pl-10">
          <NavigationMenuList>
            {navItems.map((item) => (
              <NavigationMenuItem key={item.name}>
                {item.dropdown ? (
                  <>
                    <NavigationMenuTrigger className="bg-transparent flex items-center gap-1 text-gray-700 dark:text-gray-300 [&>svg]:size-4 hover:!bg-gray-100 dark:hover:!bg-gray-800 hover:!text-gray-900 dark:hover:!text-gray-100 rounded-lg px-3 py-2 transition-all duration-200">
                      {item.name}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl rounded-xl">
                      <div className="p-8 w-[620px]">
                        {item.dropdown.map((section) => (
                          <div key={section.title}>
                            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-6 uppercase tracking-wider">
                              {section.title}
                            </h4>
                            <div className="grid grid-cols-2 gap-6">
                              {section.items.map((industry, industryIndex) => (
                                <div key={industry.name} className="space-y-2">
                                  <div className="flex items-center mb-2">
                                    <div className="text-gray-400 dark:text-gray-500">
                                      {industry.icon}
                                    </div>
                                    <h5 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                      {industry.name}
                                    </h5>
                                  </div>
                                  <ul className="space-y-1">
                                    {industry.items.map((product) => (
                                      <li key={product.name}>
                                        <NavigationMenuLink asChild>
                                          <a
                                            href={product.href || "/"}
                                            className="block py-2 px-3 text-sm text-gray-600 dark:text-gray-400 hover:text-[#FC7B11] dark:hover:text-[#FC7B11] hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                                          >
                                            {product.name}
                                          </a>
                                        </NavigationMenuLink>
                                      </li>
                                    ))}
                                  </ul>
                                  {industryIndex < section.items.length - 1 && (
                                    <div className="border-t border-gray-100 dark:border-gray-700 mt-4" />
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
                  <NavigationMenuLink asChild
                    className={`${navigationMenuTriggerStyle()} bg-transparent text-gray-700 dark:text-gray-300 transition-all duration-200 hover:!bg-gray-100 dark:hover:!bg-gray-800 hover:!text-gray-900 dark:hover:!text-gray-100 rounded-lg px-3 py-2`}
                  >
                    <Link href={item.href}>
                      {item.name}
                    </Link>
                  </NavigationMenuLink>
                )}
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right Buttons */}
        <div className="hidden items-center space-x-2 md:flex">
          {session ? (
            <>
              <Button
                variant="ghost"
                asChild
                className="justify-start bg-gray-900 text-white hover:bg-gray-700 hover:text-white rounded-lg px-2.5 py-1.5 text-sm"
              >
                <Link href="/chat">Dashboard</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                  >
                    <Image
                      src={`https://avatar.vercel.sh/${session.user?.email}`}
                      alt={session.user?.email ?? "User Avatar"}
                      width={36}
                      height={36}
                      className="rounded-lg"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl rounded-lg"
                >
                  <DropdownMenuItem asChild>
                    <Link href="/chat" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                asChild
                className="text-gray-700 dark:text-gray-300 hover:!bg-gray-100 dark:hover:!bg-gray-800 hover:!text-gray-900 dark:hover:!text-gray-100 rounded-lg px-4 py-2 transition-all duration-200"
              >
                <Link href="/login">Sign in</Link>
              </Button>
              <Button
                asChild
                className="rounded-lg bg-[#FC7B11] hover:bg-[#FC7B11]/90 text-white font-semibold px-6 py-2 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Link href="/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <MenuIcon className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[400px] px-6 overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
          >
            <SheetTitle className="text-gray-900 dark:text-gray-100 text-lg font-semibold">
              Menu
            </SheetTitle>
            <div className="mt-6 flex flex-col space-y-6">
              {navItems.map((item) => (
                <div key={item.name}>
                  {item.dropdown && (
                    <div className="ml-4 mt-2 space-y-4 border-l border-gray-200 dark:border-gray-700 pl-4">
                      {item.dropdown[0].items.map((industry) => (
                        <div key={industry.name} className="space-y-2">
                          <div className="flex items-center space-x-2 font-medium text-gray-900 dark:text-gray-100">
                            <div className="text-gray-400 dark:text-gray-500">
                              {industry.icon}
                            </div>
                            <span className="text-sm font-semibold">
                              {industry.name}
                            </span>
                          </div>
                          <div className="ml-6 space-y-1">
                            {industry.items.map((product) => (
                              <Button
                                key={product.name}
                                variant="ghost"
                                className="justify-start text-left w-full text-sm text-gray-600 dark:text-gray-400 hover:text-[#FC7B11] dark:hover:text-[#FC7B11] hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-3 py-2"
                                asChild
                              >
                                <Link href={product.href || "/"}>
                                  {product.name}
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
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-col space-y-3">
                {/* Theme Toggle for Mobile */}
                <Button
                  variant="ghost"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg px-3 py-2"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="mr-3 h-4 w-4" />
                      Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="mr-3 h-4 w-4" />
                      Dark Mode
                    </>
                  )}
                </Button>
                {session ? (
                  <>
                    <Button
                      variant="ghost"
                      asChild
                      className="justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg px-3 py-2"
                    >
                      <Link href="/chat">Dashboard</Link>
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="justify-start text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg px-3 py-2"
                    >
                      Sign out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      asChild
                      className="justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg px-3 py-2"
                    >
                      <Link href="/login">Sign in</Link>
                    </Button>
                    <Button
                      asChild
                      className="justify-start bg-[#FC7B11] hover:bg-[#FC7B11]/90 text-white rounded-lg px-3 py-2"
                    >
                      <Link href="/register">Get Started</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export default NavBar;
