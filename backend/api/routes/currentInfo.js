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

// Route to fetch all questions from algosheet table
router.get("/algosheet", async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("algosheet")
      .select(
        "questionName, questionLink, questionRating, questionTags, contributor, topic"
      );

    if (data) {
      data.forEach((question) => {
        if (question.questionTags) {
          question.questionTags = question.questionTags
            .split(",")
            .map((tag) => tag.trim());
        }
      });
    }

    if (error) {
      throw new Error(error.message);
    }

    if (!data.length) {
      return res.status(404).json({ message: "No questions found" });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message || "An unexpected error occurred",
    });
  }
});

// List of approved email IDs who can vote on question suggestions
const APPROVED_VOTERS = [
  "f20220433@goa.bits-pilani.ac.in",
  "f20221145@goa.bits-pilani.ac.in",
  "f20220050@goa.bits-pilani.ac.in",
  "f20221121@goa.bits-pilani.ac.in",
  "f20220076@goa.bits-pilani.ac.in",
  "f20221127@goa.bits-pilani.ac.in",
  "f20230458@goa.bits-pilani.ac.in",
  "f20230406@goa.bits-pilani.ac.in",
  "f20230788@goa.bits-pilani.ac.in",
  "f20230339@goa.bits-pilani.ac.in",
  "f20230630@goa.bits-pilani.ac.in",
  "f20230444@goa.bits-pilani.ac.in",
  "f20230356@goa.bits-pilani.ac.in",
  "f20230483@goa.bits-pilani.ac.in",
  "f20230602@goa.bits-pilani.ac.in",
  "f20220317@goa.bits-pilani.ac.in",
  "f20220545@goa.bits-pilani.ac.in",
  "f20220588@goa.bits-pilani.ac.in",
  "f20220244@goa.bits-pilani.ac.in",
  "f20220059@goa.bits-pilani.ac.in",
  "f20220389@goa.bits-pilani.ac.in",
  "f20220232@goa.bits-pilani.ac.in",
  "f20220106@goa.bits-pilani.ac.in",
  "f20220343@goa.bits-pilani.ac.in",
  "f20221259@goa.bits-pilani.ac.in",
  "f20212668@goa.bits-pilani.ac.in",
  "f20212628@goa.bits-pilani.ac.in",
  "f20212067@goa.bits-pilani.ac.in",
  "f20213055@goa.bits-pilani.ac.in",
  "f20212567@goa.bits-pilani.ac.in",
  "f20212538@goa.bits-pilani.ac.in",
  "f20212787@goa.bits-pilani.ac.in",
  "f20211440@goa.bits-pilani.ac.in",
  "f20230442@goa.bits-pilani.ac.in",
  "f20230409@goa.bits-pilani.ac.in",
  "f20230454@goa.bits-pilani.ac.in",
  "f20230377@goa.bits-pilani.ac.in",
  "f20230468@goa.bits-pilani.ac.in",
  "f20230860@goa.bits-pilani.ac.in",
];

// Function to check if an email is approved (with more flexible checking for testing)
const isApprovedVoter = (email) => {
  const emailLower = email.toLowerCase();

  // Direct match check
  if (APPROVED_VOTERS.includes(emailLower)) {
    return true;
  }

  // For testing purposes, allow any BITS email to vote
  // Comment this out in production and only use the APPROVED_VOTERS list
  if (emailLower.endsWith("@goa.bits-pilani.ac.in")) {
    console.log("Allowing BITS email for testing:", emailLower);
    return true;
  }

  return false;
};

// Route to fetch all suggested questions from algosheetreq table (without contributor names)
router.get("/algosheetreq", async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("algosheetreq")
      .select(
        "id, questionName, questionLink, questionRating, questionTags, topic, Approvals, approvers"
      )
      .order("created_at", { ascending: false });

    if (data) {
      data.forEach((question) => {
        if (question.questionTags) {
          question.questionTags = question.questionTags
            .split(",")
            .map((tag) => tag.trim());
        }
        // Ensure approvals field exists and is a number
        question.approvals = question.Approvals || 0;
        // Ensure approvers field exists
        question.approvers = question.approvers || "";
      });
    }

    if (error) {
      throw new Error(error.message);
    }

    return res.status(200).json(data || []);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message || "An unexpected error occurred",
    });
  }
});

// Route to submit question suggestions to algosheetreq table
router.post("/algosheetreq", async (req, res, next) => {
  try {
    const { questions, contributor } = req.body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: "Questions array is required" });
    }

    if (!contributor) {
      return res.status(400).json({ error: "Contributor name is required" });
    }

    // Add contributor and initialize approvals to each question
    const questionsWithContributor = questions.map((question) => ({
      ...question,
      contributor: contributor,
      Approvals: 0,
    }));

    const { data, error } = await supabase
      .from("algosheetreq")
      .insert(questionsWithContributor);

    if (error) {
      throw new Error(error.message);
    }

    return res.status(201).json({
      message: "Questions submitted successfully",
      count: questions.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message || "An unexpected error occurred",
    });
  }
});

// Route to approve a question suggestion
router.post("/algosheetreq/approve", async (req, res, next) => {
  try {
    const { questionId, voterEmail } = req.body;

    console.log("Approval request received:", { questionId, voterEmail });

    if (!questionId) {
      return res.status(400).json({ error: "Question ID is required" });
    }

    if (!voterEmail) {
      return res.status(400).json({ error: "Voter email is required" });
    }

    // Check if the voter is in the approved list
    console.log("Checking if email is approved:", voterEmail.toLowerCase());
    console.log("Approved voters list:", APPROVED_VOTERS);

    if (!isApprovedVoter(voterEmail)) {
      console.log("Email not found in approved voters list");
      return res
        .status(403)
        .json({ error: "You are not authorized to vote on questions" });
    }

    console.log("Email is approved, proceeding with vote...");

    // Check if the question exists
    const { data: questionData, error: fetchError } = await supabase
      .from("algosheetreq")
      .select("*")
      .eq("id", questionId)
      .single();

    if (fetchError || !questionData) {
      return res.status(404).json({ error: "Question not found" });
    }

    console.log("Question found:", questionData);

    // Extract username from email (before @)
    const voterUsername = voterEmail.split("@")[0];
    console.log("Voter username:", voterUsername);

    // Check if user has already voted by checking the approvers list
    const currentApprovers = questionData.approvers || "";
    const approversList = currentApprovers
      ? currentApprovers.split(",").map((name) => name.trim())
      : [];

    console.log("Current approvers:", approversList);

    if (approversList.includes(voterUsername)) {
      console.log("User has already voted on this question");
      return res
        .status(400)
        .json({ error: "You have already voted on this question" });
    }

    // Add the voter to the approvers list
    const updatedApproversList = [...approversList, voterUsername];
    const updatedApprovers = updatedApproversList.join(",");

    // Increment the approvals count
    const currentApprovals =
      questionData.Approvals || questionData.approvals || 0;
    const newApprovals = currentApprovals + 1;

    console.log(
      "Current approvals:",
      currentApprovals,
      "New approvals:",
      newApprovals
    );
    console.log("Updated approvers list:", updatedApprovers);

    const { error: updateError } = await supabase
      .from("algosheetreq")
      .update({
        Approvals: newApprovals,
        approvers: updatedApprovers,
      })
      .eq("id", questionId);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error(updateError.message);
    }

    console.log("Approvals and approvers updated successfully");

    // If approvals reach 5, move to algosheet and delete from algosheetreq
    if (newApprovals >= 5) {
      console.log("Question reached 5 approvals, moving to main sheet...");

      // Insert into algosheet
      const { error: insertError } = await supabase.from("algosheet").insert({
        questionName: questionData.questionName,
        questionLink: questionData.questionLink,
        questionRating: questionData.questionRating,
        questionTags: questionData.questionTags,
        topic: questionData.topic,
        contributor: questionData.contributor,
      });

      if (insertError) {
        console.error("Insert error:", insertError);
        throw new Error(insertError.message);
      }

      console.log("Question inserted into algosheet successfully");

      // Delete from algosheetreq
      const { error: deleteError } = await supabase
        .from("algosheetreq")
        .delete()
        .eq("id", questionId);

      if (deleteError) {
        console.error("Delete error:", deleteError);
        throw new Error(deleteError.message);
      }

      console.log("Question deleted from algosheetreq successfully");

      return res.status(200).json({
        message: "Question approved and moved to main sheet",
        approvedAndMoved: true,
        approvals: newApprovals,
        approvers: updatedApprovers,
      });
    }

    return res.status(200).json({
      message: "Question approved successfully",
      approvals: newApprovals,
      approvers: updatedApprovers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message || "An unexpected error occurred",
    });
  }
});

module.exports = router;
