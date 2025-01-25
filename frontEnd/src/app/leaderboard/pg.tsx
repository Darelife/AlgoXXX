"use client";

import React from 'react';
import UserTable from '../components/UserTable'
import axios from 'axios';

interface User {
  cfid: string;
  name: string;
  bitsid: string;
  branch: string;
  maxRating: number;
  rating: number;
}

export default function TablePage() {
    const [users, setUsers] = React.useState<User[]>([]);

    React.useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await axios.get('http://10.30.80.131:5000/currentinfo/all', {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = response.data;
        console.log(data);
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
