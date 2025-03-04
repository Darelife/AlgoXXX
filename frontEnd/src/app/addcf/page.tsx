"use client";
import { type NextPage } from "next";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import NavBar from "../components/navBar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Code } from "lucide-react";

interface Problem {
  contestId: number;
  index: string;
}

interface UserData {
  bitsId: string;
  name: string;
  handle: string;
}

const CodeforcesPage: NextPage = () => {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [userData, setUserData] = useState<UserData>({
    bitsId: "",
    name: "",
    handle: ""
  });
  const [error, setError] = useState<string>("");
  const [theme, setTheme] = useState<string>("light");
  const [isAnimating, setIsAnimating] = useState(false);
  const [overlayColor, setOverlayColor] = useState("#121212");
  const [transform, setTransform] = useState({ x: 0, y: 0 });
  const router = useRouter();

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme);
    document.documentElement.classList.toggle("dark", storedTheme === "dark");
    document.body.classList.toggle("dark", storedTheme === "dark");
    fetchRandomProblem();
  }, []);

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

  const fetchRandomProblem = async () => {
    try {
      const response = await fetch("https://codeforces.com/api/problemset.problems");
      const data = await response.json();
      if (data.status === "OK") {
        const randomIndex = Math.floor(Math.random() * data.result.problems.length);
        setProblem(data.result.problems[randomIndex]);
      }
    } catch {
      setError("Failed to fetch problem");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmission = async () => {
    if (!userData.bitsId || !userData.name || !userData.handle) {
      setError("Please fill in all fields");
      return;
    }

    try {
      const url = "https://algoxxx.onrender.com/verify";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bitsid: userData.bitsId,
          name: userData.name,
          cfid: userData.handle,
          contestId: problem?.contestId.toString(),
          index: problem?.index,
        }),
      });
      
      // const responseData = await response.json();
      
      if (response.status === 201) {
        router.push("/");
      }
      else {
        setError("Submission failed. Please try again.");
      }
    } catch {
      setError("Invalid Request");
    }
  };

  return (
    <div className={`relative overflow-hidden ${theme === "dark" ? "dark" : ""}`}>
      {isAnimating && (
        <div
          className="fixed inset-0 z-50 transition-transform duration-[1000ms] ease-[cubic-bezier(0.4, 0, 0.2, 1)] transform translate-x-0 animate-slide"
          style={{ backgroundColor: overlayColor }}
        ></div>
      )}

      {/* C++ code brackets and symbols */}
      <div className="absolute bottom-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <svg 
          width="100%" 
          height="100%" 
          viewBox="0 0 1000 800" 
          xmlns="http://www.w3.org/2000/svg"
          opacity={theme === "dark" ? "0.08" : "0.05"}
        >
          {/* C++ Logo */}
          <g transform="translate(180, 300) scale(0.6)">
            <path d="M302.107,258.262c2.401-4.159,3.893-8.845,3.893-13.053V98.546c0-4.208-1.49-8.893-3.892-13.052L153,172.175L302.107,258.262z" 
              fill={theme === "dark" ? "#ffffff" : "#000000"} opacity="0.7" />
            <path d="M166.25,341.193l126.5-73.034c3.644-2.104,6.956-5.737,9.357-9.897L153,172.175L3.893,258.263c2.401,4.159,5.714,7.793,9.357,9.896l126.5,73.034C147.037,345.401,158.963,345.401,166.25,341.193z" 
              fill={theme === "dark" ? "#ffffff" : "#000000"} opacity="0.7" />
            <path d="M302.108,85.493c-2.402-4.16-5.715-7.793-9.358-9.897L166.25,2.562c-7.287-4.208-19.213-4.208-26.5,0L13.25,75.596c-7.287,4.208-13.249,14.423-13.249,22.949v146.124c0,4.208,1.491,8.894,3.893,13.053L153,172.175L302.108,85.493z" 
              fill={theme === "dark" ? "#ffffff" : "#000000"} opacity="0.7" />
          </g>
          
          {/* C++ Syntax Elements */}
          <text x="50" y="100" fontFamily="monospace" fontSize="60" fontWeight="bold" fill={theme === "dark" ? "#ffffff" : "#000000"} opacity="0.8">{'{}'}</text>
          <text x="250" y="200" fontFamily="monospace" fontSize="72" fontWeight="bold" fill={theme === "dark" ? "#ffffff" : "#000000"} opacity="0.7">( )</text>
          <text x="500" y="150" fontFamily="monospace" fontSize="65" fontWeight="bold" fill={theme === "dark" ? "#ffffff" : "#000000"} opacity="0.6">[ ]</text>
          <text x="750" y="250" fontFamily="monospace" fontSize="80" fontWeight="bold" fill={theme === "dark" ? "#ffffff" : "#000000"} opacity="0.7">;</text>
          <text x="150" y="400" fontFamily="monospace" fontSize="90" fontWeight="bold" fill={theme === "dark" ? "#ffffff" : "#000000"} opacity="0.7">*</text>
          <text x="300" y="500" fontFamily="monospace" fontSize="70" fontWeight="bold" fill={theme === "dark" ? "#ffffff" : "#000000"} opacity="0.6">&amp;</text>
          <text x="600" y="450" fontFamily="monospace" fontSize="75" fontWeight="bold" fill={theme === "dark" ? "#ffffff" : "#000000"} opacity="0.7">-&gt;</text>
          <text x="800" y="600" fontFamily="monospace" fontSize="65" fontWeight="bold" fill={theme === "dark" ? "#ffffff" : "#000000"} opacity="0.8">::</text>
          <text x="400" y="650" fontFamily="monospace" fontSize="100" fontWeight="bold" fill={theme === "dark" ? "#ffffff" : "#000000"} opacity="0.9">++</text>
        </svg>
      </div>

      <NavBar toggleTheme={toggleTheme} fixed={false} />
      
      {/* Hero section with gradient title - adjusted positioning */}
<div
  className="flex justify-center items-center min-h-screen pt-24 pb-10 mt-[-7rem]" // Reduced height and added padding
  style={{ transform: `translate(${transform.x}px, ${transform.y}px)` }}
>
  <div className="text-center">
    <h1 className="md:text-8xl text-6xl font-sans font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400">
      Connect Codeforces
    </h1>
    <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-5">
      Submit a compile error to verify your Codeforces handle
    </p>
  </div>
</div>
      
      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 pb-20">
        <div className="bg-blue-50/90 dark:bg-white/5 backdrop-blur-sm rounded-xl shadow-sm border border-blue-200/50 dark:border-white/10 p-8 transition-all duration-300 hover:shadow-lg mb-8">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 border-l-4 border-orange-500 dark:border-red-500 pl-3">
                  Your Information
                </h3>
                
                <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-gray-700/40 p-6 rounded-lg shadow-sm">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bitsId" className="text-gray-700 dark:text-gray-300">BITS ID</Label>
                      <Input
                        id="bitsId"
                        name="bitsId"
                        value={userData.bitsId}
                        onChange={handleInputChange}
                        placeholder="Your Bits ID (in Caps)"
                        className="bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={userData.name}
                        onChange={handleInputChange}
                        placeholder="Your Name"
                        className="bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="handle" className="text-gray-700 dark:text-gray-300">Codeforces Handle</Label>
                      <Input
                        id="handle"
                        name="handle"
                        value={userData.handle}
                        onChange={handleInputChange}
                        placeholder="Your Codeforces Handle"
                        className="bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 border-l-4 border-orange-500 dark:border-red-500 pl-3">
                  Verification Challenge
                </h3>
                
                {problem ? (
                  <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-gray-700/40 p-6 rounded-lg shadow-sm flex flex-col justify-between h-auto">
                    <div className="space-y-4">
                      <div className="flex items-center justify-center p-4 bg-orange-100 dark:bg-red-900/30 rounded-full w-16 h-16 mx-auto mb-4">
                        <Code className="w-8 h-8 text-orange-600 dark:text-red-400" />
                      </div>
                      
                      <h2 className="text-xl font-bold text-center text-gray-800 dark:text-gray-200">
                        Submit a Compile Error
                      </h2>
                      
                      <p className="text-gray-600 dark:text-gray-300 text-center">
                        Submit code with a compile error to the problem below for verification.
                      </p>
                      
                      <div className="mt-4 p-4 rounded-lg text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Problem</p>
                        <a
                          href={`https://codeforces.com/contest/${problem.contestId}/problem/${problem.index}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xl font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors"
                        >
                          {problem.contestId}-{problem.index}
                        </a>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleSubmission}
                      className="w-full mt-6 bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-500 dark:to-red-500 hover:from-orange-700 hover:to-red-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300"
                    >
                      Verify Submission
                    </Button>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-gray-700/40 p-6 rounded-lg shadow-sm flex flex-col items-center justify-center h-auto">
                    <div className="animate-pulse flex flex-col items-center">
                      <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full mb-4"></div>
                      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                      <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mt-4">Loading problem...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive" className="animate-fadeIn">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Instructions card */}
        <div className="bg-white/90 dark:bg-white/5 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100/50 dark:border-white/10 p-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            How It Works
          </h3>
          <ol className="space-y-3 text-gray-600 dark:text-gray-300 list-decimal pl-5">
            <li>Fill in your BITS ID, full name, and Codeforces handle</li>
            <li>Click the problem link to visit the Codeforces problem page</li>
            <li>Submit any solution that produces a <strong>compile error</strong> (e.g., write, &quot;Compilation Error&quot;)</li>
            <li>After submitting, return here and click &quot;Verify Submission&quot;</li>
            <li>Once verified, you&apos;ll be redirected to the homepage</li>
          </ol>
        </div>
      </div>

      {/* Add some style */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default CodeforcesPage;