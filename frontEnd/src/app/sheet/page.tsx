"use client";

import React, { useState, useEffect } from "react";
import NavBar from "../components/navBar";
import { motion, useScroll, useTransform } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import axios from "axios";

interface Question {
  questionName: string;
  questionLink: string;
  questionRating: number;
  questionTags: string[];
  contributor: string;
  topic: string;
}

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isAnimating, setIsAnimating] = useState(false);
  const [overlayColor, setOverlayColor] = useState("#121212");
  const [transform, setTransform] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [questions, setQuestions] = useState<Question[]>(Array.isArray([]) ? [] : []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>(Array.isArray([]) ? [] : []);
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set(["All"]));
  // const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [tagFilterMode, setTagFilterMode] = useState<"AND" | "OR">("OR");
  const [selectedRatings, setSelectedRatings] = useState<Set<number>>(new Set([1300]));
  const [showRatings, setShowRatings] = useState(true);
  const [showTags, setShowTags] = useState(true);
  const [isRandomized, setIsRandomized] = useState(false);

  // Detect mobile device on first render and window resize
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

  // Parallax scroll setup - disable on mobile
  const { scrollY } = useScroll();
  const headerY = useTransform(scrollY, [0, 300], isMobile ? [0, 0] : [0, -40]);
  const headerScale = useTransform(scrollY, [0, 300], isMobile ? [1, 1] : [1, 0.95]);
  const bgY = useTransform(scrollY, [0, 300], isMobile ? [0, 0] : [0, 80]);
  
  // Adding rotation transforms for SVG backgrounds
  const rotateLeft = useTransform(scrollY, [0, 1000], isMobile ? [0, -5] : [0, -25]);
  const rotateRight = useTransform(scrollY, [0, 1000], isMobile ? [0, 5] : [0, 25]);

  // Fetch questions from backend
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const response = await axios.get('https://algoxxx.onrender.com/currentInfo/algosheet');
        setQuestions(response.data);
        setFilteredQuestions(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching questions:', err);
        setError('Failed to fetch questions');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  // Filter questions based on topic, search term, tags, and rating ranges
  useEffect(() => {
    let filtered = questions;

    if (!selectedTopics.has("All") && selectedTopics.size > 0) {
      filtered = filtered.filter(q => selectedTopics.has(q.topic));
    }

    if (selectedTags.size > 0) {
      filtered = filtered.filter(q => {
        if (tagFilterMode === "AND") {
          return Array.from(selectedTags).every(tag => q.questionTags.includes(tag));
        } else {
          return Array.from(selectedTags).some(tag => q.questionTags.includes(tag));
        }
      });
    }

    // Filter by selected ratings
    if (selectedRatings.size > 0) {
      filtered = filtered.filter(q => {
        const roundedRating = Math.floor(q.questionRating / 100) * 100;
        return selectedRatings.has(roundedRating);
      });
    }

    setFilteredQuestions(filtered);
  }, [questions, selectedTopics, selectedTags, tagFilterMode, selectedRatings]);

  // Randomize questions
  const randomizeQuestions = () => {
    const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5);
    setFilteredQuestions(shuffled);
    setIsRandomized(true);
  };

  // Reset to original order
  const resetOrder = () => {
    // Re-apply filters to get original order
    let filtered = questions;

    if (!selectedTopics.has("All") && selectedTopics.size > 0) {
      filtered = filtered.filter(q => selectedTopics.has(q.topic));
    }


    if (selectedTags.size > 0) {
      filtered = filtered.filter(q => {
        if (tagFilterMode === "AND") {
          return Array.from(selectedTags).every(tag => q.questionTags.includes(tag));
        } else {
          return Array.from(selectedTags).some(tag => q.questionTags.includes(tag));
        }
      });
    }

    if (selectedRatings.size > 0) {
      filtered = filtered.filter(q => {
        const roundedRating = Math.floor(q.questionRating / 100) * 100;
        return selectedRatings.has(roundedRating);
      });
    }

    setFilteredQuestions(filtered);
    setIsRandomized(false);
  };

  const uniqueTopics = ["All", ...Array.from(new Set(Array.isArray(questions) ? questions.map(q => q.topic) : []))];
  const uniqueTags = Array.from(new Set(Array.isArray(questions) ? questions.flatMap(q => q.questionTags) : [])).sort();
  const ratings = Array.from({ length: 21 }, (_, i) => 800 + i * 100); // 800, 900, ..., 2800


  const toggleTopic = (topic: string) => {
    const newSelectedTopics = new Set(selectedTopics);
    if (topic === "All") {
      setSelectedTopics(new Set(["All"]));
    } else {
      newSelectedTopics.delete("All");
      if (newSelectedTopics.has(topic)) {
        newSelectedTopics.delete(topic);
        if (newSelectedTopics.size === 0) {
          newSelectedTopics.add("All");
        }
      } else {
        newSelectedTopics.add(topic);
      }
      setSelectedTopics(newSelectedTopics);
    }
  };

  const toggleTag = (tag: string) => {
    const newSelectedTags = new Set(selectedTags);
    if (newSelectedTags.has(tag)) {
      newSelectedTags.delete(tag);
    } else {
      newSelectedTags.add(tag);
    }
    setSelectedTags(newSelectedTags);
  };

  const toggleRating = (rating: number) => {
    const newSelectedRatings = new Set(selectedRatings);
    if (newSelectedRatings.has(rating)) {
      newSelectedRatings.delete(rating);
    } else {
      newSelectedRatings.add(rating);
    }
    setSelectedRatings(newSelectedRatings);
  };


  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme as "light" | "dark");
    document.documentElement.classList.toggle("dark", storedTheme === "dark");
    document.body.classList.toggle("dark", storedTheme === "dark");
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


  return (
    <div className={`relative overflow-hidden ${theme === "dark" ? "dark" : ""}`}>
      {isAnimating && (
        <div
          className="fixed inset-0 z-50 transition-transform duration-[1000ms] ease-[cubic-bezier(0.4, 0, 0.2, 1)] transform translate-x-0 animate-slide"
          style={{ backgroundColor: overlayColor }}
        ></div>
      )}

      <NavBar toggleTheme={toggleTheme} fixed={false} />
      
      {/* SVG Background Elements with Parallax Rotation - matching orange/red scheme */}
      <div className="fixed inset-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        {/* Top right rotating SVG */}
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
        
        {/* Bottom left rotating SVG */}
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
      
      {/* Parallax background elements - with orange/red color scheme */}
      <motion.div 
        className="absolute inset-0 w-full h-screen pointer-events-none"
        style={{ y: bgY }}
      >
        <div className={`absolute top-20 left-1/4 ${isMobile ? 'w-48 h-48' : 'w-64 h-64'} rounded-full bg-orange-500/10 dark:bg-orange-500/5 blur-3xl`}></div>
        <div className={`absolute bottom-32 right-1/4 ${isMobile ? 'w-64 h-64' : 'w-96 h-96'} rounded-full bg-red-500/10 dark:bg-red-500/5 blur-3xl`}></div>
      </motion.div>
      
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
            the SHEET
          </motion.h1>
          <motion.p 
            className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-5 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Curated collection of algorithmic problems
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="space-y-4">

            {/* Topics Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 w-20 flex-shrink-0">Topics:</h3>
              <div className="flex flex-wrap gap-2">
                {uniqueTopics.map(topic => (
                  <button
                    key={topic}
                    onClick={() => toggleTopic(topic)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-all duration-200 ${
                      selectedTopics.has(topic)
                        ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-orange-400 dark:hover:border-orange-400"
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-4 w-20 flex-shrink-0">
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Tags:</h3>
              </div>
              <div className="flex flex-wrap gap-2 flex-grow">
                {uniqueTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-all duration-200 ${
                      selectedTags.has(tag)
                        ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-orange-400 dark:hover:border-orange-400"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              {selectedTags.size > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex border border-gray-300 dark:border-gray-600 rounded-full overflow-hidden">
                    <button onClick={() => setTagFilterMode("OR")} className={`px-2 py-0.5 text-xs font-medium transition-colors ${tagFilterMode === "OR" ? "bg-orange-500 text-white" : "bg-transparent text-gray-600 dark:text-gray-400"}`}>Any</button>
                    <button onClick={() => setTagFilterMode("AND")} className={`px-2 py-0.5 text-xs font-medium transition-colors ${tagFilterMode === "AND" ? "bg-orange-500 text-white" : "bg-transparent text-gray-600 dark:text-gray-400"}`}>All</button>
                  </div>
                  <button onClick={() => setSelectedTags(new Set())} className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">Clear</button>
                </div>
              )}
            </div>

            {/* Ratings Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 w-20 flex-shrink-0">Ratings:</h3>
              <div className="flex flex-wrap gap-2">
                {ratings.map(rating => (
                  <button
                    key={rating}
                    onClick={() => toggleRating(rating)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-all duration-200 ${
                      selectedRatings.has(rating)
                        ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-orange-400 dark:hover:border-orange-400"
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Actions and Toggles */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={isRandomized ? resetOrder : randomizeQuestions}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-full font-medium transition-colors duration-200 shadow-sm hover:shadow-md text-sm"
                >
                  {isRandomized ? "Reset Order" : "Randomize"}
                </button>
                <a
                  href="/suggest"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-medium transition-colors duration-200 shadow-sm hover:shadow-md text-sm"
                >
                  + Suggest Qs
                </a>
                <div className="flex items-center gap-6">
                   <div className="flex items-center space-x-2">
                     <Switch id="show-ratings" checked={showRatings} onCheckedChange={setShowRatings} />
                     <label htmlFor="show-ratings" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">Show Ratings</label>
                   </div>
                   <div className="flex items-center space-x-2">
                     <Switch id="show-tags" checked={showTags} onCheckedChange={setShowTags} />
                     <label htmlFor="show-tags" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">Show Tags</label>
                   </div>
                 </div>
            </div>
          </div>
        </div>
      </div>

      {/* Questions Grid */}
      <div className="max-w-7xl mx-auto px-4 mb-12">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47.881-6.063 2.33C8.134 19.729 9.86 21 12 21c2.139 0 3.866-1.271 6.063-3.67z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No questions found</h3>
            <p className="text-gray-500 dark:text-gray-400">Try adjusting your search criteria or filters</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Found {filteredQuestions.length} question{filteredQuestions.length !== 1 ? 's' : ''}
              </h2>
            </div>

            {/* Questions Grid */}
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
              {filteredQuestions.map((question, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow duration-200">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <a
                        href={question.questionLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-semibold hover:underline transition-colors text-lg block mb-2"
                      >
                        {question.questionName}
                      </a>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {question.contributor}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {question.topic}
                        </span>
                        {showTags && (
                          <div className="flex flex-wrap gap-1">
                            {question.questionTags.slice(0, 3).map((tag, tagIndex) => (
                              <span key={tagIndex} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                                {tag}
                              </span>
                            ))}
                            {question.questionTags.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                                +{question.questionTags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {showRatings && (
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-full ${
                          question.questionRating >= 2400
                            ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                            : question.questionRating >= 2000 
                            ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                            : question.questionRating >= 1600
                            ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                            : question.questionRating >= 1200
                            ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                            : question.questionRating >= 800
                            ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                        }`}>
                          {question.questionRating}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>


      
      {/* Footer matching homepage style */}
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
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}