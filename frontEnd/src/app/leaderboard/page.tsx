import React from 'react';
import UserTable from '../components/UserTable.jsx'

interface User {
  handle: string;
  name: string;
  bitsId: string;
  branch: string;
  peakRating: number;
  currentRating: number;
}

export default function TablePage() {
    const [users, setUsers] = React.useState<User[]>([]);

    React.useEffect(() => {
      async function fetchUsers() {
        try {
          const response = await fetch('/api/users');
          const data = await response.json();
          setUsers(data);
        } catch (error) {
          console.error('Error fetching users:', error);
        }
      }

      fetchUsers();
    }, []);
  return (
    <>
      <div>
        <h1>User Leaderboard</h1>
        <UserTable users={users} />
      </div>
    </>
  )
}
