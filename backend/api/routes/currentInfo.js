const express = require("express");
const router = express.Router();
const axios = require("axios");
const dotenv = require("dotenv");
const supabase = require("../../supabaseClient");

// // Add CORS headers to all routes
// router.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept, Authorization"
//   );
//   if (req.method === "OPTIONS") {
//     res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH");
//     return res.status(200).json({});
//   }
//   next();
// });

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

// Update /contestDeltaFetch to save contestDelta in the users table
router.get("/contestDeltaFetch", async (req, res, next) => {
  try {
    const contestUrl = "https://codeforces.com/api/contest.list?gym=false";
    const contestResponse = await fetch(contestUrl);
    const contestData = await contestResponse.json();

    const currentTimeSeconds = Math.floor(Date.now() / 1000);
    const sortedContests = contestData.result.sort(
      (a, b) => b.startTimeSeconds - a.startTimeSeconds
    );

    const recentContests = sortedContests.slice(0, 100);
    const contestIds = recentContests
      .filter(
        (contest) =>
          (contest.name.includes("Div. 1") ||
            contest.name.includes("Div. 2") ||
            contest.name.includes("Div. 3") ||
            contest.name.includes("Div. 4")) &&
          contest.startTimeSeconds <= currentTimeSeconds
      )
      .slice(0, 11)
      .map((contest) => contest.id);

    const contestParticipants = [];

    for (const contestId of contestIds) {
      try {
        const url = `https://codeforces.com/api/contest.standings?contestId=${contestId}&showUnofficial=true`;
        const response = await fetch(url);
        await new Promise((resolve) => setTimeout(resolve, 2000));

        if (!response.ok) {
          console.log(
            `Error fetching contest ${contestId}: ${response.status}`
          );
          continue;
        }

        const data = await response.json();

        if (data.status !== "OK" || !data.result) {
          console.log(
            `Invalid response from Codeforces API for contest ${contestId}`
          );
          continue;
        }

        const participants = data.result.rows.map(
          (row) => row.party.members[0].handle
        );
        contestParticipants.push([contestId, participants]);
      } catch (error) {
        console.error(`Error processing contest ${contestId}:`, error.message);
        continue;
      }
    }

    const normalizedContestParticipants = contestParticipants.map(
      ([contestId, participants]) => {
        return [contestId, participants.map((handle) => handle.toLowerCase())];
      }
    );

    const userContestCount = new Map();

    const { data: users, error: fetchError } = await supabase
      .from("users")
      .select("cfid");

    if (fetchError) throw fetchError;

    users.forEach((user) => {
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

    userContestCount.forEach(async (value, key) => {
      const contestDelta = value === -1 ? "10+" : value.toString();
      await supabase.from("users").update({ contestDelta }).eq("cfid", key);
    });

    return res
      .status(200)
      .json({ message: "Contest delta updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message || "An unexpected error occurred",
    });
  }
});

// Update /contestdelta route to fetch contestDelta from users table
router.get("/contestdelta", async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("cfid, contestDelta");

    if (error) {
      throw new Error(error.message);
    }

    if (!data.length) {
      return res.status(404).json({ message: "No contest delta data found" });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message || "An unexpected error occurred",
    });
  }
});

router.get("/nextContest", async (req, res, next) => {
  dotenv.config();

  const CLIST_USERNAME = process.env.CLIST_USERNAME;
  const CLIST_PASSWORD = process.env.CLIST_PASSWORD;

  if (!CLIST_USERNAME || !CLIST_PASSWORD) {
    return res.status(500).json({
      error: "CLIST_USERNAME or CLIST_PASSWORD is not defined in .env file",
    });
  }

  try {
    const currentDateTime = new Date().toISOString();
    // const eightHoursAgo = new Date(
    //   Date.now() - 8 * 60 * 60 * 1000
    // ).toISOString();
    const url = `https://clist.by/api/v3/contest/?username=${CLIST_USERNAME}&api_key=${CLIST_PASSWORD}&start__gt=${currentDateTime}&format=json`;

    const response = await axios.get(url);

    if (response.status !== 200 || !response.data) {
      return res.status(500).json({
        error: "Failed to fetch contest data from CLIST API",
      });
    }

    const contests = response.data.objects.map((contest) => ({
      event: contest.event,
      start: new Date(contest.start).toISOString(),
      end: new Date(contest.end).toISOString(),
      duration: contest.duration,
      host: contest.host,
      href: contest.href,
    }));

    return res.status(200).json(contests);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error.message || "An unexpected error occurred",
    });
  }
});

// New route to filter users by cfid, name, or bitsid
router.get("/user", async (req, res, next) => {
  const { cfid, name, bitsid } = req.query;

  try {
    let query = supabase.from("users").select("*");

    if (cfid) {
      query = query.eq("cfid", cfid);
    }
    if (name) {
      query = query.eq("name", name);
    }
    if (bitsid) {
      query = query.eq("bitsid", bitsid);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    if (!data.length) {
      return res.status(404).json({ message: "No users found" });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message || "An unexpected error occurred",
    });
  }
});

// Update DELETE /database route
router.delete("/database", async (req, res, next) => {
  const { name, cfid, bitsid } = req.body;

  if (!name || !cfid || !bitsid) {
    return res.status(400).json({
      error: "All fields (name, cfid, bitsid) are required to delete a user",
    });
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .delete()
      .match({ name, cfid, bitsid });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.length) {
      return res
        .status(404)
        .json({ message: "No matching user found to delete" });
    }

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message || "An unexpected error occurred",
    });
  }
});

// get the [bitsid, cfid, name, rating, rank, creationTime] of all users
router.get("/all", async (req, res, next) => {
  try {
    const { data: docs, error: fetchError } = await supabase
      .from("users")
      .select("bitsid, cfid, name");

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    if (!docs.length) {
      return res.status(404).json({ message: "No users found" });
    }

    // Create an array of Codeforces IDs (cfid) in lowercase
    const cfids = docs.map((user) => user.cfid.toLowerCase());
    const chunkSize = 400;
    const cfidChunks = [];
    for (let i = 0; i < cfids.length; i += chunkSize) {
      cfidChunks.push(cfids.slice(i, i + chunkSize));
    }

    // Fetch user info from Codeforces API in chunks of 400
    let allCfData = [];
    for (const chunk of cfidChunks) {
      const userString = chunk.join(";");
      const url = `https://codeforces.com/api/user.info?handles=${userString}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch user info from Codeforces API");
      }

      const data = await response.json();

      if (data.status !== "OK" || !data.result) {
        throw new Error("Invalid response from Codeforces API");
      }

      allCfData = allCfData.concat(data.result);
    }

    const cfDataMap = new Map();
    allCfData.forEach((cfData) => {
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

module.exports = router;
