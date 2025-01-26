import { ExternalLink } from 'lucide-react'
import Image from 'next/image'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface User {
  bitsid: string;
  cfid: string;
  name: string;
  rating: number;
  maxRating: number;
  titlePhoto: string;
}

// <UserCard key={user.bitsid} data={user} />
const UserCard: React.FC<{ user: User }> = ({ user }) => {
  interface Rank {
    name: string;
    color: string;
  }

  console.log(user);

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
    <Card key={user.bitsid}>
      <CardHeader>
        <Image src={user.titlePhoto==='N/A'?"https://userpic.codeforces.org/no-title.jpg":user.titlePhoto} alt={user.name} width={64} height={64} className='w-16 h-16 mx-auto' />
        {/* <Image src={user.pfp} alt={user.name} width={64} height={64} className='w-16 h-16 mx-auto' /> */}
        <CardTitle className='mt-2 text-center text-[#323232] dark:text-[#dcdada]'>{user.name}</CardTitle>
        <p className='text-center text-gray-500'>{user.cfid}</p>
      </CardHeader>
      <CardContent className='text-center'>
        <p>
          Rank:{' '}
          <span className={getRank(user.rating).color}>
            <b>{getRank(user.rating).name}</b>
          </span>
        </p>
        <p>Student ID: {user.bitsid}</p>
        <div className='flex justify-center space-x-6'>
          <p>Rating: {user.rating}</p>
          <p>Peak Rating: {user.maxRating}</p>
        </div>
      </CardContent>
      <CardFooter className='flex justify-center'>
        <a
          href={`https://codeforces.com/profile/${user.cfid}`}
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

export default UserCard