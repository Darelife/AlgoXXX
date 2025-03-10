"use client";

import React, { useState } from "react";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import AddCfButton from "./cfLogin";
// import Image from "next/image";

const NavBar = ({ toggleTheme, fixed }: { toggleTheme: () => void; fixed?: boolean }) => {
  const [activeLink, setActiveLink] = React.useState("");
  const [mounted, setMounted] = useState(false);
  
  React.useEffect(() => {
    // Set active link based on current path
    setActiveLink(window.location.pathname);
    setMounted(true);
  }, []);

  return (
    <header 
      className={`${fixed ? "fixed" : ""} top-0 left-0 right-0 flex h-20 w-full shrink-0 items-center justify-between px-4 md:px-6 z-50 backdrop-blur-sm bg-white/80 dark:bg-[#121212] border-b border-gray-200/50 dark:border-gray-800/50`}
    >
      {/* Mobile Menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16m-7 6h7"
              ></path>
            </svg>
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="bg-white dark:bg-gray-950 shadow-lg !backdrop-blur-none !bg-opacity-100 border-r border-gray-200 dark:border-gray-800">
          <div className="mb-8 mt-2">
          </div>
          <nav className="flex flex-col space-y-1">
            <Link 
              href="/" 
              className={`py-2.5 px-4 text-lg font-medium transition-all hover:text-orange-600 dark:hover:text-red-400 border-l-2 ${
                activeLink === "/" 
                  ? "border-l-orange-600 dark:border-l-red-400 text-orange-600 dark:text-red-400 font-semibold" 
                  : "border-l-transparent"
              }`} 
              prefetch={false}
              onClick={() => setActiveLink("/")}
            >
              Home
            </Link>
            <Link 
              href="/about" 
              className={`py-2.5 px-4 text-lg font-medium transition-all hover:text-orange-600 dark:hover:text-red-400 border-l-2 ${
                activeLink === "/about" 
                  ? "border-l-orange-600 dark:border-l-red-400 text-orange-600 dark:text-red-400 font-semibold" 
                  : "border-l-transparent"
              }`} 
              prefetch={false}
              onClick={() => setActiveLink("/about")}
            >
              About
            </Link>
            <Link 
              href="/leaderboard" 
              className={`py-2.5 px-4 text-lg font-medium transition-all hover:text-orange-600 dark:hover:text-red-400 border-l-2 ${
                activeLink === "/leaderboard" 
                  ? "border-l-orange-600 dark:border-l-red-400 text-orange-600 dark:text-red-400 font-semibold" 
                  : "border-l-transparent"
              }`} 
              prefetch={false}
              onClick={() => setActiveLink("/leaderboard")}
            >
              Leaderboard
            </Link>
            <Link 
              href="/bootcamp" 
              className={`py-2.5 px-4 text-lg font-medium transition-all hover:text-orange-600 dark:hover:text-red-400 border-l-2 ${
                activeLink === "/bootcamp" 
                  ? "border-l-orange-600 dark:border-l-red-400 text-orange-600 dark:text-red-400 font-semibold" 
                  : "border-l-transparent"
              }`} 
              prefetch={false}
              onClick={() => setActiveLink("/bootcamp")}
            >
              Bootcamp
            </Link>
          </nav>
          
          <div className="mt-8 px-4">
            <AddCfButton />
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Desktop Brand */}
      <div className="hidden lg:flex items-center">
        
        {/* Desktop Navigation - Less blocky with bottom borders instead of backgrounds */}
        <div className="flex space-x-6">
          <Link 
            href="/" 
            className={`px-1 py-1.5 font-medium transition-all border-b-2 hover:text-orange-600 dark:hover:text-red-400 ${
              activeLink === "/" 
                ? "border-b-orange-600 dark:border-b-red-400 text-orange-600 dark:text-red-400" 
                : "border-b-transparent"
            }`} 
            prefetch={false}
            onClick={() => setActiveLink("/")}
          >
            Home
          </Link>
          <Link 
            href="/about" 
            className={`px-1 py-1.5 font-medium transition-all border-b-2 hover:text-orange-600 dark:hover:text-red-400 ${
              activeLink === "/about" 
                ? "border-b-orange-600 dark:border-b-red-400 text-orange-600 dark:text-red-400" 
                : "border-b-transparent"
            }`} 
            prefetch={false}
            onClick={() => setActiveLink("/about")}
          >
            About
          </Link>
          <Link 
            href="/leaderboard" 
            className={`px-1 py-1.5 font-medium transition-all border-b-2 hover:text-orange-600 dark:hover:text-red-400 ${
              activeLink === "/leaderboard" 
                ? "border-b-orange-600 dark:border-b-red-400 text-orange-600 dark:text-red-400" 
                : "border-b-transparent"
            }`} 
            prefetch={false}
            onClick={() => setActiveLink("/leaderboard")}
          >
            Leaderboard
          </Link>
          <Link 
            href="/bootcamp" 
            className={`px-1 py-1.5 font-medium transition-all border-b-2 hover:text-orange-600 dark:hover:text-red-400 ${
              activeLink === "/bootcamp" 
                ? "border-b-orange-600 dark:border-b-red-400 text-orange-600 dark:text-red-400" 
                : "border-b-transparent"
            }`} 
            prefetch={false}
            onClick={() => setActiveLink("/bootcamp")}
          >
            Bootcamp
          </Link>
        </div>
      </div>
      
      {/* Right side actions */}
      <div className="flex items-center space-x-4">
        <div className="hidden lg:block">
          <AddCfButton />
        </div>
        
        {/* Theme toggle - More refined, less blocky design */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="ml-auto lg:ml-0 rounded-full w-10 h-10 p-0 flex items-center justify-center hover:bg-gray-100/80 dark:hover:bg-gray-800/80"
          aria-label="Toggle theme"
        >
          {mounted ? (
            <>
              <svg
                className="h-5 w-5 text-gray-700 dark:text-gray-300 hidden dark:inline"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 3v1m0 16v1m8.66-10H21m-16 0H3m15.36 6.36l-.71.71M7.05 7.05l-.71-.71M16.95 7.05l.71-.71M7.05 16.95l-.71.71M12 7a5 5 0 100 10 5 5 0 000-10z"
                />
              </svg>
              <svg
                className="h-5 w-5 text-gray-700 dark:text-gray-300 dark:hidden inline"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"
                />
              </svg>
            </>
          ) : (
            // Show empty space during SSR
            <span className="w-5 h-5"></span>
          )}
        </Button>
      </div>
    </header>
  );
};

export default NavBar;