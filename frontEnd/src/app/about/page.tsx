"use client";

import React, { useState, useEffect } from "react";
import NavBar from "../components/navBar";
import Image from "next/image";
// import TextIntoView from "../components/typeIntoView";

export default function Home() {
  const [theme, setTheme] = useState("light");
  const [isAnimating, setIsAnimating] = useState(false); // Controls sheet visibility
  const [overlayColor, setOverlayColor] = useState("#121212"); // Default dark theme overlay
  const [transform, setTransform] = useState({ x: 0, y: 0 });


  const crew2024_25 = [
    { name: "Prakhar Bhandari", link: "darelife" },
    { name: "Harsh Bhatia", link: "harshb" },
    { name: "Parth Jhalani", link: "sankabapur" }
  ];
  const core2024_25 = [
    { name: "Yash Pratap Singh", link: "mathmath33" },
    { name: "Anwesh Das", link: "unbased" }
  ];
  const coordi2024_25 = [
    { name: "Eshan Karia", link: "Eshan_Karia" },
    { name: "Prakhar Gupta", link: "prakharg11" },
    { name: "Aditya Agarwal", link: "adi0104" },
    { name: "Shrey Gupta", link: "shrey71" }
  ];

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
      <div
        className="flex justify-center items-center min-h-screen"
        style={{ transform: `translate(${transform.x}px, ${transform.y}px)` }}
      >
        <h1 className="md:text-9xl text-6xl font-sans font-black mt-[-10rem]">About Us</h1>
      </div>
      
      {/* <h1 className="text-4xl font-bold text-gray-500 border-b-4 border-gray-500 inline-block w-[40vw] ml-5">2024-25</h1> */}
      {/* <br />
      <br /> */}
      <div className=" mx-4 sm:mx-10 p-8 bg-white dark:bg-[#1a1b2e] rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 items-start">
          {/* Image Section */}
          <div className="flex justify-center sm:justify-start sm:col-span-1 group">
            <Image
              src="/algoCoordis2024.jpg"
              alt="Algomaniax 2024 Coordinators"
              layout="responsive"
              width={300}
              height={300}
              className="max-w-[85%] sm:max-w-[80%] rounded-xl shadow-md transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>

          {/* Text Section */}
          <div className="sm:col-span-2 space-y-8 text-center sm:text-left">
            {/* Year Header */}
            <h1 className="text-4xl font-bold text-gray-700 dark:text-gray-200 border-b-4 border-gray-500 dark:border-gray-400 inline-block pb-2 w-[20vw]">
              2024-25
            </h1>

            {/* Coordinators Section */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#1e1f35] dark:to-[#2a2b45] p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">Coordinators</h2>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                {coordi2024_25.map((member, index) => (
                  <span key={member.name}>
                    <a 
                      href={`https://codeforces.com/profile/${member.link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 dark:text-gray-300 text-lg hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                    >
                      {member.name}
                    </a>
                    {index < coordi2024_25.length - 1 && <span className="text-gray-400">, </span>}
                  </span>
                ))}
              </div>
            </div>

            {/* Cores Section */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#1e1f35] dark:to-[#2a2b45] p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">Cores</h2>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                {core2024_25.map((member, index) => (
                  <span key={member.name}>
                    <a 
                      href={`https://codeforces.com/profile/${member.link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 dark:text-gray-300 text-lg hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                    >
                      {member.name}
                    </a>
                    {index < core2024_25.length - 1 && <span className="text-gray-400">, </span>}
                  </span>
                ))}
              </div>
            </div>

            
          </div>
          
        </div>
        <br />
        {/* Crew Section Moved Inside */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#1e1f35] dark:to-[#2a2b45] p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 mt-2">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">Crew</h2>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            {crew2024_25.map((member, index) => (
              <span key={member.name}>
                <a 
                  href={`https://codeforces.com/profile/${member.link}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-300 text-lg hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                >
                  {member.name}
                </a>
                {index < crew2024_25.length - 1 && <span className="text-gray-400">, </span>}
              </span>
            ))}
          </div>
        </div>
      </div>


    </div>
  );
}