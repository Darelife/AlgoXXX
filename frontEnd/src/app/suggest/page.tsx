"use client";

import React, { useState, useEffect } from "react";
import NavBar from "../components/navBar";
import { motion, useScroll, useTransform } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Question {
  questionName: string;
  questionLink: string;
  questionRating: number;
  questionTags: string;
  topic: string;
}

interface SuggestedQuestion {
  id: number;
  questionName: string;
  questionLink: string;
  questionRating: number;
  questionTags: string[] | string;
  topic: string;
  approvals: number;
}

export default function SuggestPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isAnimating, setIsAnimating] = useState(false);
  const [overlayColor, setOverlayColor] = useState("#121212");
  const [transform, setTransform] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [approvingQuestion, setApprovingQuestion] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set());
  
  const [questions, setQuestions] = useState<Question[]>([
    {
      questionName: "",
      questionLink: "",
      questionRating: 0,
      questionTags: "",
      topic: ""
    }
  ]);

  const router = useRouter();

  // Parallax scroll setup
  const { scrollY } = useScroll();
  const headerY = useTransform(scrollY, [0, 300], isMobile ? [0, 0] : [0, -40]);
  const headerScale = useTransform(scrollY, [0, 300], isMobile ? [1, 1] : [1, 0.95]);
  const bgY = useTransform(scrollY, [0, 300], isMobile ? [0, 0] : [0, 80]);
  const rotateLeft = useTransform(scrollY, [0, 1000], isMobile ? [0, -5] : [0, -25]);
  const rotateRight = useTransform(scrollY, [0, 1000], isMobile ? [0, 5] : [0, 25]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme as "light" | "dark");
    document.documentElement.classList.toggle("dark", storedTheme === "dark");
    document.body.classList.toggle("dark", storedTheme === "dark");
  }, []);

  useEffect(() => {
    // Fetch suggested questions on component mount
    fetchSuggestedQuestions();
  }, []);

  const verifyBitsEmail = (email: string) => {
    return email.toLowerCase().endsWith('@goa.bits-pilani.ac.in');
  };

  // Function to fetch suggested questions
  const fetchSuggestedQuestions = async () => {
    try {
      setLoadingSuggestions(true);
      const response = await axios.get('http://localhost:5000/currentInfo/algosheetreq');
      
      if (response.status === 200) {
        setSuggestedQuestions(response.data);
      }
    } catch (err) {
      console.error("Error fetching suggested questions:", err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Function to handle single question approval
  const handleApproveQuestion = async (questionId: number) => {
    if (!userEmail) {
      // User needs to sign in first
      try {
        setApprovingQuestion(questionId);
        
        const { error: signInError } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: window.location.href,
            queryParams: {
              prompt: 'select_account',
              hd: 'goa.bits-pilani.ac.in',
            }
          }
        });

        if (signInError) {
          setError("Failed to sign in with Google");
          setApprovingQuestion(null);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to sign in");
        setApprovingQuestion(null);
      }
      return;
    }

    // User is signed in, proceed with approval
    try {
      setApprovingQuestion(questionId);
      
          const response = await axios.post('http://localhost:5000/currentInfo/algosheetreq/approve', {
            questionId: questionId,
            voterEmail: userEmail
          });      if (response.status === 200) {
        if (response.data.approvedAndMoved) {
          setSuccess(`Question approved and moved to the main sheet!`);
        } else {
          setSuccess(`Question approved! (${response.data.approvals}/5 approvals)`);
        }
        // Refresh the suggestions list
        fetchSuggestedQuestions();
      }
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'response' in err 
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error || "Failed to approve question"
        : "Failed to approve question";
      setError(errorMessage);
    } finally {
      setApprovingQuestion(null);
    }
  };

  // Function to handle bulk approval
  const handleBulkApproval = React.useCallback(async () => {
    if (selectedQuestions.size === 0) {
      setError("Please select questions to approve");
      return;
    }

    if (!userEmail) {
      // User needs to sign in first
      try {
        localStorage.setItem("pendingApprovals", JSON.stringify(Array.from(selectedQuestions)));
        
        const { error: signInError } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: window.location.href,
            queryParams: {
              prompt: 'select_account',
              hd: 'goa.bits-pilani.ac.in',
            }
          }
        });

        if (signInError) {
          setError("Failed to sign in with Google");
          localStorage.removeItem("pendingApprovals");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to sign in");
        localStorage.removeItem("pendingApprovals");
      }
      return;
    }

    // User is signed in, proceed with bulk approval
    try {
      const questionIds = Array.from(selectedQuestions);
      let approvedCount = 0;
      let movedCount = 0;

      for (const questionId of questionIds) {
        try {
          const response = await axios.post('http://localhost:5000/currentInfo/algosheetreq/approve', {
            questionId: questionId,
            voterEmail: userEmail
          });

          if (response.status === 200) {
            approvedCount++;
            if (response.data.approvedAndMoved) {
              movedCount++;
            }
          }
        } catch (err) {
          console.error(`Error approving question ${questionId}:`, err);
        }
      }

      if (approvedCount > 0) {
        let message = `Successfully approved ${approvedCount} question(s)`;
        if (movedCount > 0) {
          message += `, ${movedCount} moved to main sheet`;
        }
        setSuccess(message);
        setSelectedQuestions(new Set());
        fetchSuggestedQuestions();
      } else {
        setError("Failed to approve any questions");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to approve questions");
    }
  }, [selectedQuestions, userEmail]);

  const submitQuestions = React.useCallback(async (questionsData: Question[], email: string) => {
    console.log("submitQuestions called with:", { questionsData, email });
    
    try {
      if (!verifyBitsEmail(email)) {
        await supabase.auth.signOut();
        setError("Only @goa.bits-pilani.ac.in emails are allowed");
        localStorage.removeItem("isSubmittingQuestions");
        localStorage.removeItem("pendingQuestions");
        setIsLoading(false);
        return;
      }

      // Extract name from email (before @)
      const contributor = email.split('@')[0];
      console.log("Contributor:", contributor);

      const requestData = {
        questions: questionsData,
        contributor: contributor
      };
      console.log("Sending request:", requestData);

      const response = await axios.post('http://localhost:5000/currentInfo/algosheetreq', requestData);
      
      console.log("Response:", response.data);

      if (response.status === 201) {
        setSuccess(`Successfully submitted ${questionsData.length} question(s)!`);
        setQuestions([{
          questionName: "",
          questionLink: "",
          questionRating: 0,
          questionTags: "",
          topic: ""
        }]);
        localStorage.removeItem("pendingQuestions");
        localStorage.removeItem("isSubmittingQuestions");
        
        // Refresh the suggested questions list
        fetchSuggestedQuestions();
        
        // Redirect to sheet page after 2 seconds
        setTimeout(() => {
          router.push("/sheet");
        }, 2000);
      }
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err && typeof err === 'object' && 'response' in err 
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error || "Failed to submit questions"
        : "Failed to submit questions";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      localStorage.removeItem("isSubmittingQuestions");
    }
  }, [router]);

  useEffect(() => {
    // Check for auth session and stored data on mount
    const checkSession = async () => {
      console.log("checkSession called");
      const storedQuestions = localStorage.getItem("pendingQuestions");
      const isSubmitting = localStorage.getItem("isSubmittingQuestions");
      const pendingApprovals = localStorage.getItem("pendingApprovals");
      console.log("Stored data:", { storedQuestions, isSubmitting, pendingApprovals });
      
      // Check for current user session
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user?.email) {
        setUserEmail(sessionData.session.user.email);
        
        // Handle pending question submissions
        if (storedQuestions && isSubmitting === "true") {
          try {
            const questionsData = JSON.parse(storedQuestions);
            console.log("Parsed questions:", questionsData);
            setQuestions(questionsData);
            console.log("User email found:", sessionData.session.user.email);
            setIsLoading(true);
            await submitQuestions(questionsData, sessionData.session.user.email);
          } catch (error) {
            console.error("Error parsing stored questions:", error);
          }
        }
        
        // Handle pending approvals
        if (pendingApprovals) {
          try {
            const questionIds = JSON.parse(pendingApprovals);
            setSelectedQuestions(new Set(questionIds));
            localStorage.removeItem("pendingApprovals");
            // Auto-trigger bulk approval
            setTimeout(() => handleBulkApproval(), 1000);
          } catch (error) {
            console.error("Error parsing pending approvals:", error);
            localStorage.removeItem("pendingApprovals");
          }
        }
      } else {
        setUserEmail("");
      }
    };
    
    checkSession();
  }, [submitQuestions, handleBulkApproval]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (isMobile) return;
      
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

  const addQuestion = () => {
    setQuestions([...questions, {
      questionName: "",
      questionLink: "",
      questionRating: 0,
      questionTags: "",
      topic: ""
    }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, field: keyof Question, value: string | number) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const validateQuestions = () => {
    for (const question of questions) {
      if (!question.questionName.trim() || 
          !question.questionLink.trim() || 
          !question.topic.trim() ||
          question.questionRating <= 0) {
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!validateQuestions()) {
      setError("Please fill in all required fields for each question");
      return;
    }

    try {
      setIsLoading(true);
      
      // Store questions for when we return from Google OAuth
      localStorage.setItem("pendingQuestions", JSON.stringify(questions));
      localStorage.setItem("isSubmittingQuestions", "true");
      
      // Start the OAuth sign-in process
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.href,
          queryParams: {
            prompt: 'select_account',
            hd: 'goa.bits-pilani.ac.in',
          }
        }
      });

      if (signInError) {
        localStorage.removeItem("isSubmittingQuestions");
        localStorage.removeItem("pendingQuestions");
        setError("Failed to sign in with Google");
        setIsLoading(false);
      }
    } catch (err) {
      console.error(err);
      localStorage.removeItem("isSubmittingQuestions");
      localStorage.removeItem("pendingQuestions");
      setError("Failed to submit questions");
      setIsLoading(false);
    }
  };

  const topicOptions = ["DSA", "Quant", "Brain Teasers", "Math", "Algorithms", "Data Structures", "Other"];

  return (
    <div className={`relative overflow-hidden ${theme === "dark" ? "dark" : ""}`}>
      {isAnimating && (
        <div
          className="fixed inset-0 z-50 transition-transform duration-[1000ms] ease-[cubic-bezier(0.4, 0, 0.2, 1)] transform translate-x-0 animate-slide"
          style={{ backgroundColor: overlayColor }}
        ></div>
      )}

      {/* SVG Background Elements */}
      <div className="fixed inset-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <motion.div 
          className={`absolute -top-20 right-0 ${isMobile ? 'w-64 h-64' : 'w-80 h-80'} opacity-30 dark:opacity-15`}
          style={{ 
            y: bgY,
            rotate: rotateRight,
            willChange: "transform"
          }}
        >
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path 
              fill={theme === "dark" ? "#ff6b35" : "#ff8c4a"}
              d="M66.4,-69.5C85.2,-55.6,99.7,-31.8,103.3,-6.5C106.9,18.8,99.5,45.5,82.2,61.2C64.9,76.9,37.8,81.5,14.5,77.9C-8.8,74.3,-28.3,62.4,-44.4,47.5C-60.5,32.6,-73.2,14.7,-75.2,-5.3C-77.2,-25.3,-68.3,-47.5,-52.9,-61.2C-37.4,-75,-18.7,-80.5,2.9,-83.9C24.5,-87.3,48.9,-88.7,66.4,-69.5Z" 
              transform="translate(100 100)" 
            />
          </svg>
        </motion.div>
        
        <motion.div 
          className={`absolute bottom-0 -left-20 ${isMobile ? 'w-64 h-64' : 'w-72 h-72'} opacity-30 dark:opacity-15`}
          style={{ 
            y: bgY,
            rotate: rotateLeft,
            willChange: "transform"
          }}
        >
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path 
              fill={theme === "dark" ? "#ff4500" : "#ff6347"}
              d="M62.6,-37.8C76.4,-17.5,79.8,11.7,69.7,33.8C59.6,55.9,36.1,70.9,11.5,73.4C-13,75.9,-38.7,65.8,-54.3,47.1C-70,28.3,-75.7,0.8,-68,-20.9C-60.3,-42.6,-39.3,-58.4,-17.7,-65C3.9,-71.6,27.1,-69,62.6,-37.8Z" 
              transform="translate(100 100)" 
            />
          </svg>
        </motion.div>
      </div>
      
      <motion.div 
        className="absolute inset-0 w-full h-screen pointer-events-none"
        style={{ y: bgY }}
      >
        <div className={`absolute top-20 left-1/4 ${isMobile ? 'w-48 h-48' : 'w-64 h-64'} rounded-full bg-orange-500/10 dark:bg-orange-500/5 blur-3xl`}></div>
        <div className={`absolute bottom-32 right-1/4 ${isMobile ? 'w-64 h-64' : 'w-96 h-96'} rounded-full bg-red-500/10 dark:bg-red-500/5 blur-3xl`}></div>
      </motion.div>
      
      <NavBar toggleTheme={toggleTheme} fixed={false} />
      
      <motion.div
        className="relative flex justify-center items-center min-h-screen mb-8"
        style={{ 
          transform: isMobile ? 'none' : `translate(${transform.x}px, ${transform.y}px)`,
          willChange: isMobile ? 'auto' : 'transform'
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="flex flex-col items-center"
          style={{ 
            y: headerY,
            scale: headerScale
          }}
        >
          <motion.h1 
            className="md:text-8xl text-5xl font-sans font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 mt-[-10rem]"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            SUGGEST
          </motion.h1>
          <motion.p 
            className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-5 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Suggest questions for the AlgoManiax sheet
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 mb-12">
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <AlertDescription className="text-red-800 dark:text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
            <AlertDescription className="text-green-800 dark:text-green-400">{success}</AlertDescription>
          </Alert>
        )}

        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-8">
          <div className="space-y-8">
            {questions.map((question, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-6 bg-gray-50/50 dark:bg-gray-700/30"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Question {index + 1}
                  </h3>
                  {questions.length > 1 && (
                    <Button
                      onClick={() => removeQuestion(index)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`questionName-${index}`}>Question Name *</Label>
                    <Input
                      id={`questionName-${index}`}
                      value={question.questionName}
                      onChange={(e) => updateQuestion(index, 'questionName', e.target.value)}
                      placeholder="Enter question name"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`questionLink-${index}`}>Question Link *</Label>
                    <Input
                      id={`questionLink-${index}`}
                      value={question.questionLink}
                      onChange={(e) => updateQuestion(index, 'questionLink', e.target.value)}
                      placeholder="https://..."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`questionRating-${index}`}>Difficulty Rating *</Label>
                    <Input
                      id={`questionRating-${index}`}
                      type="number"
                      value={question.questionRating || ''}
                      onChange={(e) => updateQuestion(index, 'questionRating', parseInt(e.target.value) || 0)}
                      placeholder="1000"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`topic-${index}`}>Topic *</Label>
                    <select
                      id={`topic-${index}`}
                      value={question.topic}
                      onChange={(e) => updateQuestion(index, 'topic', e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Select topic</option>
                      {topicOptions.map(topic => (
                        <option key={topic} value={topic}>{topic}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor={`questionTags-${index}`}>Tags (comma-separated)</Label>
                    <Input
                      id={`questionTags-${index}`}
                      value={question.questionTags}
                      onChange={(e) => updateQuestion(index, 'questionTags', e.target.value)}
                      placeholder="array, sorting, binary-search"
                      className="mt-1"
                    />
                  </div>
                </div>
              </motion.div>
            ))}

            <div className="flex justify-between items-center">
              <Button
                onClick={addQuestion}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Another Question
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-t-white border-white/30 rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Submit Questions
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50/90 dark:bg-blue-900/20 backdrop-blur-sm rounded-xl border border-blue-200/50 dark:border-blue-800/50 p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-4">
            Instructions
          </h3>
          <ul className="space-y-2 text-blue-800 dark:text-blue-400 text-sm">
            <li>• Fill in all required fields marked with asterisk (*)</li>
            <li>• Add as many questions as you&apos;d like before submitting</li>
            <li>• You&apos;ll need to sign in with your @goa.bits-pilani.ac.in email</li>
            <li>• Your email username will be used as the contributor name</li>
            <li>• Questions will be reviewed before being added to the main sheet</li>
          </ul>
        </div>

        {/* Previously Suggested Questions */}
        <div className="mt-8 bg-green-50/90 dark:bg-green-900/20 backdrop-blur-sm rounded-xl border border-green-200/50 dark:border-green-800/50 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-300">
              Previously Suggested Questions
            </h3>
            {selectedQuestions.size > 0 && (
              <div className="flex gap-2">
                <Button
                  onClick={handleBulkApproval}
                  className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2"
                >
                  Approve Selected ({selectedQuestions.size})
                </Button>
                <Button
                  onClick={() => setSelectedQuestions(new Set())}
                  variant="outline"
                  className="text-sm px-4 py-2"
                >
                  Clear Selection
                </Button>
              </div>
            )}
          </div>
          
          {loadingSuggestions ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-t-green-600 border-green-300 rounded-full animate-spin"></div>
              <span className="ml-2 text-green-800 dark:text-green-400">Loading suggestions...</span>
            </div>
          ) : suggestedQuestions.length === 0 ? (
            <p className="text-green-800 dark:text-green-400 text-center py-4">
              No questions have been suggested yet. Be the first to contribute!
            </p>
          ) : (
            <div className="space-y-4">
              {suggestedQuestions.map((question, index) => (
                <div
                  key={question.id || index}
                  className="bg-white/50 dark:bg-gray-800/30 border border-green-200 dark:border-green-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedQuestions.has(question.id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedQuestions);
                          if (e.target.checked) {
                            newSelected.add(question.id);
                          } else {
                            newSelected.delete(question.id);
                          }
                          setSelectedQuestions(newSelected);
                        }}
                        className="w-4 h-4 text-green-600 border-green-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm font-medium text-green-800 dark:text-green-300">
                        Approvals: {question.approvals}/5
                      </span>
                    </div>
                    <Button
                      onClick={() => handleApproveQuestion(question.id)}
                      disabled={approvingQuestion === question.id}
                      className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1"
                    >
                      {approvingQuestion === question.id ? (
                        <>
                          <div className="w-3 h-3 border border-t-white border-white/30 rounded-full animate-spin mr-1"></div>
                          Approving...
                        </>
                      ) : (
                        "👍 Approve"
                      )}
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <h4 className="font-medium text-green-900 dark:text-green-300 mb-1">
                        Question Name
                      </h4>
                      <a
                        href={question.questionLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                      >
                        {question.questionName}
                      </a>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-green-900 dark:text-green-300 mb-1">
                        Difficulty
                      </h4>
                      <span className="text-green-800 dark:text-green-400 text-sm">
                        {question.questionRating}
                      </span>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-green-900 dark:text-green-300 mb-1">
                        Topic
                      </h4>
                      <span className="text-green-800 dark:text-green-400 text-sm">
                        {question.topic}
                      </span>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-green-900 dark:text-green-300 mb-1">
                        Tags
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(question.questionTags) 
                          ? question.questionTags 
                          : question.questionTags.split(',').map(tag => tag.trim())
                        ).map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs px-2 py-1 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <motion.footer 
        className="mt-12 border-t border-gray-200 dark:border-gray-800 py-8"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <p className="text-gray-600 dark:text-gray-400 text-sm text-center md:text-left">
                © {new Date().getFullYear()} Algomaniax. All rights reserved.
              </p>
            </div>
            
            <div className="flex space-x-6 md:space-x-8">
              <motion.a 
                href="/about" 
                className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-red-400 transition-colors"
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                About
              </motion.a>
              <motion.a 
                href="/leaderboard" 
                className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-red-400 transition-colors"
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                Leaderboard
              </motion.a>
              <motion.a 
                href="/sheet" 
                className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-red-400 transition-colors"
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                Sheet
              </motion.a>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
