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
        <div
          className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#383a59] dark:to-[#44466b] p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
        >
          <button
            onClick={toggleOpen}
            className="flex items-center gap-2 w-full text-left"
          >
            {isOpen ? (
              <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
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
      className="block py-2 px-3 rounded-md text-gray-600 dark:text-gray-300 text-sm hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800"
    >
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
        <h1 className="md:text-9xl text-6xl font-sans font-black mt-[-10rem]">
          Bootcamp
        </h1>
      </div>

      <div className="space-y-8 mb-12">
        <div
          className="max-w-4xl mx-auto px-4 sm:px-6"
        >
          <div 
            className="p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl space-y-4"
            style={{ backgroundColor: theme === "dark" ? "#282a3e" : "white" }}
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