import { ExternalLink } from 'lucide-react'
import Image from 'next/image'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import React from 'react'

interface User {
  bitsid: string;
  cfid: string;
  name: string;
  rating: number;
  maxRating: number;
  titlePhoto: string;
}

interface UserCardProps {
  user: User;
  userRank: number;
  contestDelta: string;
}

// <UserCard key={user.bitsid} data={user} />
const UserCard: React.FC<UserCardProps> = React.memo(({ user, userRank, contestDelta}) => {
  interface Rank {
    name: string;
    color: string;
  }

  const getRank = (rating: number): Rank => {
    if (rating < 1200) return { name: 'Newbie', color: 'text-gray-500' }
    if (rating < 1400) return { name: 'Pupil', color: 'text-green-500' }
    if (rating < 1600) return { name: 'Specialist', color: 'text-cyan-500' }
    if (rating < 1900) return { name: 'Expert', color: 'text-blue-700' }
    if (rating < 2100) return { name: 'Candidate Master', color: 'text-purple-700' }
    if (rating < 2300) return { name: 'Master', color: 'text-orange-500' }
    if (rating < 2400) return { name: 'International Master', color: 'text-orange-500' }
    if (rating < 2600) return { name: 'Grandmaster', color: 'text-red-500' }
    if (rating < 3000) return { name: 'International Grandmaster', color: 'text-red-500' }
    return { name: 'Legendary Grandmaster', color: 'text-red-600' }
  }

  // Get rank number color based on position
  const getRankColor = (rank: number): string => {
    if (rank === 1) return 'text-yellow-500 dark:text-yellow-400';
    if (rank === 2) return 'text-gray-500 dark:text-gray-300';
    if (rank === 3) return 'text-amber-700 dark:text-amber-500';
    return 'text-gray-300 dark:text-gray-600';
  }

  // Get appropriate color for contest delta
  const getContestDeltaColor = (delta: string): string => {
    if (delta === '0') return 'text-green-600 dark:text-green-400';
    if (delta === '1') return 'text-yellow-600 dark:text-yellow-400';
    if (delta === '2') return 'text-orange-600 dark:text-orange-400';
    if (delta === '10+' || parseInt(delta) >= 3) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400'; // Default color for N/A
  }

  return (
    <Card key={user.bitsid} className="dark:border-none overflow-hidden transition-all duration-300 hover:shadow-lg relative">
      <div className="bg-gradient-to-br from-white to-blue-50/60 dark:bg-gradient-to-br dark:from-gray-800/20 dark:to-blue-900/10 backdrop-blur-sm rounded-xl shadow-sm border border-blue-200/50 dark:border-0 dark:border-white/10">
        <div className="flex justify-center items-center">
          <CardHeader className="flex flex-row items-center justify-between w-full pb-3 px-5">
          {/* Left side - User info */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <Image 
                src={user.titlePhoto === 'N/A' ? "https://userpic.codeforces.org/no-title.jpg" : user.titlePhoto} 
                alt={user.name} 
                width={64} 
                height={64} 
                className='w-16 h-16 rounded-md object-cover border-2 border-white dark:border-gray-700 shadow-md' 
              />
            </div>

            <div className="min-w-0">
              <CardTitle className='text-gray-800 dark:text-gray-200 text-lg font-bold truncate'>
                {user.name}
              </CardTitle>
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <span className="truncate text-sm">{user.cfid}</span>
              </div>
            </div>
          </div>
          
          {/* Right side - Rank number */}
          <div className="flex-shrink-0 flex items-center h-full pb-3">
            <div className="relative">
              <span className={`text-4xl font-black tracking-tight ${getRankColor(userRank)}`} 
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                {userRank}
              </span>
              {userRank <= 3 && (
                <span className="absolute -top-1.5 -right-2 text-lg">
                  {userRank === 1 ? '👑' : userRank === 2 ? '✨' : '🔥'}
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        </div>
        
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent"></div>
        
        <CardContent className='pt-3 px-5'>
          <div className="flex items-start justify-between mb-3">
            <div className="text-left">
              <span className="text-xs text-gray-500 dark:text-gray-400">BITS ID</span>
              <p className="text-gray-700 dark:text-gray-300 font-medium text-sm mt-0.5 truncate max-w-[120px]">
                {user.bitsid}
              </p>
            </div>
            
            <div className="text-right">
              <span className="text-xs text-gray-500 dark:text-gray-400">CF Rank</span>
              <p className={`${getRank(user.rating).color} font-semibold text-sm mt-0.5`}>
                {getRank(user.rating).name}
              </p>
            </div>
          </div>
          
          <div className='flex justify-between items-center mt-2 bg-gray-100/50 dark:bg-gray-800/30 rounded-lg p-2'>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Rating</p>
              <p className="font-bold text-gray-800 dark:text-gray-200">{user.rating}</p>
            </div>
            
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>
            
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Peak Rating</p>
                <p className="font-bold text-gray-800 dark:text-gray-200 text-right">{user.maxRating}</p>
            </div>
          </div>
          
          {/* New section for contest delta */}
          <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">Contests Missed</span>
              <span className={`text-sm font-medium ${getContestDeltaColor(contestDelta)}`}>
                {contestDelta === '10+' ? '10+' : contestDelta === 'N/A' ? 'N/A' : contestDelta}
                {contestDelta === '0' && ' (Active)'}
              </span>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className='flex justify-between items-center pb-4 px-5'>
          <a
            href={`https://codeforces.com/profile/${user.cfid}`}
            target='_blank'
            rel='noopener noreferrer'
            className='flex items-center text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors ml-auto'
          >
            View on Codeforces <ExternalLink className='w-3 h-3 ml-1' />
          </a>
        </CardFooter>
      </div>
    </Card>
  )
});

UserCard.displayName = 'UserCard';

export default UserCard