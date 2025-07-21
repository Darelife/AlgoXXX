const express = require("express");
const router = express.Router();
const supabase = require("../../supabaseClient");

// Cleanup duplicate Codeforces IDs
router.get("/cleanupDuplicateCfid", async (req, res) => {
  try {
    const { data: users, error } = await supabase.from("users").select("*");
    if (error) throw error;

    const processedCfids = new Map();
    const duplicateUserIds = [];

    users.forEach((user) => {
      if (user.cfid) {
        const cfidLower = user.cfid.toLowerCase();
        if (processedCfids.has(cfidLower)) {
          duplicateUserIds.push(user.id);
        } else {
          processedCfids.set(cfidLower, user.id);
        }
      }
    });

    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .in("cfid", duplicateUserIds);

    if (deleteError) throw deleteError;

    res.status(200).json({
      message: "Duplicate users removed successfully",
      deletedCount: duplicateUserIds.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Add a new user
router.post("/", async (req, res) => {
  try {
    const { name, cfid, bitsid, contestDelta } = req.body;
    const { data, error } = await supabase.from("users").insert([
      {
        name: name.trim(),
        cfid: cfid.trim(),
        bitsid: bitsid.trim(),
        contestDelta: contestDelta || 0,
      },
    ]);

    if (error) throw error;

    res.status(201).json({
      message: "User added successfully",
      createdUser: data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Get all users
router.get("/", async (req, res) => {
  try {
    const { data: users, error } = await supabase.from("users").select("*");
    if (error) throw error;

    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Get a user by ID
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("cfid", userId)
      .single();

    if (error) throw error;

    if (user) {
      res.status(200).json(user);
    } else {
      res
        .status(404)
        .json({ message: "No valid entry found for the provided ID!" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a user by ID
router.delete("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { error } = await supabase.from("users").delete().eq("cfid", userId);

    if (error) throw error;

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
