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

  // Load the initial theme from localStorage
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme);
    document.documentElement.classList.toggle("dark", storedTheme === "dark");
    document.body.classList.toggle("dark", storedTheme === "dark");
  }, []);

  // Handle theme toggle with animation
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setOverlayColor(newTheme === "dark" ? "#121212" : "#ffffff"); // Set overlay color to match new theme
    setIsAnimating(true); // Start the animation

    setTimeout(() => {
      setTheme(newTheme);
      document.documentElement.classList.toggle("dark", newTheme === "dark");
      document.body.classList.toggle("dark", newTheme === "dark");

      localStorage.setItem("theme", newTheme);
    }, 500); // Change theme halfway through the animation

    setTimeout(() => {
      setIsAnimating(false); // End the animation
    }, 1000); // Match the animation duration
  };

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
        // sanitizedData = sanitizedData.sort(
        //   (a: User, b: User) => b.rating - a.rating
        // );
        // sortUsers(sanitizedData, 'rating', 'desc');
        setUsers(sanitizedData);
        setFilteredUsers(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Error fetching users. Please try again later.');
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

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
          className="fixed inset-0 z-50 transition-transform duration-[1000ms] ease-[cubic-bezier(0.4, 0, 0.2, 1)] transform translate-x-0 animate-slide"
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
          className='mb-4 max-w-40'
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
          <p className='text-center text-gray-500'>Loading...</p>
        ) : error ? (
          <p className='text-center text-red-500'>{error}</p>
        ) : filteredUsers.length === 0 ? (
          <p className='text-center text-gray-500'>No users found</p>
        ) : (
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {filteredUsers.map(user => (
              <UserCard key={user.bitsid} user={user} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default SampleTable;