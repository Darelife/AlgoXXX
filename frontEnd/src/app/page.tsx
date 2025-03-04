"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import NavBar from "./components/navBar";
import TypeIntoView from "./components/typeIntoView";
import { motion } from "framer-motion";
import { Sparkles, Globe, Trophy } from "lucide-react";

export default function Home() {
  const [theme, setTheme] = useState("light");
  const [isAnimating, setIsAnimating] = useState(false); // Controls sheet visibility
  const [overlayColor, setOverlayColor] = useState("#121212"); // Default dark theme overlay
  const [transform, setTransform] = useState({ x: 0, y: 0 });

  // Load the initial theme from localStorage
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme);
    document.documentElement.classList.toggle("dark", storedTheme === "dark");
    document.body.classList.toggle("dark", storedTheme === "dark");
  }, []);

  // Handle theme toggle with animation
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setOverlayColor(newTheme === "dark" ? "#121212" : "#ffffff"); // Set overlay color to match new theme
    setIsAnimating(true); // Start the animation

    setTimeout(() => {
      setTheme(newTheme);
      document.documentElement.classList.toggle("dark", newTheme === "dark");
      document.body.classList.toggle("dark", newTheme === "dark");

      localStorage.setItem("theme", newTheme);
    }, 500); // Change theme halfway through the animation

    setTimeout(() => {
      setIsAnimating(false); // End the animation
    }, 1000); // Match the animation duration
  };

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const { clientX, clientY } = event;
      const { innerWidth, innerHeight } = window;
      const offsetX = (clientX / innerWidth - 0.5) * -20;
      const offsetY = (clientY / innerHeight - 0.5) * -20;
      setTransform({ x: offsetX, y: offsetY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className={`relative overflow-hidden ${theme === "dark" ? "dark" : ""}`}>
    
      {isAnimating && (
        <div
          className="fixed inset-0 z-50 transition-transform duration-[1000ms] ease-[cubic-bezier(0.4, 0, 0.2, 1)] transform translate-x-0 animate-slide"
          style={{ backgroundColor: overlayColor }}
        ></div>
      )}

      <NavBar toggleTheme={toggleTheme} fixed={false}/>
      
      {/* Hero section with background elements */}
      <div className="relative">

        
        
        <div
          className="flex flex-col justify-center items-center min-h-[100vh]"
          style={{ transform: `translate(${transform.x}px, ${transform.y}px)` }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="flex flex-col items-center"
          >
            <motion.h1 
              className="md:text-9xl text-6xl font-sans font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 mt-[-10rem]"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              ALGOX
            </motion.h1>
            
            <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 max-w-md text-center px-5 ">
              The Official Competitive Programming Club of BITS Goa; AlgoX aka AlgoManiaX
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link 
                href="/leaderboard"
                className="w-full sm:w-auto px-6 py-3 bg-orange-600 dark:bg-red-600 text-white rounded-xl font-medium text-center shadow-md hover:shadow-lg transition-all duration-300 hover:bg-orange-700 dark:hover:bg-red-700"
              >
                <span className="flex items-center justify-center gap-2">
                  <Trophy className="h-4 w-4" /> Leaderboard
                </span>
              </Link>
              <Link 
                href="/bootcamp"
                className="w-full sm:w-auto px-6 py-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl font-medium text-center shadow-sm hover:shadow-md transition-all duration-300"
              >
                <span className="flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4" /> Bootcamp Resources
                </span>
              </Link>
              {/* <Link 
                href="/about"
                className="w-full sm:w-auto px-6 py-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl font-medium text-center shadow-sm hover:shadow-md transition-all duration-300"
              >
                <span className="flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4" /> About Us
                </span>
              </Link> */}
            </div>
          </motion.div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <TypeIntoView align="left" id="oneType"/>
        </motion.div>
        
        {/* Features section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-xl shadow-sm p-6 border border-gray-100/50 dark:border-white/10 hover:shadow-md transition-all duration-300">
            <div className="w-12 h-12 bg-orange-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <Trophy className="w-6 h-6 text-orange-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Competitive Leaderboard</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Track your progress and compare against peers in our constantly updated leaderboard.</p>
          </div>
          
          <div className="bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-xl shadow-sm p-6 border border-gray-100/50 dark:border-white/10 hover:shadow-md transition-all duration-300">
            <div className="w-12 h-12 bg-orange-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-orange-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Learning Resources</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Access our curated collection of bootcamp materials designed to sharpen your algorithmic skills.</p>
          </div>
          
          <div className="bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-xl shadow-sm p-6 border border-gray-100/50 dark:border-white/10 hover:shadow-md transition-all duration-300">
            <div className="w-12 h-12 bg-orange-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <Globe className="w-6 h-6 text-orange-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">BITS Goa</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-300">The official competitive programming club of BITS Pilani, Goa Campus, fostering algorithmic problem-solving skills since its inception.</p>
          </div>
        </div>
      </div>
      
      <footer className="mt-12 border-t border-gray-200 dark:border-gray-800 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center justify-center md:justify-start">
                <Image
                  src={theme === "dark" ? "/algoLightX.png" : "/algoDarkX.png"}
                  alt='AlgoX'
                  width={120}
                  height={70}
                  className="mb-2"
                />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm text-center md:text-left">
                © {new Date().getFullYear()} Algomaniax. All rights reserved.
              </p>
            </div>
            
            <div className="flex space-x-8">
              <Link href="/about" className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-red-400 transition-colors">About</Link>
              <Link href="/bootcamp" className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-red-400 transition-colors">Bootcamp</Link>
              <Link href="/leaderboard" className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-red-400 transition-colors">Leaderboard</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}