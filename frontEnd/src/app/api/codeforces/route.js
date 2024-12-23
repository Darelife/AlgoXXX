import fs from "fs";
import path from "path";

const cacheFile = path.resolve("./data.json");

const fetchData = async (handles) => {
  const ratings = [];
  for (const handle of handles) {
    const response = await fetch(
      `https://codeforces.com/api/user.rating?handle=${handle}`
    );
    const result = await response.json();

    if (result.status === "OK") {
      const userRatings = result.result.map((contest) => ({
        name: handle,
        contestName: contest.contestName,
        ratingUpdateTime: new Date(contest.ratingUpdateTimeSeconds * 1000),
        oldRating: contest.oldRating,
        newRating: contest.newRating,
      }));
      ratings.push(...userRatings);
    }
  }
  return ratings;
};

export async function GET() {
  const handles = ["tourist", "benq", "radewoosh"]; // Customize as needed

  // Check if cached data exists
  if (fs.existsSync(cacheFile)) {
    const cachedData = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
    return new Response(JSON.stringify(cachedData), { status: 200 });
  }

  try {
    const rawData = await fetchData(handles);
    const processedData = rawData.map((entry) => ({
      name: entry.name,
      value: entry.newRating,
      lastValue: entry.oldRating,
      year: entry.ratingUpdateTime.getFullYear(),
      colour: `hsl(${Math.random() * 360}, 75%, 75%)`,
    }));

    // Save to cache
    fs.writeFileSync(cacheFile, JSON.stringify(processedData, null, 2));
    return new Response(JSON.stringify(processedData), { status: 200 });
  } catch (error) {
    console.error("Error fetching data:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
    });
  }
}
