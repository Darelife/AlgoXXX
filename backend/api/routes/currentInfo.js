const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const User = require("../models/users");

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

// get the [bitsid, cfid, name, rating, rank, creationTime] of all users
router.get("/all", async (req, res, next) => {
  try {
    // Fetch all users from the database
    const docs = await User.find().exec();

    if (!docs.length) {
      return res.status(404).json({ message: "No users found" });
    }

    // Create a semicolon-separated string of Codeforces IDs (cfid)
    const userString = docs.map((user) => user.cfid).join(";");

    // Define the URL to fetch user data from Codeforces API
    const url = `https://codeforces.com/api/user.info?handles=${userString}`;
    console.log("Fetching URL:", url);

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
      cfDataMap.set(cfData.handle, cfData);
    });

    const updatedDocs = docs.map((user) => {
      const cfData = cfDataMap.get(user.cfid) || {}; // Use cfid to find corresponding data or default to an empty object

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
