// https://codeforces.com/api/problemset.problems -> result -> problems -> Any Random Question -> contestId, index -> codeforces.com/contest/contestId/problem/index
// Send the link to the user, and ask him/her to submit a compile time error
// As soon as he/she does it, ask them to click on another button in the website -> Send the data to the backend url
// If the backend url returns a 200, then the user has successfully submitted the code
// If the backend url returns a 400, then the user has not successfully submitted the code
// If 200 -> redirect back to "/" (home page)
// If 400 -> show an error message to the user
"use client";
import { type NextPage } from "next";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import NavBar from "../components/navBar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
      const response = await fetch(`https://codeforces.com/api/user.status?handle=${userData.handle}`);
      const data = await response.json();

      if (data.status === "OK") {
        const hasCompilationError = data.result.some(
          (submission: { problem: { contestId: number; index: string }; verdict: string }) =>
            submission.problem.contestId === problem?.contestId &&
            submission.problem.index === problem?.index &&
            submission.verdict === "COMPILATION_ERROR"
        );

        if (!hasCompilationError) {
          setError("Please submit a compilation error for the given problem.");
          return;
        }

        const backendResponse = await fetch("https://your-backend-url.com/api/verify-submission", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...userData,
            contestId: problem?.contestId,
            index: problem?.index,
          }),
        });

        if (backendResponse.status === 200) {
          router.push("/");
        } else {
          setError("Submission failed. Please try again.");
        }
      } else {
        setError("Failed to verify submission. Please try again.");
      }
    } catch {
      setError("Failed to verify submission");
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

      <NavBar toggleTheme={toggleTheme} fixed={true} />
      <main className="container mx-auto px-4 pt-20">
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-4xl font-bold text-center mb-8">Codeforces Challenge</h1>
          
          <div className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow" style={{ transform: `translate(${transform.x}px, ${transform.y}px)` }}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="bitsId">BITS ID</Label>
                <Input
                  id="bitsId"
                  name="bitsId"
                  value={userData.bitsId}
                  onChange={handleInputChange}
                  placeholder="2021A7PS0001P"
                />
              </div>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={userData.name}
                  onChange={handleInputChange}
                  placeholder="Your Name"
                />
              </div>
              <div>
                <Label htmlFor="handle">Codeforces Handle</Label>
                <Input
                  id="handle"
                  name="handle"
                  value={userData.handle}
                  onChange={handleInputChange}
                  placeholder="Your Codeforces Handle"
                />
              </div>
            </div>

            {problem && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Submit a Compile Error</h2>
                <p className="text-lg">
                  Please submit a compile error at:{" "}
                  <a
                    href={`https://codeforces.com/contest/${problem.contestId}/problem/${problem.index}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Problem Link
                  </a>
                </p>
                <Button 
                  onClick={handleSubmission}
                  className="w-full"
                >
                  Verify Submission
                </Button>
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </main>
    </div>
  );
};

export default CodeforcesPage;