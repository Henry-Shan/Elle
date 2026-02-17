"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
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
import { MenuIcon, User, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

const NavBar = () => {
  const { data: session } = useSession();

  return (
    <nav className="sticky top-0 z-50 w-full border-b backdrop-blur-md bg-gray-950/80 border-gray-800/60">
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
            className="text-2xl font-semibold text-white group-hover:text-[#FC7B11] transition-colors duration-200 mb-1 ml-[2px]"
            style={{ fontFamily: "geist, sans-serif" }}
          >
            lle AI
          </span>
        </Link>

        {/* Right side — Desktop */}
        <div className="hidden items-center gap-2 md:flex">
          {session ? (
            <>
              <Button
                variant="ghost"
                asChild
                className="bg-white text-gray-900 hover:bg-gray-100 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200"
              >
                <Link href="/chat">Dashboard</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="rounded-lg p-1 hover:bg-gray-800 transition-all duration-200"
                  >
                    <Image
                      src={`https://avatar.vercel.sh/${session.user?.email}`}
                      alt={session.user?.email ?? "User Avatar"}
                      width={32}
                      height={32}
                      className="rounded-lg"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-gray-900 border-gray-700 shadow-xl rounded-lg"
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
                className="text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200"
              >
                <Link href="/login">Sign in</Link>
              </Button>
              <Button
                asChild
                className="rounded-lg bg-white hover:bg-gray-100 text-gray-900 font-semibold px-5 py-2 text-sm transition-all duration-200"
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
              className="rounded-lg hover:bg-gray-800"
            >
              <MenuIcon className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[320px] px-6 bg-gray-950 border-gray-800"
          >
            <SheetTitle className="text-gray-100 text-lg font-semibold">
              Menu
            </SheetTitle>
            <div className="mt-8 flex flex-col space-y-3">
              {session ? (
                <>
                  <Button
                    variant="ghost"
                    asChild
                    className="justify-start text-gray-300 hover:bg-gray-800 rounded-lg px-3 py-2"
                  >
                    <Link href="/chat">Dashboard</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="justify-start text-red-600 hover:bg-red-900/20 rounded-lg px-3 py-2"
                  >
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    asChild
                    className="justify-start text-gray-300 hover:bg-gray-800 rounded-lg px-3 py-2"
                  >
                    <Link href="/login">Sign in</Link>
                  </Button>
                  <Button
                    asChild
                    className="justify-start bg-white hover:bg-gray-100 text-gray-900 rounded-lg px-3 py-2"
                  >
                    <Link href="/register">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export default NavBar;
