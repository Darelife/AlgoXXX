"use client";
import { type NextPage } from "next";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import NavBar from "../components/navBar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Code } from "lucide-react";
import Image from "next/image";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Check for auth session and stored data on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme);
    document.documentElement.classList.toggle("dark", storedTheme === "dark");
    document.body.classList.toggle("dark", storedTheme === "dark");
    fetchRandomProblem();

    // Check for stored data from OAuth redirect
    const storedData = localStorage.getItem("cfVerificationData");
    if (storedData) {
      setUserData(JSON.parse(storedData));
      
      // Check if we need to complete verification
      const checkSession = async () => {
        if (localStorage.getItem("isVerifying") === "true") {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.user?.email) {
            setIsLoading(true);
            await completeVerification(JSON.parse(storedData), sessionData.session.user.email);
          }
        }
      };
      
      checkSession();
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

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

  // Function to verify BITS email format
  const verifyBitsEmail = (email: string, bitsId: string) => {
    // Case insensitive comparison
    const emailLower = email.toLowerCase();
    const expectedEmail = `f${bitsId.substring(0, 4)}${bitsId.substring(8, 12)}@goa.bits-pilani.ac.in`.toLowerCase();
    return emailLower === expectedEmail;
  };

  // Complete verification after OAuth
  const completeVerification = async (userData: UserData, email: string) => {
    try {
      // Verify the email matches BITS ID format
      if (!verifyBitsEmail(email, userData.bitsId)) {
        await supabase.auth.signOut();
        setError("BITS ID doesn't match with Google account");
        localStorage.removeItem("isVerifying");
        setIsLoading(false);
        return;
      }
      
      const prob = JSON.parse(localStorage.getItem("problemData") || "{}");
      const conId = prob?.contestId.toString();
      const indId = prob?.index;
      
      // Proceed with the API call for verification
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
          contestId: conId,
          index: indId,
        }),
      });
      
      if (response.status === 201) {
        // Clear verification data and redirect
        localStorage.removeItem("cfVerificationData");
        localStorage.removeItem("isVerifying");
        localStorage.removeItem("problemData");
        router.push("/");
      } else {
        console.log(userData);
        const errorText = await response.text();
        setError(errorText);
      }
    } catch (err) {
      console.error(err);
      setError("Invalid Request");
    } finally {
      setIsLoading(false);
      localStorage.removeItem("isVerifying");
    }
  };

  const handleGoogleSignInAndVerify = async () => {
    if (!userData.bitsId || !userData.name || !userData.handle) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);
      
      // Store form data for when we return from Google OAuth
      localStorage.setItem("cfVerificationData", JSON.stringify(userData));
      localStorage.setItem("isVerifying", "true");
      localStorage.setItem("problemData", JSON.stringify(problem));
      
      // Start the OAuth sign-in process
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.href,
          queryParams: {
            prompt: 'select_account',  // Force account selection
            hd: 'goa.bits-pilani.ac.in',  // Restrict to BITS domain
          }
        }
      });

      if (signInError) {
        localStorage.removeItem("isVerifying");
        localStorage.removeItem("cfVerificationData");
        setError("Failed to sign in with Google");
        setIsLoading(false);
      }
      
      // The rest happens after redirect - see useEffect 
      
    } catch (err) {
      console.error(err);
      localStorage.removeItem("isVerifying");
      localStorage.removeItem("cfVerificationData");
      setError("Invalid Request");
      setIsLoading(false);
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
      <div style={{zIndex: 1000}}>
        <NavBar toggleTheme={toggleTheme} fixed={false} />
      </div>

      {/* Hero section with gradient title - adjusted positioning */}
      <div
        className="flex justify-center items-center min-h-screen pt-24 pb-10" // Reduced height and added padding
        style={{ transform: `translate(${transform.x}px, ${transform.y}px)` }}
      >
        <div className="text-center">
          <Image 
            src="/logos/cflogo.png" 
            alt="Connect Codeforces" 
            className="w-[10rem] mx-auto mt-[-10rem]"
            width={300}
            height={300}
          />
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
                        className="bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 rounded-xl"
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
                        className="bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 rounded-xl"
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
                        className="bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 rounded-xl"
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
                      onClick={handleGoogleSignInAndVerify}
                      disabled={isLoading}
                      className="w-full mt-6 bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-500 dark:to-red-500 hover:from-orange-700 hover:to-red-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-t-white border-white/30 rounded-full animate-spin mr-2"></div>
                          Verifying...
                        </div>
                      ) : (
                        "Verify Submission"
                      )}
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