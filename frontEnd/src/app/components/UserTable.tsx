import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface User {
  handle: string;
  name: string;
  bitsId: string;
  branch: string;
  peakRating: number;
  currentRating: number;
}

interface UserTableProps {
  users: User[];
}

export default function UserTable({ users }: UserTableProps) {
  return (
    <Table>
      <TableCaption>A list of users and their ratings.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className='text-left'>Handle</TableHead>
          <TableHead className='text-left'>Name</TableHead>
          <TableHead className='text-left'>BITS ID</TableHead>
          <TableHead className='text-left'>Branch</TableHead>
          <TableHead className='text-right'>Peak Rating</TableHead>
          <TableHead className='text-right'>Current Rating</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map(user => (
          <TableRow key={user.bitsId}>
            <TableCell className='text-left font-medium'>
              {user.handle}
            </TableCell>
            <TableCell className='text-left'>{user.name}</TableCell>
            <TableCell className='text-left'>{user.bitsId}</TableCell>
            <TableCell className='text-left'>{user.branch}</TableCell>
            <TableCell className='text-right'>{user.peakRating}</TableCell>
            <TableCell className='text-right'>{user.currentRating}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={5} className='text-left'>
            Total Users
          </TableCell>
          <TableCell className='text-right'>{users.length}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}
