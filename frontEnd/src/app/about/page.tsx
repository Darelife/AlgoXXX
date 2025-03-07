"use client";

import React, { useState, useEffect } from "react";
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
      const { clientX, clientY } = event;
      const { innerWidth, innerHeight } = window;
      const offsetX = (clientX / innerWidth - 0.5) * -20;
      const offsetY = (clientY / innerHeight - 0.5) * -20;
      setTransform({ x: offsetX, y: offsetY });
    };

    const isPhone = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (!isPhone) {
      window.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      if (!isPhone) {
        window.removeEventListener("mousemove", handleMouseMove);
      }
    };
  }, []);

  if (!teamData) {
    return <div>Loading...</div>;
  }

  // const currentTeam = teamData["2024-25"];

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
            <h1 className="md:text-8xl text-6xl font-sans font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 mt-[-10rem]">
            About Us
            </h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto p-5">
            Meet the team behind Algomaniax
          </p>
        </div>
      </div>

      <div className="space-y-12 mb-12 max-w-7xl mx-auto px-4">
  {Object.keys(teamData).sort().reverse().map((year) => (
    <div
      key={year}
      className="bg-blue-50/90 dark:bg-white/5 backdrop-blur-sm rounded-xl shadow-sm border border-blue-200/50 dark:border-white/10 p-8 transition-all duration-300 hover:shadow-lg"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 items-start">
        <div className="flex justify-center sm:justify-start sm:col-span-1 group">
          <div className="relative w-full max-w-sm overflow-hidden rounded-xl shadow-md">
            <Image
              src={`/algoCoordis${year.split("-")[0]}.jpg`}
              alt={`Algomaniax ${year} Coordinators`}
              width={300}
              height={300}
              className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        </div>

        <div className="sm:col-span-2 space-y-6 text-center sm:text-left">
          <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 inline-block pb-2">
            {teamData[year].year}
          </h2>

          {/* Map through roles EXCEPT "Crew" */}
          {Object.keys(teamData[year].roles)
            .filter((roleName) => roleName !== "Crew")
            .map((roleName) => (
              <div
                key={roleName}
                className="bg-white dark:bg-white/5 border border-gray-100 dark:border-gray-700/40 p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
              >
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 border-l-4 border-blue-500 dark:border-indigo-500 pl-3">
                  {roleName}
                </h3>
                <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                  {teamData[year].roles[roleName].map((member, index) => (
                    <span key={member.name} className="inline-block">
                      <a
                        href={`https://codeforces.com/profile/${member.link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700/60 hover:bg-blue-100 dark:hover:bg-indigo-900/60 rounded-full text-gray-800 dark:text-gray-200 text-sm font-medium hover:text-blue-600 dark:hover:text-indigo-300 transition-all duration-200"
                      >
                        {member.name}
                      </a>
                      {index < teamData[year].roles[roleName].length - 1 && (
                        <span className="mx-1"></span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Crew Section with chips style */}
      {teamData[year].roles["Crew"] && (
        <div className="mt-8 bg-white dark:bg-white/5 border border-gray-100 dark:border-gray-700/40 p-6 rounded-lg shadow-sm">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 border-l-4 border-blue-500 dark:border-indigo-500 pl-3 text-center sm:text-left">
            Crew Members
          </h3>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            {teamData[year].roles["Crew"].map((member) => (
              <a
                key={member.name}
                href={`https://codeforces.com/profile/${member.link}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700/60 hover:bg-blue-100 dark:hover:bg-indigo-900/60 rounded-full text-gray-800 dark:text-gray-200 text-sm font-medium hover:text-blue-600 dark:hover:text-indigo-300 transition-all duration-200"
              >
                {member.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  ))}
</div>
    </div>
  );
}