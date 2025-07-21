const express = require("express");
const router = express.Router();
const supabase = require("../../supabaseClient");

async function checkIfUserExists(name, cfid, bitsid) {
  try {
    // Delete any users with matching BITS ID or CF ID
    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .or(`bitsid.eq.${bitsid},cfid.eq.${cfid}`);

    if (deleteError) {
      console.error("Error deleting existing users:", deleteError.message);
      return [];
    }

    // Return an empty array since we've deleted any matches
    return [];
  } catch (err) {
    console.error("Unexpected error deleting users:", err);
    return [];
  }
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
