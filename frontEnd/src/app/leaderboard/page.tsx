"use client";

import { ArrowUpDown, Search } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  const [ratingRange] = useState<[number, number]>([0, 3500]);
  const [selectedYear] = useState('');
  const [sortBy, setSortBy] = useState<keyof User>('rating');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedRank, setSelectedRank] = useState('all');
  const [minRating, setMinRating] = useState(0);
  const [maxRating, setMaxRating] = useState(3500);
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

  const cfidSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    filterUsers(event.target.value, ratingRange, selectedYear, selectedRank);
  };

  const cfidRankChange = (value: string) => {
    setSelectedRank(value);
    filterUsers(searchTerm, ratingRange, selectedYear, value);
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

  const filterUsers = (
    searchTerm: string,
    ratingRange: [number, number],
    selectedYear: string,
    selectedRank: string
  ) => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedYear) {
      filtered = filtered.filter(user => (user.bitsid.substring(0, 4)) === (selectedYear));
    }
    filtered = filtered.filter(
      user => user.rating >= minRating && user.rating <= maxRating
    );

    if (selectedRank && selectedRank !== 'all') {
      filtered = filtered.filter(
        user => getRank(user.rating).name === selectedRank
      );
    }

    sortUsers(filtered, sortBy, sortOrder);
  };

  const getRank = (rating: number) => {
    if (rating < 1200) return { name: 'Newbie', color: 'text-gray-500' };
    if (rating < 1400) return { name: 'Pupil', color: 'text-green-500' };
    if (rating < 1600) return { name: 'Specialist', color: 'text-cyan-500' };
    if (rating < 1900) return { name: 'Expert', color: 'text-blue-700' };
    if (rating < 2100) return { name: 'Candidate Master', color: 'text-purple-700' };
    if (rating < 2300) return { name: 'Master', color: 'text-orange-500' };
    if (rating < 2400) return { name: 'International Master', color: 'text-orange-500' };
    if (rating < 2600) return { name: 'Grandmaster', color: 'text-red-500' };
    if (rating < 3000) return { name: 'International Grandmaster', color: 'text-red-500' };
    return { name: 'Legendary Grandmaster', color: 'text-red-600' };
  };

  const cfidMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (isNaN(value)) {
      setMinRating(0);
    } else {
      setMinRating(Math.max(0, Math.min(value, 4000)));
    }
    filterUsers(searchTerm, ratingRange, selectedYear, selectedRank);
  };

  const cfidMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (isNaN(value)) {
      setMaxRating(0);
    } else {
      setMaxRating(Math.max(0, Math.min(value, 4000)));
    }
    filterUsers(searchTerm, ratingRange, selectedYear, selectedRank);
  };

  useEffect(() => {
    if (minRating > maxRating) {
      setError('Minimum rating cannot be greater than maximum rating');
    } else {
      setError(null);
    }
  }, [minRating, maxRating]);

  return (
    <>
      {isAnimating && (
        <div
          className="fixed inset-0 z-50 transition-transform duration-[1000ms] ease-[cubic-bezier(0.4, 0, 0.2, 1)] transform translate-x-0 animate-slide"
          style={{ backgroundColor: overlayColor }}
        ></div>
      )}
      <NavBar toggleTheme={toggleTheme} fixed={false} />
      <div className='container p-4 mx-auto' style={{ marginTop: '-5rem' }}>
        <div className='text-center'>
            <Link href="/">
            <Image
              src={theme === "dark" ? "/algoLightX.png" : "/algoDarkX.png"}
              alt='Codeforces'
              className=' mx-auto mb-4'
              layout="intrinsic"
              width={218}
              height={128}
            />
            </Link>
          <br />
        </div>
        <div className='grid gap-4 mb-4 md:grid-cols-2 lg:grid-cols-3'>
          <div>
            <Label htmlFor='search'>Search by Name</Label>
            <div className='relative'>
              <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground bg-[#ffffff] dark:bg-[#121212]' />
              <Input
                id='search'
                placeholder='Search users...'
                value={searchTerm}
                onChange={cfidSearch}
                className='pl-8 bg-[#ffffff] dark:bg-[#121212] border-[#292929] text-[#dcdada] '
              />
            </div>
          </div>
          <div>
            <div className='grid grid-cols-2 gap-2'>
              <div>
                <Label htmlFor='min-rating'>Min Rating</Label>
                <Input
                  id='min-rating'
                  type='number'
                  min={0}
                  max={4000}
                  value={minRating}
                  onChange={cfidMinChange}
                  className='bg-[#ffffff] dark:bg-[#121212] border-[#292929] text-[#dcdada]'
                />
              </div>
              <div>
                <Label htmlFor='max-rating'>Max Rating</Label>
                <Input
                  id='max-rating'
                  type='number'
                  min={0}
                  max={4000}
                  value={maxRating}
                  onChange={cfidMaxChange}
                  className='bg-[#ffffff] dark:bg-[#121212] border-[#292929] text-[#dcdada]'
                />
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor='rank'>Rank</Label>
            <Select value={selectedRank} onValueChange={cfidRankChange}>
              <SelectTrigger id='rank' className='bg-[#ffffff] dark:bg-[#121212] border-[#292929] text-[#121212] dark:text-[#dcdada]'>
                <SelectValue placeholder='Select Rank' />
              </SelectTrigger>
              <SelectContent className='bg-[#ffffff] dark:bg-[#121212] border-[#292929] text-[#121212] dark:text-[#898888]'>
                <SelectItem value='all'>All Ranks</SelectItem>
                <SelectItem value='Newbie'>Newbie</SelectItem>
                <SelectItem value='Pupil'>Pupil</SelectItem>
                <SelectItem value='Specialist'>Specialist</SelectItem>
                <SelectItem value='Expert'>Expert</SelectItem>
                <SelectItem value='Candidate Master'>Candidate Master</SelectItem>
                <SelectItem value='Master'>Master</SelectItem>
              </SelectContent>
            </Select>
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