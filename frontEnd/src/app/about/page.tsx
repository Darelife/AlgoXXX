"use client";

import React, { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import NavBar from "../components/navBar";
import Image from "next/image";

interface TeamMember {
  name: string;
  link: string;
}

interface TeamRole {
  [roleName: string]: TeamMember[];
}

interface TeamData {
  [year: string]: {
    year: string;
    roles: TeamRole;
  };
}

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isAnimating, setIsAnimating] = useState(false);
  const [overlayColor, setOverlayColor] = useState("#121212");
  const [transform, setTransform] = useState({ x: 0, y: 0 });
  const [teamData, setTeamData] = useState<TeamData | null>(null);
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
  const headerY = useTransform(scrollY, [0, 300], isMobile ? [0, 0] : [0, -40]);
  const headerScale = useTransform(scrollY, [0, 300], isMobile ? [1, 1] : [1, 0.95]);
  const bgY = useTransform(scrollY, [0, 300], isMobile ? [0, 0] : [0, 80]);
  
  // Adding rotation transforms for SVG backgrounds
  const rotateLeft = useTransform(scrollY, [0, 1000], isMobile ? [0, -5] : [0, -25]);
  const rotateRight = useTransform(scrollY, [0, 1000], isMobile ? [0, 5] : [0, 25]);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme as "light" | "dark");
    document.documentElement.classList.toggle("dark", storedTheme === "dark");
    document.body.classList.toggle("dark", storedTheme === "dark");
  }, []);

  useEffect(() => {
    fetch("/team.json")
      .then((res) => res.json())
      .then((data: TeamData) => setTeamData(data))
      .catch((error) => console.error("Error fetching team data:", error));
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

  if (!teamData) {
    return (
      <div className={`relative overflow-hidden ${theme === "dark" ? "dark" : ""}`}>
        <NavBar toggleTheme={toggleTheme} fixed={false} />
        <div className="flex justify-center items-center min-h-screen">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop" }}
            className="flex items-center gap-2"
          >
            <div className="text-2xl text-gray-600 dark:text-gray-300">Loading</div>
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop" }}
              className="w-2 h-2 rounded-full bg-orange-500 dark:bg-red-500"
            ></motion.div>
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, delay: 0.2, repeat: Infinity, repeatType: "loop" }}
              className="w-2 h-2 rounded-full bg-orange-500 dark:bg-red-500"
            ></motion.div>
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, delay: 0.4, repeat: Infinity, repeatType: "loop" }}
              className="w-2 h-2 rounded-full bg-orange-500 dark:bg-red-500"
            ></motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${theme === "dark" ? "dark" : ""}`}>
      {isAnimating && (
        <div
          className="fixed inset-0 z-50 transition-transform duration-[1000ms] ease-[cubic-bezier(0.4, 0, 0.2, 1)] transform translate-x-0 animate-slide"
          style={{ backgroundColor: overlayColor }}
        ></div>
      )}

      <NavBar toggleTheme={toggleTheme} fixed={false} />
      
      {/* SVG Background Elements with Parallax Rotation - matching the main page */}
      <div className="fixed inset-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        {/* Top right rotating SVG */}
        <motion.div 
          className={`absolute -top-20 right-0 ${isMobile ? 'w-64 h-64' : 'w-80 h-80'} opacity-30 dark:opacity-15`}
          style={{ 
            y: bgY,
            rotate: rotateRight,
            willChange: "transform"
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
          className={`absolute bottom-0 -left-20 ${isMobile ? 'w-64 h-64' : 'w-72 h-72'} opacity-30 dark:opacity-15`}
          style={{ 
            y: bgY,
            rotate: rotateLeft,
            willChange: "transform"
          }}
        >
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path 
              fill={theme === "dark" ? "#ff4500" : "#ff6347"}
              d="M62.6,-37.8C76.4,-17.5,79.8,11.7,69.7,33.8C59.6,55.9,36.1,70.9,11.5,73.4C-13,75.9,-38.7,65.8,-54.3,47.1C-70,28.3,-75.7,0.8,-68,-20.9C-60.3,-42.6,-39.3,-58.4,-17.7,-65C3.9,-71.6,27.1,-69,62.6,-37.8Z" 
              transform="translate(100 100)" 
            />
          </svg>
        </motion.div>
      </div>
      
      {/* Parallax background elements - with orange/red color scheme */}
      <motion.div 
        className="absolute inset-0 w-full h-screen pointer-events-none"
        style={{ y: bgY }}
      >
        <div className={`absolute top-20 left-1/4 ${isMobile ? 'w-48 h-48' : 'w-64 h-64'} rounded-full bg-orange-500/10 dark:bg-orange-500/5 blur-3xl`}></div>
        <div className={`absolute bottom-32 right-1/4 ${isMobile ? 'w-64 h-64' : 'w-96 h-96'} rounded-full bg-red-500/10 dark:bg-red-500/5 blur-3xl`}></div>
      </motion.div>
      
      <motion.div
        className="relative flex justify-center items-center min-h-screen mb-8"
        style={{ 
          transform: isMobile ? 'none' : `translate(${transform.x}px, ${transform.y}px)`,
          willChange: isMobile ? 'auto' : 'transform'
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="flex flex-col items-center"
          style={{ 
            y: headerY,
            scale: headerScale
          }}
        >
          <motion.h1 
            className="md:text-8xl text-5xl font-sans font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 mt-[-10rem]"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            About Us
          </motion.h1>
          <motion.p 
            className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-5 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Meet the team behind Algomaniax
          </motion.p>
        </motion.div>
      </motion.div>

      <div className="space-y-12 mb-12 max-w-6xl mx-auto px-4 sm:px-6">
        {Object.keys(teamData).sort().reverse().map((year) => (
          <motion.div
            key={year}
            className="bg-white/70 dark:bg-gray-900/20 backdrop-blur-sm rounded-xl shadow-sm border border-orange-200/30 dark:border-red-900/20 p-6 md:p-8 transition-all duration-300 hover:shadow-lg"
            // initial={{ opacity: 0, y: 30 }}
            // whileInView={{ opacity: 1, y: 0 }}
            // viewport={{ once: true, margin: "-50px" }}
            // transition={{ duration: 0.5, delay: yearIndex * 0.1 }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 items-start">
              <motion.div 
                className="flex justify-center sm:justify-start sm:col-span-1 group"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative w-full max-w-sm overflow-hidden rounded-xl shadow-sm border border-orange-100/20 dark:border-red-900/10">
                  <Image
                    src={`/algoCoordis${year.split("-")[0]}.jpg`}
                    alt={`Algomaniax ${year} Coordinators`}
                    width={500}
                    height={300}
                    className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </motion.div>

              <div className="sm:col-span-2 space-y-5 text-center sm:text-left">
                <motion.h2 
                  className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 inline-block pb-2"
                  // initial={{ opacity: 0, x: -20 }}
                  // whileInView={{ opacity: 1, x: 0 }}
                  // viewport={{ once: true }}
                  // transition={{ duration: 0.5, delay: 0.1 }}
                >
                  {teamData[year].year}
                </motion.h2>

                {/* Map through roles EXCEPT "Crew" */}
                {Object.keys(teamData[year].roles)
                  .filter((roleName) => roleName !== "Crew")
                  .map((roleName) => (
                    <motion.div
                      key={roleName}
                      className="bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-orange-100/30 dark:border-red-900/20 p-4 md:p-5 rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
                      // initial={{ opacity: 0, y: 10 }}
                      // whileInView={{ opacity: 1, y: 0 }}
                      // viewport={{ once: true }}
                      // transition={{ duration: 0.3, delay: 0.1 + roleIndex * 0.1 }}
                    >
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3 border-l-4 border-orange-500 dark:border-red-500 pl-3">
                        {roleName}
                      </h3>
                      <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                        {teamData[year].roles[roleName].map((member) => (
                          <motion.span key={member.name} className="inline-block"
                            whileHover={{ y: -3 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <a
                              href={`https://codeforces.com/profile/${member.link}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-orange-50 dark:bg-gray-800/60 hover:bg-orange-100 dark:hover:bg-red-900/40 rounded-full text-gray-800 dark:text-gray-200 text-sm font-medium hover:text-orange-600 dark:hover:text-red-400 transition-all duration-200 border border-orange-100/30 dark:border-red-900/20"
                            >
                              {member.name}
                            </a>
                          </motion.span>
                        ))}
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>

            {/* Crew Section with chips style */}
            {teamData[year].roles["Crew"] && (
              <motion.div 
                className="mt-6 bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-orange-100/30 dark:border-red-900/20 p-4 md:p-5 rounded-lg shadow-sm"
                // initial={{ opacity: 0, y: 20 }}
                // whileInView={{ opacity: 1, y: 0 }}
                // viewport={{ once: true }}
                // transition={{ duration: 0.3, delay: 0.3 }}
              >
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3 border-l-4 border-orange-500 dark:border-red-500 pl-3 text-center sm:text-left">
                  Crew Members
                </h3>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  {teamData[year].roles["Crew"].map((member) => (
                    <motion.span key={member.name} className="inline-block"
                      whileHover={{ y: -3 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <a
                        href={`https://codeforces.com/profile/${member.link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-orange-50 dark:bg-gray-800/60 hover:bg-orange-100 dark:hover:bg-red-900/40 rounded-full text-gray-800 dark:text-gray-200 text-sm font-medium hover:text-orange-600 dark:hover:text-red-400 transition-all duration-200 border border-orange-100/30 dark:border-red-900/20"
                      >
                        {member.name}
                      </a>
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
      
      {/* Footer matching homepage style */}
      <motion.footer 
        className="mt-12 border-t border-gray-200 dark:border-gray-800 py-8"
        // initial={{ opacity: 0 }}
        // whileInView={{ opacity: 1 }}
        // viewport={{ once: true }}
        // transition={{ duration: 0.5 }}
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <p className="text-gray-600 dark:text-gray-400 text-sm text-center md:text-left">
                © {new Date().getFullYear()} Algomaniax. All rights reserved.
              </p>
            </div>
            
            <div className="flex space-x-6 md:space-x-8">
              <motion.a 
                href="/leaderboard" 
                className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-red-400 transition-colors"
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                Leaderboard
              </motion.a>
              <motion.a 
                href="/bootcamp" 
                className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-red-400 transition-colors"
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                Bootcamp
              </motion.a>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}