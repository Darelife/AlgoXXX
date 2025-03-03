"use client";

import React, { useState, useEffect } from "react";
import NavBar from "../components/navBar";
import { ChevronRight, ChevronDown } from 'lucide-react';

interface BootcampData {
  [key: string]: string | BootcampData;
}

const ResourceItem = ({ name, content }: { name: string; content: string | BootcampData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isNested = typeof content === 'object';

  const toggleOpen = () => setIsOpen(!isOpen);

  if (isNested) {
    return (
      <div className="space-y-2">
        <div className="bg-white/80 dark:bg-gray-800/20 backdrop-blur-sm p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-blue-100/50 dark:border-gray-700/30">
          <button
            onClick={toggleOpen}
            className="flex items-center gap-2 w-full text-left"
          >
            {isOpen ? (
              <ChevronDown className="w-4 h-4 text-blue-600 dark:text-indigo-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-blue-600 dark:text-indigo-400" />
            )}
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {name}
            </h2>
          </button>
          
          {isOpen && (
            <div className="mt-3 ml-6 space-y-1">
              {Object.entries(content).map(([key, value]) => (
                <ResourceItem key={key} name={key} content={value} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <a
      href={content}
      target="_blank"
      rel="noopener noreferrer"
      className="flex py-2 px-3 rounded-md text-gray-700 dark:text-gray-300 text-sm hover:text-blue-600 dark:hover:text-indigo-400 transition-colors duration-200 hover:bg-blue-50/50 dark:hover:bg-gray-800/50 border border-transparent hover:border-blue-100 dark:hover:border-gray-700/50 items-center"
    >
      <div className="w-1 h-1 bg-blue-500 dark:bg-indigo-400 rounded-full mr-2"></div>
      {name}
    </a>
  );
};

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isAnimating, setIsAnimating] = useState(false);
  const [overlayColor, setOverlayColor] = useState("#121212");
  const [transform, setTransform] = useState({ x: 0, y: 0 });
  const [bootcampData, setBootcampData] = useState<BootcampData | null>(null);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme as "light" | "dark");
    document.documentElement.classList.toggle("dark", storedTheme === "dark");
    document.body.classList.toggle("dark", storedTheme === "dark");
  }, []);

  useEffect(() => {
    fetch("/bootcamp.json")
      .then((res) => res.json())
      .then((data: BootcampData) => setBootcampData(data))
      .catch((error) => console.error("Error fetching bootcamp data:", error));
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
    }, 500);

    setTimeout(() => {
      setIsAnimating(false);
    }, 1000);
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

  if (!bootcampData) {
    return <div>Loading...</div>;
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
      <div
  className="flex justify-center items-center min-h-screen"
  style={{ transform: `translate(${transform.x}px, ${transform.y}px)` }}
>
  <div className="text-center">
    <h1 className="md:text-8xl text-5xl font-sans font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 mt-[-10rem]">
      Bootcamp
    </h1>
    <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
      Resources for competitive programming and algorithmic challenges
    </p>
  </div>
</div>

      <div className="space-y-8 mb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div 
            className="bg-blue-50/90 dark:bg-white/5 backdrop-blur-sm rounded-xl shadow-sm border border-blue-200/50 dark:border-0 dark:border-white/10 p-6 transition-all duration-300 hover:shadow-lg space-y-4"
          >
            {Object.entries(bootcampData).map(([key, value]) => (
              <ResourceItem key={key} name={key} content={value} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}