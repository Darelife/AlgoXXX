import { ExternalLink } from 'lucide-react'
import Image from 'next/image'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function UserCard({ ...user }) {
  // interface User {
  //   bitsId: string;
  //   pfp: string;
  //   name: string;
  //   handle: string;
  //   currentRating: number;
  //   peakRating: number;
  // }

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

  return (
    <Card key={user.bitsId}>
      <CardHeader>
        <Image src={user.pfp} alt={user.name} width={64} height={64} className='w-16 h-16 mx-auto' />
        {/* <Image src={user.pfp} alt={user.name} width={64} height={64} className='w-16 h-16 mx-auto' /> */}
        <CardTitle className='mt-2 text-center text-[#dcdada]'>{user.name}</CardTitle>
        <p className='text-center text-gray-500'>{user.handle}</p>
      </CardHeader>
      <CardContent className='text-center'>
        <p>
          Rank:{' '}
          <span className={getRank(user.currentRating).color}>
            {getRank(user.currentRating).name}
          </span>
        </p>
        <p>Student ID: {user.bitsId}</p>
        <div className='flex justify-center space-x-6'>
          <p>Rating: {user.currentRating}</p>
          <p>Peak Rating: {user.peakRating}</p>
        </div>
      </CardContent>
      <CardFooter className='flex justify-center'>
        <a
          href={`https://codeforces.com/profile/${user.handle}`}
          target='_blank'
          rel='noopener noreferrer'
          className='flex items-center text-blue-500 hover:underline'
        >
          View Profile <ExternalLink className='w-4 h-4 ml-1' />
        </a>
      </CardFooter>
    </Card>
  )
}
