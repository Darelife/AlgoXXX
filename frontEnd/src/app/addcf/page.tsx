"use client";

import React, { useState } from "react";
import NavBar from "../components/navBar";
import axios from "axios";

export default function AddCf() {
  const [name, setName] = useState("");
  const [bitsId, setBitsId] = useState("");
  const [cfHandle, setCfHandle] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.get(`https://codeforces.com/api/user.status?handle=${cfHandle}&from=1&count=100`);
      if (response.data.status === "OK") {
        interface Submission {
          problem: {
            contestId: number;
            index: string;
          };
          verdict: string;
        }

        const submissions: Submission[] = response.data.result;

        const solved = submissions.some(submission => submission.problem.contestId === 158 && submission.problem.index === "A");
        if (solved) {
          alert("Codeforces handle verified successfully!");
          // Proceed with form submission or further processing
        } else {
          setError("Please solve problem 158A to verify your handle.");
        }
      } else {
        setError("Invalid Codeforces handle.");
      }
    } catch (err) {
      console.error(err);
      setError("Error verifying Codeforces handle.");
    }
  };

  return (
    <div className="relative overflow-hidden">
      <NavBar fixed={true} toggleTheme={() => {}} />
      <div className="flex justify-center items-center min-h-screen">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="bitsId" className="block text-sm font-medium text-gray-700">
              BITS ID
            </label>
            <input
              type="text"
              id="bitsId"
              value={bitsId}
              onChange={(e) => setBitsId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="cfHandle" className="block text-sm font-medium text-gray-700">
              Codeforces Handle
            </label>
            <input
              type="text"
              id="cfHandle"
              value={cfHandle}
              onChange={(e) => setCfHandle(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}