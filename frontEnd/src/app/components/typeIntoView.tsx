"use client";

import React, { useEffect, useState } from "react";

const TypeIntoView: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const handleScroll = () => {
      // Debounce the scroll event
      clearTimeout(timer);
      timer = setTimeout(() => {
        const section = document.getElementById("typingSection");
        if (!section) return;

        const rect = section.getBoundingClientRect();
        // Check if at least 50% of the section is visible
        if (rect.top < window.innerHeight * 0.75 && !isVisible) {
          setIsVisible(true);
        }
      }, 50); // 50ms debounce
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isVisible]);

  return (
    <div>
      <section
        id="typingSection"
        className={`transition-opacity transform duration-1000 ease-in-out ${
          isVisible
            ? "opacity-100 translate-x-0"
            : "opacity-0 -translate-x-12"
        } flex flex-col justify-center items-start min-h-screen px-10`}
      >
        <h1 className="text-4xl font-bold">Welcome to ALGOX</h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-[600px]">
          Explore the world of competitive programming with us. We are a group of
          passionate programmers who love to solve problems and learn new techniques to
          improve our skills. Join us and be a part of the community!
        </p>
      </section>
    </div>
  );
};

export default TypeIntoView;
