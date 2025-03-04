"use client";

import React, { useEffect, useState } from "react";

interface TypeIntoViewProps {
  id:string;
  heading?: string; // Optional heading
  text?: string; // Optional text below the heading
  align?: "left" | "right"; // Alignment direction
}

const TypeIntoView: React.FC<TypeIntoViewProps> = ({
  id,
  heading = "Welcome to AlgoManiax", // Default heading
  text = "Explore the world of competitive programming with us. We are a group of passionate programmers who love to solve problems and learn new techniques to improve our skills. Join us and be a part of the community!", // Default text
  align = "left", // Default alignment
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const handleScroll = () => {
      // Debounce the scroll event
      clearTimeout(timer);
      timer = setTimeout(() => {
        const section = document.getElementById(id);
        if (!section) return;
        const rect = section.getBoundingClientRect();
        // Check if at least 50% of the section is visible
        if (rect.top < window.innerHeight * 0.75 && rect.bottom > window.innerHeight * 0.25) {
          if (!isVisible) {
            setIsVisible(true);
          }
        } else {
          if (isVisible) {
            setIsVisible(false);
          }
        }
        // const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        // REMOVING SNAP SCROLLING
        // if (!isMobile && rect.top < window.innerHeight * 0.05 && rect.bottom > window.innerHeight * 0.95) {
        //   section.scrollIntoView({ behavior: "smooth" });
        // }


        // Check if at least 50% of the section is visible
        if (rect.top < window.innerHeight * 0.75 && !isVisible) {
          setIsVisible(true);
        }
      }, 10); // 50ms debounce
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isVisible]);

  return (
    <div
    className={`flex ${align === "right" ? "justify-end" : "justify-start"} min-h-screen px-[2vw]`}
    >
      <section
        id={id}
        className={`transition-opacity transform duration-1000 ease-in-out max-w-[700px] ${
          isVisible
            ? "opacity-100 translate-x-0"
            : align === "left"
            ? "opacity-0 -translate-x-12"
            : "opacity-0 translate-x-12"
        } flex flex-col justify-center items-start min-h-screen px-[2vw] ${
          align === "right" ? "items-end text-right" : "items-start text-left"
        }`}
      >
        <h1 className="text-4xl font-bold">{heading}</h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">{text}</p>
      </section>
    </div>
  );
};

export default TypeIntoView;
