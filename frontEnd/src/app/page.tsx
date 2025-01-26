"use client";

import React, { useState, useEffect } from "react";
import NavBar from "./components/navBar";
import TypeIntoView from "./components/typeIntoView";
// import AddButton from "./components/AddButton";
// import Functionality from "./components/functionality";
// import Dashboard from "./components/DashBoard";
// import Dashboard from "./components/dashboard";
// import PlusButton from "./components/PlusButton";
// import FadingText from "./components/fadingText";
// import ConnectWalletButton from "./components/metaaaa";

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

      <NavBar toggleTheme={toggleTheme} fixed={true}/>
      <div
        className="flex justify-center items-center min-h-screen"
        style={{ transform: `translate(${transform.x}px, ${transform.y}px)` }}
      >
        <h1 className="md:text-9xl text-6xl font-sans font-black">ALGOX</h1>
      </div>
      <TypeIntoView align="left" id="oneType"/>
      <TypeIntoView align="left" id="twoType"/>
      {/* <TypeIntoView align="left" id="threeType"/> */}
      {/* <Functionality /> */}
      {/* <AddButton /> */}
      {/* <Dashboard /> */}
      {/* <PlusButton onClick={() => console.log("Clicked")} /> */}
      {/* <Subscriptions /> */}
      {/* <Dashboard />
      <div className="mb-[125px]">
      </div> */}
    </div>
  );
}