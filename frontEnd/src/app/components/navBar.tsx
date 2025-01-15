"use client";

import React from "react";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const NavBar = ({ toggleTheme }: { toggleTheme: () => void }) => {
  return (
    <header className="flex h-20 w-full shrink-0 items-center justify-between px-4 md:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="lg:hidden">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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
        <SheetContent side="left">
          <nav className="flex flex-col space-y-4">
            <Link href="/" className="text-lg font-medium" prefetch={false}>
              Home
            </Link>
            <Link href="/about" className="text-lg font-medium" prefetch={false}>
              About
            </Link>
            <Link href="/contact" className="text-lg font-medium" prefetch={false}>
              Contact
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
      <div className="hidden lg:flex space-x-6">
        <Link href="/" className="text-lg font-medium" prefetch={false}>
          Home
        </Link>
        <Link href="/about" className="text-lg font-medium" prefetch={false}>
          About
        </Link>
        <Link href="/contact" className="text-lg font-medium" prefetch={false}>
          Contact
        </Link>
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={toggleTheme}
        className="ml-auto lg:ml-0"
      >
        <svg
          className="h-6 w-6"
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
        <span className="sr-only">Toggle theme</span>
      </Button>
    </header>
  );
};

export default NavBar;
