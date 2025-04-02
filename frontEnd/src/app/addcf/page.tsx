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
import { motion, useScroll, useTransform } from "framer-motion";

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
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  // Parallax scroll setup - disable on mobile
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 300], isMobile ? [0, 0] : [0, 80]);
  
  // Adding rotation transforms for SVG backgrounds - reduced effect on mobile
  const rotateLeft = useTransform(scrollY, [0, 1000], isMobile ? [0, -5] : [0, -25]);
  const rotateRight = useTransform(scrollY, [0, 1000], isMobile ? [0, 5] : [0, 25]);

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
    
    // Detect mobile device
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (isMobile) return; // Don't apply mouse movement effect on mobile
      
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
  }, [isMobile]);

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
      
      {/* SVG Background Elements with Parallax Rotation - similar to main page */}
      <div className="fixed inset-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        {/* Top left rotating SVG */}
        <motion.div 
          className={`absolute -top-32 -left-32 w-96 h-96 ${theme === "dark" ? "opacity-15" : "opacity-30"}`}
          style={{ 
            y: bgY,
            rotate: rotateLeft,
            scale: useTransform(scrollY, [0, 500], [1, 1.35])
          }}
        >
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path 
              fill={theme === "dark" ? "#ff4500" : "#ff6347"} 
              d="M38.8,-66.8C51.9,-59.6,65.4,-51.8,71.2,-39.8C77,-27.9,75.1,-12,74.5,4.2C73.9,20.3,74.5,36.8,67.1,48.2C59.6,59.5,44.1,65.8,28.7,71.5C13.3,77.2,-2,82.3,-13.4,76.6C-24.9,70.9,-32.4,54.6,-40.6,42C-48.8,29.4,-57.7,20.5,-62.4,9.4C-67.1,-1.8,-67.5,-15,-64.7,-29.2C-61.9,-43.4,-55.9,-58.7,-44.6,-66.6C-33.3,-74.5,-16.7,-75.1,-1.4,-72.8C13.9,-70.6,27.7,-65.5,38.8,-66.8Z" 
              transform="translate(100 100)" 
            />
          </svg>
        </motion.div>
        
        {/* Bottom right rotating SVG */}
        <motion.div 
          className={`absolute bottom-0 right-0 w-96 h-96 ${theme === "dark" ? "opacity-15" : "opacity-30"}`}
          style={{ 
            y: bgY,
            rotate: rotateRight,
            scale: useTransform(scrollY, [0, 500], [1, 0.85])
          }}
        >
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path 
              fill={theme === "dark" ? "#cc3300" : "#ff5722"} 
              d="M44.1,-70.5C58.4,-62.3,72.1,-51.4,80.2,-36.6C88.3,-21.8,90.8,-3.2,85.8,12.7C80.7,28.5,68.2,41.7,54.3,53.8C40.5,65.9,25.3,77.1,7.3,79.8C-10.6,82.5,-31.5,76.8,-48.2,65.5C-64.9,54.2,-77.4,37.2,-81.7,18.6C-86.1,0,-82.3,-20.3,-72.3,-36.5C-62.2,-52.6,-45.9,-64.7,-29.9,-72.2C-13.9,-79.7,1.9,-82.7,15.7,-78.5C29.5,-74.4,44.1,-70.5,44.1,-70.5Z" 
              transform="translate(100 100) scale(1.05)" 
            />
          </svg>
        </motion.div>
      </div>
      
      {/* Parallax background elements */}
      <motion.div 
        className="absolute inset-0 w-full h-screen pointer-events-none"
        style={{ y: bgY }}
      >
        <div className={`absolute top-20 left-1/4 w-64 h-64 rounded-full ${theme === "dark" ? "bg-orange-500/5" : "bg-orange-500/10"} blur-3xl`}></div>
        <div className={`absolute bottom-32 right-1/4 w-96 h-96 rounded-full ${theme === "dark" ? "bg-red-500/5" : "bg-red-500/10"} blur-3xl`}></div>
      </motion.div>
      
      <div style={{zIndex: 1000}}>
        <NavBar toggleTheme={toggleTheme} fixed={false} />
      </div>

      {/* Hero section with logo and subtitle */}
      <motion.div
        className="flex justify-center items-center min-h-screen pt-24 pb-10"
        style={{ 
          y: useTransform(scrollY, [0, 300], [0, -30]),
          transform: isMobile ? undefined : `translate(${transform.x}px, ${transform.y}px)` 
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <div className="text-center mt-[-10rem]">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Image 
              src="/logos/cflogo.png" 
              alt="Connect Codeforces" 
              className="w-[12rem] mx-auto"
              width={300}
              height={300}
              priority
            />
          </motion.div>
          <motion.p 
            className={`mt-6 text-xl ${theme === "dark" ? "text-gray-300" : "text-gray-600"} max-w-2xl mx-auto px-5`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Submit a compile error to verify your Codeforces handle
          </motion.p>
        </div>
      </motion.div>
      
      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 pb-20">
        <motion.div 
          className={`${theme === "dark" ? "bg-[rgba(255, 255, 255, 0.05]" : "bg-blue-50/90"} backdrop-blur-[12px] rounded-xl shadow-sm ${theme === "dark" ? "border-white/10" : "border-blue-200/50"} border p-8 transition-all duration-300 hover:shadow-lg mb-8`}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h3 className={`text-2xl font-bold ${theme === "dark" ? "text-gray-100" : "text-gray-800"} mb-4 border-l-4 ${theme === "dark" ? "border-red-500" : "border-orange-500"} pl-3`}>
                  Your Information
                </h3>
                
                <div className={`${theme === "dark" ? "bg-[rgba(255, 255, 255, 0.05]" : "bg-white/80"} backdrop-blur-[12px] ${theme === "dark" ? "border-gray-700/40" : "border-gray-100"} border p-6 rounded-lg shadow-sm`}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bitsId" className={`${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>BITS ID</Label>
                      <Input
                        id="bitsId"
                        name="bitsId"
                        value={userData.bitsId}
                        onChange={handleInputChange}
                        placeholder="Your Bits ID (in Caps)"
                        className={`${theme === "dark" ? "bg-gray-800/60" : "bg-gray-50"} ${theme === "dark" ? "border-gray-700" : "border-gray-200"} rounded-xl`}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="name" className={`${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={userData.name}
                        onChange={handleInputChange}
                        placeholder="Your Name"
                        className={`${theme === "dark" ? "bg-gray-800/60" : "bg-gray-50"} ${theme === "dark" ? "border-gray-700" : "border-gray-200"} rounded-xl`}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="handle" className={`${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>Codeforces Handle</Label>
                      <Input
                        id="handle"
                        name="handle"
                        value={userData.handle}
                        onChange={handleInputChange}
                        placeholder="Your Codeforces Handle"
                        className={`${theme === "dark" ? "bg-gray-800/60" : "bg-gray-50"} ${theme === "dark" ? "border-gray-700" : "border-gray-200"} rounded-xl`}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h3 className={`text-2xl font-bold ${theme === "dark" ? "text-gray-100" : "text-gray-800"} mb-4 border-l-4 ${theme === "dark" ? "border-red-500" : "border-orange-500"} pl-3`}>
                  Verification Challenge
                </h3>
                
                {problem ? (
                  <div className={`${theme === "dark" ? "bg-white/5" : "bg-white/80"} backdrop-blur-[12px] ${theme === "dark" ? "border-gray-700/40" : "border-gray-100"} border p-6 rounded-lg shadow-sm flex flex-col justify-between h-auto transform hover:scale-[1.01] transition-all duration-300`}>
                    <div className="space-y-4">
                      <div className={`flex items-center justify-center p-4 ${theme === "dark" ? "bg-red-900/30" : "bg-orange-100"} rounded-full w-16 h-16 mx-auto mb-4`}>
                        <Code className={`w-8 h-8 ${theme === "dark" ? "text-red-400" : "text-orange-600"}`} />
                      </div>
                      
                      <h2 className={`text-xl font-bold text-center ${theme === "dark" ? "text-gray-200" : "text-gray-800"}`}>
                        Submit a Compile Error
                      </h2>
                      
                      <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-600"} text-center`}>
                        Submit code with a compile error to the problem below for verification.
                      </p>
                      
                      <div className="mt-4 p-4 rounded-lg text-center">
                        <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"} mb-2`}>Problem</p>
                        <a
                          href={`https://codeforces.com/contest/${problem.contestId}/problem/${problem.index}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-xl font-medium ${theme === "dark" ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"} hover:underline transition-colors`}
                        >
                          {problem.contestId}-{problem.index}
                        </a>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleGoogleSignInAndVerify}
                      disabled={isLoading}
                      className={`w-full mt-6 bg-gradient-to-r ${theme === "dark" ? "from-orange-500 to-red-500" : "from-orange-600 to-red-600"} hover:from-orange-700 hover:to-red-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300`}
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
                  <div className={`${theme === "dark" ? "bg-white/5" : "bg-white/80"} backdrop-blur-[12px] ${theme === "dark" ? "border-gray-700/40" : "border-gray-100"} border p-6 rounded-lg shadow-sm flex flex-col items-center justify-center h-auto`}>
                    <div className="animate-pulse flex flex-col items-center">
                      <div className={`h-12 w-12 ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"} rounded-full mb-4`}></div>
                      <div className={`h-4 w-24 ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"} rounded mb-3`}></div>
                      <div className={`h-3 w-32 ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"} rounded`}></div>
                    </div>
                    <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-500"} mt-4`}>Loading problem...</p>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>
        
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Alert variant="destructive" className="animate-fadeIn">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
        
        {/* Instructions card */}
        <motion.div 
          className={`${theme === "dark" ? "bg-white/5" : "bg-white/90"} backdrop-blur-[12px] rounded-xl shadow-sm ${theme === "dark" ? "border-white/10" : "border-gray-100/50"} border p-6`}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className={`text-xl font-bold ${theme === "dark" ? "text-gray-100" : "text-gray-800"} mb-4`}>
            How It Works
          </h3>
          <ol className={`space-y-3 ${theme === "dark" ? "text-gray-300" : "text-gray-600"} list-decimal pl-5`}>
            <li>Fill in your BITS ID, full name, and Codeforces handle</li>
            <li>Click the problem link to visit the Codeforces problem page</li>
            <li>Submit any solution that produces a <strong>compile error</strong> (e.g., write, &quot;Compilation Error&quot;)</li>
            <li>After submitting, return here and click &quot;Verify Submission&quot;</li>
            <li>Once verified, you&apos;ll be redirected to the homepage</li>
          </ol>
        </motion.div>
      </div>

      {/* Footer with animation */}
      <motion.footer 
        className={`mt-12 border-t ${theme === "dark" ? "border-gray-800" : "border-gray-200"} py-8`}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center justify-center md:justify-start">
                <Image
                  src={theme === "dark" ? "/algoLightX.png" : "/algoDarkX.png"}
                  alt="AlgoX"
                  width={120}
                  height={70}
                  className="mb-2"
                />
              </div>
              <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"} text-sm text-center md:text-left`}>
                © {new Date().getFullYear()} Algomaniax. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </motion.footer>

      {/* Animation styles */}
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