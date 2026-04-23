"use client";
// The point of this, is to basically have our users select a specific difficulty level from 1 to 30.
// They can also select a bunch of topics from codeforces.
// Based on these selections, we can generate a mashup of problems.
// This page will generate `n` problems for each difficulty.
// `n` will be determined by the user's selection. (default = 3)
// Each difficulty level will have a min and max rating range. Then, based on
// the user's selection, we'll select the ratings
// Eg: 800-1200, 4 questions: 800, 800 + 1*(1200-800)/(4-1) + 2*(1200-800)/(4-1) + 3*(1200-800)/(4-1)
// 800, 933, 1066, 1200
// We'll take the ciel (100 based)
// 800, 1000, 1100, 1200 for that level

import { useState } from "react";

const ALL_TOPICS = [
  "dp",
  "graphs",
  "math",
  "greedy",
  "implementation",
  "data structures",
  "binary search",
];

function generateRatings(min: number, max: number, n: number) {
  if (n === 1) return [min];

  const step = (max - min) / (n - 1);
  const res: number[] = [];

  for (let i = 0; i < n; i++) {
    let val = min + i * step;

    // round up to nearest 100
    val = Math.ceil(val / 100) * 100;

    res.push(val);
  }

  return res;
}

// Example mapping (you can tweak this)
function getRatingRange(level: number) {
  const min = 800 + (level - 1) * 100;
  const max = min + 400;
  return { min, max };
}

export default function MashupPage() {
  const [levels, setLevels] = useState<number[]>([1]);
  const [n, setN] = useState(3);
  const [topics, setTopics] = useState<string[]>([]);
  const [result, setResult] = useState<any[]>([]);

  function toggleLevel(level: number) {
    setLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level],
    );
  }

  function toggleTopic(topic: string) {
    setTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic],
    );
  }

  function generateMashup() {
    const output: any[] = [];

    for (const level of levels) {
      const { min, max } = getRatingRange(level);
      const ratings = generateRatings(min, max, n);

      output.push({
        level,
        range: `${min}-${max}`,
        ratings,
        topics,
      });
    }

    setResult(output);
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">CF Mashup Generator</h1>

      {/* Levels */}
      <div>
        <h2 className="font-semibold">Select Levels</h2>
        <div className="flex flex-wrap gap-2 mt-2">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((lvl) => (
            <button
              key={lvl}
              onClick={() => toggleLevel(lvl)}
              className={`px-3 py-1 rounded border ${
                levels.includes(lvl) ? "bg-blue-500 text-white" : "bg-gray-100"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Number of problems */}
      <div>
        <h2 className="font-semibold">Problems per level</h2>
        <input
          type="number"
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
          className="border px-2 py-1 mt-2"
          min={1}
        />
      </div>

      {/* Topics */}
      <div>
        <h2 className="font-semibold">Topics</h2>
        <div className="flex flex-wrap gap-2 mt-2">
          {ALL_TOPICS.map((topic) => (
            <button
              key={topic}
              onClick={() => toggleTopic(topic)}
              className={`px-3 py-1 rounded border ${
                topics.includes(topic)
                  ? "bg-green-500 text-white"
                  : "bg-gray-100"
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Generate */}
      <button
        onClick={generateMashup}
        className="bg-black text-white px-4 py-2 rounded"
      >
        Generate
      </button>

      {/* Output */}
      <div className="space-y-4">
        {result.map((item, idx) => (
          <div key={idx} className="border p-4 rounded">
            <h3 className="font-semibold">
              Level {item.level} ({item.range})
            </h3>
            <p>Ratings: {item.ratings.join(", ")}</p>
            <p>Topics: {item.topics.join(", ") || "Any"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
