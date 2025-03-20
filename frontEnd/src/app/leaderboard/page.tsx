"use client";

// import { useMemo } from "react";
// import { useRef } from "react";
import { Slider } from "@mui/material";
import { ArrowUpDown, Search } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import axios from 'axios';
// import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { debounce } from 'lodash';
// import { useMemo } from "react";
// import { Label } from '@/components/ui/label';

// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
import UserCard from '../components/UserCard';
import NavBar from '../components/navBar';

interface User {
  bitsid: string;
  cfid: string;
  name: string;
  rating: number;
  maxRating: number;
  titlePhoto: string;
}

const SampleTable: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cfHandleSearch, setCfHandleSearch] = useState('');
  // const [ratingRange, setRatingRange] = useState<[number, number]>([0, 4000]);
  const [sliderValue, setSliderValue] = useState<number[]>([0, 4000]); // For visual updates
  const [ratingRange, setRatingRange] = useState<[number, number]>([0, 4000]); // For state updates
  // const sliderTimeout = useRef<NodeJS.Timeout | null>(null);
  const [selectedYear] = useState('');
  const [sortBy, setSortBy] = useState<keyof User>('rating');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  // const [selectedRank, setSelectedRank] = useState('all');
  // const [minRating, setMinRating] = useState(0);
  // const [maxRating, setMaxRating] = useState(3500);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [theme, setTheme] = useState("light");
  const [isAnimating, setIsAnimating] = useState(false); // Controls sheet visibility
  const [overlayColor, setOverlayColor] = useState("#121212"); // Default dark theme overlay
  const [userRankMap, setUserRankMap] = useState<{[key: string]: number}>({});
  const [contestDeltaMap, setContestDeltaMap] = useState<{[key: string]: string}>({});


  // Load the initial theme from localStorage
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme);
    document.documentElement.classList.toggle("dark", storedTheme === "dark");
    document.body.classList.toggle("dark", storedTheme === "dark");
  }, []);

 // Update your toggleTheme function with this elegant implementation:
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    // First slider uses current theme color
    const currentColor = theme === "light" ? "#ffffff" : "#121212";
    // Second slider uses new theme color
    const newColor = newTheme === "light" ? "#ffffff" : "#121212";
    
    setOverlayColor(currentColor); // Set color for first slider
    setIsAnimating(true); // Start the first animation

    // Create the second overlay with new theme color
    const secondOverlay = document.createElement('div');
    secondOverlay.className = "fixed inset-0 z-50";
    secondOverlay.style.backgroundColor = newColor;
    secondOverlay.style.transform = "translateX(-130%)"; // Start further off-screen (wider)
    secondOverlay.style.transition = "transform 950ms cubic-bezier(0.6, 0, 0.4, 1)"; // Slightly faster and different easing
    
    // Add transitionend listener to remove element when animation completes
    secondOverlay.addEventListener('transitionend', function onTransitionEnd() {
      // Only remove when it's moving out (not when it reaches center)
      if (secondOverlay.style.transform === "translateX(130%)") {
        document.body.removeChild(secondOverlay);
        secondOverlay.removeEventListener('transitionend', onTransitionEnd);
      }
    });
    
    document.body.appendChild(secondOverlay);

    // Start moving the second overlay with perfect timing
    setTimeout(() => {
      secondOverlay.style.transform = "translateX(0)";
      
      // Change theme exactly when second overlay covers the screen
      setTimeout(() => {
        setTheme(newTheme);
        document.documentElement.classList.toggle("dark", newTheme === "dark");
        document.body.classList.toggle("dark", newTheme === "dark");
        localStorage.setItem("theme", newTheme);
      }, 475); // Half of the second slider's animation time
      
      // Continue sliding the second overlay out
      setTimeout(() => {
        secondOverlay.style.transform = "translateX(130%)"; // Move further right (wider)
      }, 1500); // Start moving out right after theme change
    }, 400); // Start when first animation is at 40%

    // End the first animation
    setTimeout(() => {
      setIsAnimating(false);
    }, 1500);
  };

  // Add this right after you fetch users and before setting the state

useEffect(() => {
  async function fetchUsers() {
    try {
      const response = await axios.get('https://algoxxx.onrender.com/currentinfo/all', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = response.data;
      const sanitizedData = data.map((user: User) => ({
        ...user,
        titlePhoto: user.titlePhoto === 'N/A' ? 'https://userpic.codeforces.org/no-title.jpg' : user.titlePhoto,
      }));
      
      // Create a ranking map that handles ties properly
      const rankMap: {[key: string]: number} = {};
      
      // First, sort all users by rating in descending order
      const ratingOrdered = [...sanitizedData].sort((a, b) => b.rating - a.rating);
      
      // Then assign ranks with proper handling of ties
      let currentRank = 1;
      let currentRating = ratingOrdered[0]?.rating || 0;
      let sameRatingCount = 0;
      
      ratingOrdered.forEach((user) => {
        // If this user has a different rating than previous user
        if (user.rating !== currentRating) {
          // Skip ranks for all the tied users we've seen
          currentRank += sameRatingCount;
          currentRating = user.rating;
          sameRatingCount = 0;
        }
        
        // Assign current rank to this user
        rankMap[user.bitsid] = currentRank;
        sameRatingCount++;
      });
      
      setUserRankMap(rankMap);
      setUsers(sanitizedData);
      setFilteredUsers(sanitizedData);
      setLoading(false);
      fetchContestDelta();
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Error fetching users. Please try again later.');
      setLoading(false);
    }
  }

  fetchUsers();
}, []);

  const fetchContestDelta = async () => {
    try {
      const response = await axios.get('https://algoxxx.onrender.com/currentinfo/contestDelta', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // The API returns an array of objects with cfid and contestDelta properties
      // Convert it to a map where the keys are the CF handles and the values are the contestDelta
      const deltaData = response.data;
      const deltaMap: {[key: string]: string} = {};
      
      if (Array.isArray(deltaData)) {
        deltaData.forEach(item => {
          if (item.cfid && item.contestDelta) {
            deltaMap[item.cfid] = item.contestDelta;
          }
        });
        
        // console.log("Processed contest delta data:", deltaMap);
        setContestDeltaMap(deltaMap);
      } else {
        console.error('Invalid contest delta data format:', deltaData);
      }
    } catch (error) {
      console.error('Error fetching contest delta data:', error);
    }
  };

  const debouncedFilterUsers = debounce((
    searchTerm: string, 
    ratingRange: [number, number], 
    selectedYear: string, 
    cfHandleSearch: string
  ) => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter((user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (cfHandleSearch) {
      filtered = filtered.filter((user) =>
        user.cfid.toLowerCase().includes(cfHandleSearch.toLowerCase())
      );
    }

    if (selectedYear) {
      filtered = filtered.filter(
        (user) => user.bitsid.substring(0, 4) === selectedYear
      );
    }

    if (ratingRange) {
      filtered = filtered.filter(
        (user) => user.rating >= ratingRange[0] && user.rating <= ratingRange[1]
      );
    }

    sortUsers(filtered, sortBy, sortOrder);
  }, 150);

  const handleCfHandleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCfHandleSearch(event.target.value);
    filterUsers(searchTerm, ratingRange, selectedYear, event.target.value);
  };

  const cfidSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    filterUsers(event.target.value, ratingRange, selectedYear, cfHandleSearch);
  };

  const cfidSort = (field: keyof User) => {
    const order = sortBy === field && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortBy(field);
    setSortOrder(order);
    sortUsers(filteredUsers, field, order);
  };
  const sortUsers = (users: User[], field: keyof User, order: 'asc' | 'desc') => {
    const sortedUsers = [...users].sort((a, b) => {
      if (order === 'asc') {
        return a[field] > b[field] ? 1 : -1;
      }
      return a[field] < b[field] ? 1 : -1;
    });
    setFilteredUsers(sortedUsers);
  };

  useEffect(() => {
    sortUsers(users, 'rating', 'desc');
  }, [users]);

  const filterUsers = (
  searchTerm: string, 
  ratingRange: [number, number], 
  selectedYear: string, 
  cfHandleSearch: string = ''
) => {
  let filtered = users;

  if (searchTerm) {
    filtered = filtered.filter((user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  if (cfHandleSearch) {
    filtered = filtered.filter((user) =>
      user.cfid.toLowerCase().includes(cfHandleSearch.toLowerCase())
    );
  }

  if (selectedYear) {
    filtered = filtered.filter(
      (user) => user.bitsid.substring(0, 4) === selectedYear
    );
  }

  if (ratingRange) {
    filtered = filtered.filter(
      (user) => user.rating >= ratingRange[0] && user.rating <= ratingRange[1]
    );
  }

  sortUsers(filtered, sortBy, sortOrder);
};

const handleSliderChange = (
  _: React.SyntheticEvent | Event,
  newValue: number | number[]
) => {
  if (!Array.isArray(newValue)) return;
  
  // Update local visual state immediately
  const min = Math.max(0, newValue[0]);
  const max = Math.min(4000, newValue[1]);
  
  setSliderValue([min, max]);
  
  // Use debounced filter function instead of direct filtering
};

// Remove filterUsers from handleSliderChangeCommitted since it's redundant
const handleSliderChangeCommitted = (
  _: React.SyntheticEvent | Event,
  newValue: number | number[]
) => {
  if (!Array.isArray(newValue)) return;
  
  const min = Math.max(0, newValue[0]);
  const max = Math.min(4000, newValue[1]);
  
  setRatingRange([min, max] as [number, number]);
  debouncedFilterUsers(searchTerm, [min, max] as [number, number], selectedYear, cfHandleSearch);
};

  // useEffect(() => {
  //   console.log("rerendered", ratingRange);
  // }, [ratingRange]);


  useEffect(() => {
    if (ratingRange[0] > ratingRange[1]) {
      setError('Minimum rating cannot be greater than maximum rating');
    } else {
      setError(null);
    }
  }, [ratingRange]);

  return (
    <>
      {isAnimating && (
  <div
    className="fixed inset-0 z-50 animate-slide"
    style={{ backgroundColor: overlayColor }}
  ></div>
)}
      <NavBar toggleTheme={toggleTheme} fixed={false} />
      <div className='container p-4 mx-auto justify-center' style={{ marginTop: '-5rem' }}>
        {/* <Link href="/" className="flex justify-center"> */}
        <div className="flex justify-center">
        <Image
          src={theme === "dark" 
                  ? "/logos/AlgoManiaXLogoWhitePoster.png" 
                  : "/logos/AlgoManiaXLogoBlackPoster.png"
                }
          alt='AlgoX'
          width={218}
          height={128}
          className='mb-4 max-w-40 z-20'
          priority
        />
        </div>
        <div className='grid gap-4 mb-4 md:grid-cols-2 lg:grid-cols-3'>
          <div className="w-full flex flex-col gap-4 items-center px-4 py-6 bg-blue-50/90 dark:bg-white/5 backdrop-blur-sm rounded-xl shadow-sm border border-blue-200/50 dark:border-0 dark:border-white/10">
            <div className="text-xs text-gray-500 dark:text-gray-400 px-2 mb-3">
              Search by Name
            </div>
            <div className="relative w-full">
              <div className="absolute left-6 top-1/2 transform -translate-y-1/2 flex items-center justify-center h-5 w-5 bg-blue-100 dark:bg-indigo-900/30 rounded-full p-0.5">
                <Search className="h-3 w-3 text-blue-600 dark:text-indigo-400" />
              </div>
              
              <Input
                id="search"
                placeholder="Search users..."
                value={searchTerm}
                onChange={cfidSearch}
                className="pl-12 h-12 w-[95%] mx-auto bg-white dark:bg-gray-800/40 border-blue-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 
                  focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 dark:focus-visible:ring-indigo-500 
                  focus-visible:border-transparent transition-all duration-200
                  shadow-sm hover:shadow-md rounded-xl"
              />
            </div>
            {searchTerm && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Searching for:</span>
                <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-sm font-medium">
                  &quot;{searchTerm}&quot;
                </span>
              </div>
            )}
          </div>
          <div>
            <div className="w-full flex flex-col gap-4 items-center px-4 py-6 bg-blue-50/90 dark:bg-white/5 backdrop-blur-sm rounded-xl shadow-sm border border-blue-200/50 dark:border-0 dark:border-white/10">
              <div className="text-xs text-gray-500 dark:text-gray-400 px-2 mb-3">
                Rating Range
              </div>
              <Slider
                value={sliderValue}
                onChange={handleSliderChange}
                onChangeCommitted={handleSliderChangeCommitted}
                valueLabelDisplay="auto"
                min={0}
                max={4000}
                step={100}
                marks={[
                  { value: 800, label: '800' },
                  // { value: 1200, label: '1200' },
                  { value: 1600, label: '1600' },
                  { value: 2400, label: '2400' },
                  { value: 3200, label: '3200' }
                ]}
                sx={{
                  width: "95%",
                  color: theme === "dark" ? "#4f46e5" : "#3b82f6", // Different color based on theme
                  '& .MuiSlider-thumb': {
                    height: 24,
                    width: 24,
                    backgroundColor: '#fff',
                    border: '2px solid currentColor',
                    boxShadow: '0 3px 6px rgba(0,0,0,0.16)',
                    '&:hover, &.Mui-focusVisible': {
                      boxShadow: '0 0 0 8px rgba(59, 130, 246, 0.16)',
                    },
                  },
                  '& .MuiSlider-valueLabel': {
                    backgroundColor: theme === "dark" ? "#4f46e5" : "#3b82f6",
                  },
                  '& .MuiSlider-track': {
                    height: 8,
                    borderRadius: 4,
                  },
                  '& .MuiSlider-rail': {
                    height: 8,
                    borderRadius: 4,
                    opacity: 0.3,
                  },
                  '& .MuiSlider-mark': {
                    backgroundColor: '#bfdbfe',
                    height: 12,
                    width: 2,
                    marginTop: -2,
                  },
                  '& .MuiSlider-markLabel': {
                    fontSize: '0.75rem',
                    color: theme === "dark" ? "#d1d5db" : "#6b7280",
                  },
                  '& .MuiSlider-markLabelActive': {
                    color: theme === "dark" ? "#f3f4f6" : "#374151",
                  },
                }}
              />
              

              
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Rating Range:</span>
                <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-sm font-medium">
                  {/* {ratingRange[0]} - {ratingRange[1]} */}
                  {sliderValue[0]} - {sliderValue[1]}  {/* Change from ratingRange to sliderValue */}
                </span>
              </div>
            </div>
          </div>
          <div className="w-full flex flex-col gap-4 items-center px-4 py-6 bg-blue-50/90 dark:bg-white/5 backdrop-blur-sm rounded-xl shadow-sm border border-blue-200/50 dark:border-0 dark:border-white/10">
            <div className="text-xs text-gray-500 dark:text-gray-400 px-2 mb-3">
              Search by CF Handle
            </div>
            <div className="relative w-full">
              <div className="absolute left-6 top-1/2 transform -translate-y-1/2 flex items-center justify-center h-5 w-5 bg-blue-100 dark:bg-indigo-900/30 rounded-full p-0.5">
                <Search className="h-3 w-3 text-blue-600 dark:text-indigo-400" />
              </div>
              
              <Input
                id="search"
                placeholder="Search users..."
                value={cfHandleSearch}
                onChange={handleCfHandleSearch}
                className="pl-12 h-12 w-[95%] mx-auto bg-white dark:bg-gray-800/40 border-blue-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 
                  focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 dark:focus-visible:ring-indigo-500 
                  focus-visible:border-transparent transition-all duration-200
                  shadow-sm hover:shadow-md rounded-xl"
              />
            </div>
            
            {cfHandleSearch && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">CF Handle:</span>
                <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-sm font-medium">
                  {cfHandleSearch}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className='flex flex-col gap-2 mb-4 sm:flex-row sm:gap-4 '>
          <Button className="border-[#292929]" onClick={() => cfidSort('rating')}>
            Sort by Rating <ArrowUpDown className='w-4 h-4 ml-2' />
          </Button>
          <Button className="border-[#292929]" onClick={() => cfidSort('maxRating')}>
            Sort by Peak Rating <ArrowUpDown className='w-4 h-4 ml-2' />
          </Button>
        </div>

       {loading ? (
        <div className="py-12">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gradient-to-br from-white to-blue-50/60 dark:bg-gradient-to-br dark:from-gray-800/20 dark:to-blue-900/10 backdrop-blur-sm rounded-xl shadow-sm border border-blue-200/50 dark:border-0 dark:border-white/10 overflow-hidden">
                {/* Card Header */}
                <div className="flex justify-center items-center">
                  <div className="flex flex-row items-center gap-5 pb-3 px-5 pt-4 w-full">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-md bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-gray-700 shadow-md"></div>
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
                
                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent"></div>
                
                {/* Card Content */}
                <div className="pt-3 px-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-left space-y-1">
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-14"></div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
                    </div>
                    
                    <div className="text-right space-y-1">
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-10"></div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                    </div>
                  </div>
                  
                  {/* Rating box */}
                  <div className="mt-2 bg-gray-100/50 dark:bg-gray-800/30 rounded-lg p-2">
                    <div className="flex justify-between items-center">
                      <div className="text-center space-y-1 flex-1">
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded mx-auto w-16"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mx-auto w-10"></div>
                      </div>
                      
                      <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>
                      
                      <div className="text-center space-y-1 flex-1">
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded mx-auto w-10"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mx-auto w-10"></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Card Footer */}
                <div className="flex justify-end pb-4 px-5 pt-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Loading indicator */}
          <div className="mt-10 flex flex-col items-center">
            <div className="relative h-16 w-16 mb-4">
              <div className="absolute h-16 w-16 rounded-full border-4 border-blue-200 dark:border-blue-900/30 opacity-25"></div>
              <div className="absolute h-16 w-16 rounded-full border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                Loading Participants
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Please wait while we fetch the leaderboard data</p>
            </div>
          </div>
        </div>
      ) : error ? (
        // Keep your existing error state
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4">
            <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="mt-4 text-lg font-medium text-red-600 dark:text-red-400">{error}</p>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Please try again later</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        // Keep your existing empty state
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4">
            <svg className="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">No users found</p>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Try adjusting your search filters</p>
        </div>
      ) : (
        // Keep your existing user cards with animation fix
        <>
          <style jsx global>{`
            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
          <div 
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            style = {{
              opacity: 0,
              animation: `fadeInUp 0.5s ease-out forwards`,
              animationDelay: `0.5s`,
            }}
          >
            {filteredUsers.map((user) => (
                <div 
                key={user.bitsid} 
                className="transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                style={{
                  // opacity: 0,
                  // animation: `fadeInUp 0.5s ease-out forwards`,
                  // animationDelay: `${index * 0.1}s`
                }}
                >
                <UserCard user={user} userRank={userRankMap[user.bitsid]} contestDelta={contestDeltaMap[user.cfid] || "N/A"} />
                </div>
            ))}
          </div>
        </>
      )}
      </div>
    </>
  );
};

export default SampleTable;