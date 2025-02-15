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
        <h1 className="md:text-9xl text-6xl font-sans font-black mt-[-10rem]">
          About Us
        </h1>
      </div>

      <div className="space-y-12 mb-12">
        {Object.keys(teamData).sort().reverse().map((year) => (
          <div
            key={year}
            className="mx-4 sm:mx-10 p-8 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl"
            style={{ backgroundColor: theme === "dark" ? "#282a3e" : "white" }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
              <div className="flex justify-center sm:justify-start sm:col-span-1 group">
                <Image
                  src={`/algoCoordis${year.split("-")[0]}.jpg`}
                  alt={`Algomaniax ${year} Coordinators`}
                  layout="responsive"
                  width={300}
                  height={300}
                  className="max-w-[85%] sm:max-w-[80%] rounded-xl shadow-md transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>

              <div className="sm:col-span-2 space-y-8 text-center sm:text-left">
                <h1 className="text-4xl font-bold text-gray-700 dark:text-gray-200 border-b-4 border-gray-500 dark:border-gray-400 inline-block pb-2 w-[20vw]">
                  {teamData[year].year}
                </h1>

                {/* Map through roles EXCEPT "Crew" */}
                {Object.keys(teamData[year].roles)
                  .filter((roleName) => roleName !== "Crew")
                  .map((roleName) => (
                    <div
                      key={roleName}
                      className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#383a59] dark:to-[#44466b] p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                        {roleName}
                      </h2>
                      <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                        {teamData[year].roles[roleName].map((member, index) => (
                          <span key={member.name}>
                            <a
                              href={`https://codeforces.com/profile/${member.link}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-600 dark:text-gray-300 text-lg hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                            >
                              {member.name}
                            </a>
                            {index < teamData[year].roles[roleName].length - 1 && (
                              <span className="text-gray-400">, </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Crew Section OUTSIDE the grid */}
            {teamData[year].roles["Crew"] && (
              <div className="mt-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#383a59] dark:to-[#44466b] p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3 text-center sm:text-left">
                  Crew Members
                </h2>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  {teamData[year].roles["Crew"].map((member, index) => (
                    <span key={member.name}>
                      <a
                        href={`https://codeforces.com/profile/${member.link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 dark:text-gray-300 text-lg hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                      >
                        {member.name}
                      </a>
                      {index < teamData[year].roles["Crew"].length - 1 && (
                        <span className="text-gray-400">, </span>
                      )}
                    </span>
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