const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const User = require("../models/users");

// Add CORS headers to all routes
router.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH");
    return res.status(200).json({});
  }
  next();
});

// router.get("/", (req, res, next) => {
//   res.status(200).json({
//     message: "Handling GET requests to /database route",
//   });
// });

// router.post("/", (req, res, next) => {
//   res.status(201).json({
//     message: "Handling POST requests to /database route",
//   });
// });

// get the rating history of all users
router.get("/", (req, res, next) => {});

router.get("/contestDelta", async (req, res, next) => {
  // Fetch all users from the database
  const contestUrl = "https://codeforces.com/api/contest.list?gym=false";
  const contestResponse = await fetch(contestUrl);
  const contestData = await contestResponse.json();

  // Get current time in seconds
  const currentTimeSeconds = Math.floor(Date.now() / 1000);

  // Sort contests by start time (descending - latest first)
  const sortedContests = contestData.result.sort(
    (a, b) => b.startTimeSeconds - a.startTimeSeconds
  );

  // Take top 100 recent contests
  const recentContests = sortedContests.slice(0, 100);

  // Filter for div. 2, div. 3 and div. 4 contests that have already started
  const contestIds = recentContests
    .filter(
      (contest) =>
        (contest.name.includes("Div. 2") ||
          contest.name.includes("Div. 3") ||
          contest.name.includes("Div. 4")) &&
        contest.startTimeSeconds <= currentTimeSeconds // Ignore contests that haven't started yet
    )
    .slice(0, 11) // Take only the top 11 matching contests
    .map((contest) => contest.id);

  console.log(contestIds);

  // fetch all the people who participated in the contest in a vector of vectors of string
  // Create arrays to store contest participants
  // Structure: [ [contestId, [participant1, participant2, ...]], ... ]
  const contestParticipants = [];

  for (const contestId of contestIds) {
    const url = `https://codeforces.com/api/contest.standings?contestId=${contestId}`;
    const response = await fetch(url);
    // Sleep for 2 seconds to avoid rate limiting
    // await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log("contest number", contestId);
    const data = await response.json();

    if (data.status !== "OK" || !data.result) {
      throw new Error("Invalid response from Codeforces API");
    }

    const participants = data.result.rows.map(
      (row) => row.party.members[0].handle
    );
    contestParticipants.push([contestId, participants]);
  }

  // console.log("nice");

  const docs = await User.find().exec();
  if (!docs.length) {
    return res.status(404).json({ message: "No users found" });
  }

  // for each user, from the top, add count till you find a contest in which he/she participated
  // then save the count with the userid in a map
  // Convert all handles to lowercase for case-insensitive comparison
  const normalizedContestParticipants = contestParticipants.map(
    ([contestId, participants]) => {
      return [contestId, participants.map((handle) => handle.toLowerCase())];
    }
  );

  // Use the normalized contest participants for comparison
  const userContestCount = new Map();
  docs.forEach((user) => {
    let count = 0;
    userContestCount.set(user.cfid, -1);
    for (const [_, participants] of normalizedContestParticipants) {
      if (participants.includes(user.cfid.toLowerCase())) {
        userContestCount.set(user.cfid, count);
        break;
      }
      count++;
    }
  });

  // convert the values of the userContestCount map to a string, and if it's -1, convert it to "10+"

  userContestCount.forEach((value, key, map) => {
    if (value == -1) {
      map.set(key, "10+");
    } else {
      map.set(key, value.toString());
    }
  });

  return res.status(200).json(Object.fromEntries(userContestCount));
});

// get the [bitsid, cfid, name, rating, rank, creationTime] of all users
router.get("/all", async (req, res, next) => {
  try {
    const docs = await User.find().exec();

    if (!docs.length) {
      return res.status(404).json({ message: "No users found" });
    }

    // Create a semicolon-separated string of Codeforces IDs (cfid)
    const userString = docs.map((user) => user.cfid.toLowerCase()).join(";");

    // Define the URL to fetch user data from Codeforces API
    const url = `https://codeforces.com/api/user.info?handles=${userString}`;
    // console.log("Fetching URL:", url);

    // Fetch user info from Codeforces API
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch user info from Codeforces API");
    }

    const data = await response.json();

    if (data.status !== "OK" || !data.result) {
      throw new Error("Invalid response from Codeforces API");
    }

    const cfDataMap = new Map();
    data.result.forEach((cfData) => {
      cfDataMap.set(cfData.handle.toLowerCase(), cfData);
    });

    let updatedDocs = docs.map((user) => {
      const cfData = cfDataMap.get(user.cfid.toLowerCase()) || {}; // Use cfid to find corresponding data or default to an empty object

      return {
        bitsid: user.bitsid,
        cfid: user.cfid,
        name: user.name || "N/A",
        rating: cfData.rating !== undefined ? cfData.rating : 0, // Default rating to 0
        rank: cfData.rank !== undefined ? cfData.rank : "N/A", // Default rank to "N/A"
        maxRating: cfData.maxRating !== undefined ? cfData.maxRating : 0, // Default maxRating to 0
        maxRank: cfData.maxRank !== undefined ? cfData.maxRank : "N/A", // Default maxRank to "N/A"
        creationTime: cfData.registrationTimeSeconds
          ? new Date(cfData.registrationTimeSeconds * 1000)
          : "N/A", // Default to "N/A" if registrationTimeSeconds is undefined
        titlePhoto: cfData.titlePhoto || "N/A",
      };
    });

    // Sort the updatedDocs array in descending order based on current rating
    updatedDocs.sort((a, b) => b.rating - a.rating);

    // Return the updated user data as a JSON response
    res.status(200).json(updatedDocs);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message || "An unexpected error occurred",
    });
  }
});

// get the current profilepic, rating, rank, creationTime, problems, etc of any user
router.get("/:userId", (req, res, next) => {});
module.exports = router;
