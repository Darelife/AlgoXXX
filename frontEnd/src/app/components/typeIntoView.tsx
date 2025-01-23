"use client";

import React, { useEffect, useState } from "react";

const TypeIntoView: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const section = document.getElementById("typingSection");
      if (!section) return;

      const rect = section.getBoundingClientRect();
      if (rect.top < window.innerHeight && !isVisible) {
        setIsVisible(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isVisible]);

  return (
    <div>
      <section
        id="typingSection"
        className={`transition-opacity transform duration-3000 ease-in-out ${
          isVisible
            ? "opacity-100 translate-x-0"
            : "opacity-0 -translate-x-12"
        } flex flex-col justify-center items-start min-h-screen px-10`}
      >
        <h1 className="text-4xl font-bold">Welcome to ALGOX</h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
          Explore the world of algorithms, optimized solutions, and powerful
          tools for developers.
        </p>
      </section>
    </div>
  );
};

export default TypeIntoView;
