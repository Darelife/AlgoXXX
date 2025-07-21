const express = require("express");
const router = express.Router();
const supabase = require("../../supabaseClient");

function checkIfUserExists(name, cfid, bitsid) {
  // First delete any users with matching BITS ID or CF ID
  return User.deleteMany({ $or: [{ bitsid: bitsid }, { cfid: cfid }] })
    .then(() => {
      // After deletion, return an empty array since we've deleted any matches
      // This will cause the code to treat it as a new user
      return [];
    })
    .catch((err) => {
      console.error("Error deleting existing users:", err);
      return [];
    });
}

router.post("/", async (req, res, next) => {
  const { cfid, name, bitsid, contestId, index } = req.body;
  const url = `https://codeforces.com/api/user.status?handle=${cfid}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    const submissions = data.result;
    const submission = submissions.find(
      (submission) =>
        submission.problem.contestId == contestId &&
        submission.problem.index == index &&
        submission.verdict == "COMPILATION_ERROR"
    );

    if (submission) {
      const users = await checkIfUserExists(name, cfid, bitsid);

      if (users.length === 0) {
        const { data: createdUser, error: createError } = await supabase
          .from("users")
          .insert({ name, cfid, bitsid });

        if (createError) {
          return res.status(500).json({ error: createError.message });
        }

        return res.status(201).json({
          message: "Submission verified",
          createdUser,
        });
      } else {
        const { data: updatedUser, error: updateError } = await supabase
          .from("users")
          .update({ name, cfid, bitsid })
          .eq("cfid", cfid);

        if (updateError) {
          return res.status(500).json({ error: updateError.message });
        }

        return res.status(200).json({
          message: "User details updated",
          updatedUser,
        });
      }
    } else {
      return res.status(400).json({ message: "Submission not found" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error.message || "An unexpected error occurred",
    });
  }
});

module.exports = router;
