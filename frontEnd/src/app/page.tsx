"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import NavBar from "./components/navBar";
import TypeIntoView from "./components/typeIntoView";
import { motion, useScroll, useTransform } from "framer-motion";
import { Sparkles, Globe, Trophy, ArrowRight } from "lucide-react";

export default function Home() {
  const [theme, setTheme] = useState("light");
  const [isAnimating, setIsAnimating] = useState(false);
  const [overlayColor, setOverlayColor] = useState("#121212");
  const [transform, setTransform] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device on first render and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  
  // Parallax scroll setup - disable on mobile
  const { scrollY } = useScroll();
  const logoY = useTransform(scrollY, [0, 300], isMobile ? [0, 0] : [0, -80]);
  const logoScale = useTransform(scrollY, [0, 300], isMobile ? [1, 1] : [1, 0.8]);
  const bgY = useTransform(scrollY, [0, 300], isMobile ? [0, 0] : [0, 80]);
  
  // Adding rotation transforms for SVG backgrounds - reduced effect on mobile
  const rotateLeft = useTransform(scrollY, [0, 1000], isMobile ? [0, -5] : [0, -25]);
  const rotateRight = useTransform(scrollY, [0, 1000], isMobile ? [0, 5] : [0, 25]);
  const rotateSlowLeft = useTransform(scrollY, [0, 1000], isMobile ? [0, -10] : [0, -45]);
  const rotateSlowRight = useTransform(scrollY, [0, 1000], isMobile ? [0, 5] : [0, 15]);
  
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme);
    document.documentElement.classList.toggle("dark", storedTheme === "dark");
    document.body.classList.toggle("dark", storedTheme === "dark");
  }, []);
  
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setOverlayColor(newTheme === "dark" ? "#121212" : "#ffffff");
    setIsAnimating(true);

    setTimeout(() => {
      setTheme(newTheme);
      document.documentElement.classList.toggle("dark", newTheme === "dark");
      document.body.classList.toggle("dark", newTheme === "dark");
      localStorage.setItem("theme", newTheme);
    }, 900);

    setTimeout(() => {
      setIsAnimating(false);
    }, 2000);
  };

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (isMobile) return; // Don't apply mouse movement effect on mobile
      
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
  }, [isMobile]);
  
  return (
    <div className={`relative overflow-hidden ${theme === "dark" ? "dark" : ""}`}>
      {isAnimating && (
        <div
          className="fixed inset-0 z-50 transition-transform duration-[1000ms] ease-[cubic-bezier(0.4, 0, 0.2, 1)] transform translate-x-0 animate-slide"
          style={{ backgroundColor: overlayColor }}
        ></div>
      )}

      <NavBar toggleTheme={toggleTheme} fixed={false}/>
      
      {/* SVG Background Elements with Parallax Rotation */}
      <div className="fixed inset-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        {/* Top left rotating SVG */}
        <motion.div 
          className="absolute -top-32 -left-32 w-96 h-96 opacity-30 dark:opacity-15"
          style={{ 
            y: bgY,
            rotate: rotateLeft,
            scale: useTransform(scrollY, [0, 500], [1, 1.35])
          }}
        >
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path 
              fill={theme === "dark" ? "#ff4500" : "#ff6347"} 
              d="M38.8,-66.8C51.9,-59.6,65.4,-51.8,71.2,-39.8C77,-27.9,75.1,-12,74.5,4.2C73.9,20.3,74.5,36.8,67.1,48.2C59.6,59.5,44.1,65.8,28.7,71.5C13.3,77.2,-2,82.3,-13.4,76.6C-24.9,70.9,-32.4,54.6,-40.6,42C-48.8,29.4,-57.7,20.5,-62.4,9.4C-67.1,-1.8,-67.5,-15,-64.7,-29.2C-61.9,-43.4,-55.9,-58.7,-44.6,-66.6C-33.3,-74.5,-16.7,-75.1,-1.4,-72.8C13.9,-70.6,27.7,-65.5,38.8,-66.8Z" 
              transform="translate(100 100)" 
            />
          </svg>
        </motion.div>
        
        {/* Top right rotating SVG */}
        <motion.div 
          className="absolute -top-20 right-0 w-80 h-80 opacity-30 dark:opacity-15"
          style={{ 
            y: bgY,
            rotate: rotateRight,
            scale: useTransform(scrollY, [0, 500], [1, 0.95])
          }}
        >
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path 
              fill={theme === "dark" ? "#ff6b35" : "#ff8c4a"} 
              d="M66.4,-69.5C85.2,-55.6,99.7,-31.8,103.3,-6.5C106.9,18.8,99.5,45.5,82.2,61.2C64.9,76.9,37.8,81.5,14.5,77.9C-8.8,74.3,-28.3,62.4,-44.4,47.5C-60.5,32.6,-73.2,14.7,-75.2,-5.3C-77.2,-25.3,-68.3,-47.5,-52.9,-61.2C-37.4,-75,-18.7,-80.5,2.9,-83.9C24.5,-87.3,48.9,-88.7,66.4,-69.5Z" 
              transform="translate(100 100)" 
            />
          </svg>
        </motion.div>
        
        {/* Bottom left rotating SVG */}
        <motion.div 
          className="absolute bottom-0 -left-20 w-72 h-72 opacity-30 dark:opacity-15"
          style={{ 
            y: bgY,
            rotate: rotateSlowRight,
            scale: useTransform(scrollY, [0, 500], [1, 1.25])
          }}
        >
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path 
              fill={theme === "dark" ? "#e61919" : "#ff3333"} 
              d="M62.6,-37.8C76.4,-17.5,79.8,11.7,69.7,33.8C59.6,55.9,36.1,70.9,11.5,73.4C-13,75.9,-38.7,65.8,-54.3,47.1C-70,28.3,-75.7,0.8,-68,-20.9C-60.3,-42.6,-39.3,-58.4,-17.7,-65C3.9,-71.6,27.1,-69,62.6,-37.8Z" 
              transform="translate(100 100)" 
            />
          </svg>
        </motion.div>
        
        {/* Bottom right rotating SVG */}
        <motion.div 
          className="absolute bottom-0 right-0 w-96 h-96 opacity-30 dark:opacity-15"
          style={{ 
            y: bgY,
            rotate: rotateSlowLeft,
            scale: useTransform(scrollY, [0, 500], [1, 0.85])
          }}
        >
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path 
              fill={theme === "dark" ? "#cc3300" : "#ff5722"} 
              d="M44.1,-70.5C58.4,-62.3,72.1,-51.4,80.2,-36.6C88.3,-21.8,90.8,-3.2,85.8,12.7C80.7,28.5,68.2,41.7,54.3,53.8C40.5,65.9,25.3,77.1,7.3,79.8C-10.6,82.5,-31.5,76.8,-48.2,65.5C-64.9,54.2,-77.4,37.2,-81.7,18.6C-86.1,0,-82.3,-20.3,-72.3,-36.5C-62.2,-52.6,-45.9,-64.7,-29.9,-72.2C-13.9,-79.7,1.9,-82.7,15.7,-78.5C29.5,-74.4,44.1,-70.5,44.1,-70.5Z" 
              transform="translate(100 100) scale(1.05)" 
            />
          </svg>
        </motion.div>
        
        {/* Center SVG for more depth */}
        <motion.div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 opacity-20 dark:opacity-10"
          style={{ 
            rotate: rotateRight,
            scale: useTransform(scrollY, [0, 500], [1, 1.5])
          }}
        >
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path 
              fill={theme === "dark" ? "#ff8c00" : "#ffa500"} 
              d="M35.6,-64.1C47.4,-58.2,59.3,-51.4,66.6,-40.9C73.9,-30.4,76.6,-15.2,74.9,-1.1C73.2,13.1,67.1,26.1,59.3,38.7C51.6,51.2,42.1,63.3,29.6,70.6C17.1,77.9,1.5,80.4,-13.5,77.8C-28.5,75.3,-42.9,67.7,-51.8,56.2C-60.7,44.8,-64.1,29.5,-70.2,13.2C-76.3,-3.2,-85.1,-20.5,-82.7,-35.7C-80.2,-50.9,-66.5,-64,-50.7,-69.9C-35,-75.8,-17.5,-74.5,-2.1,-71C13.2,-67.6,26.4,-62,35.6,-64.1Z" 
              transform="translate(100 100)" 
            />
          </svg>
        </motion.div>
      </div>
      
      {/* Parallax background elements (from original) */}
      <motion.div 
        className="absolute inset-0 w-full h-screen pointer-events-none"
        style={{ y: bgY }}
      >
        <div className="absolute top-20 left-1/4 w-64 h-64 rounded-full bg-orange-500/10 dark:bg-orange-500/5 blur-3xl"></div>
        <div className="absolute bottom-32 right-1/4 w-96 h-96 rounded-full bg-red-500/10 dark:bg-red-500/5 blur-3xl"></div>
      </motion.div>
      
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
            style={{ 
              y: logoY,
              scale: logoScale
            }}
          >
            <motion.h1 
              className="md:text-9xl text-6xl font-sans font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 mt-[-10rem]"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Image 
                src={theme === "dark" 
                  ? "/logos/AlgoManiaXLogoWhitePoster.png" 
                  : "/logos/AlgoManiaXLogoBlackPoster.png"
                }
                alt="AlgoManiaX"
                width={600}
                height={200}
                className="max-w-56"
                priority
              />
            </motion.h1>
          </motion.div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
        >
          <TypeIntoView align="left" id="oneType"/>
        </motion.div>
        
        {/* Features section with parallax effect */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          {[
            {
              href: "/leaderboard",
              icon: <Trophy className="w-6 h-6 text-orange-600 dark:text-red-400" />,
              title: "Competitive Leaderboard",
              description: "Track your progress and compare against peers in our constantly updated leaderboard.",
              cta: "View leaderboard"
            },
            {
              href: "/bootcamp",
              icon: <Sparkles className="w-6 h-6 text-orange-600 dark:text-red-400" />,
              title: "Learning Resources",
              description: "Access our curated collection of bootcamp materials designed to sharpen your algorithmic skills.",
              cta: "Explore resources"
            },
            {
              href: "/about",
              icon: <Globe className="w-6 h-6 text-orange-600 dark:text-red-400" />,
              title: "BITS Goa",
              description: "The official competitive programming club of BITS Pilani, Goa Campus. CPing since its inception",
              cta: "About Us"
            }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link href={item.href} className="group">
                <div className="bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-xl shadow-sm p-6 border border-gray-100/50 dark:border-white/10 hover:shadow-md transition-all duration-300 h-full transform hover:scale-[1.02] cursor-pointer">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-200 dark:group-hover:bg-red-800/30 transition-colors">
                    {item.icon}
                  </div>
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 group-hover:text-orange-600 dark:group-hover:text-red-400 transition-colors">{item.title}</h3>
                    <ArrowRight className="w-4 h-4 text-orange-600/0 dark:text-red-400/0 group-hover:text-orange-600 dark:group-hover:text-red-400 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">{item.description}</p>
                  
                  <div className="mt-4 pt-2 border-t border-gray-100/50 dark:border-white/10 flex justify-end">
                    <span className="text-sm font-medium text-orange-600 dark:text-red-400 group-hover:opacity-100 transition-all duration-300 flex items-center">
                      {item.cta}
                      <ArrowRight className="w-3 h-3 ml-1 transform translate-x-0 group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
      
      <motion.footer 
        className="mt-12 border-t border-gray-200 dark:border-gray-800 py-8"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
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
      </motion.footer>
    </div>
  );
}