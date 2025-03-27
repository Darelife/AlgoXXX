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

// keep only 1 user per codeforces id, if it matches with another, delete it, and also, it's case insensitive
router.get("/cleanupDuplicateCfid", (req, res, next) => {
  User.find()
    .exec()
    .then((users) => {
      const processedCfids = new Map();
      const duplicateUserIds = [];

      // Find duplicates (case insensitive comparison)
      users.forEach((user) => {
        if (user.cfid) {
          const cfidLower = user.cfid.toLowerCase();

          if (processedCfids.has(cfidLower)) {
            // This is a duplicate
            duplicateUserIds.push(user._id);
          } else {
            // First occurrence
            processedCfids.set(cfidLower, user._id);
          }
        }
      });

      // also if same, bits id
      users.forEach((user) => {
        if (user.bitsid) {
          const bitsidLower = user.bitsid.toLowerCase();

          if (processedCfids.has(bitsidLower)) {
            // This is a duplicate
            duplicateUserIds.push(user._id);
          } else {
            // First occurrence
            processedCfids.set(bitsidLower, user._id);
          }
        }
      });

      // Delete all duplicates
      return User.deleteMany({ _id: { $in: duplicateUserIds } })
        .exec()
        .then((result) => {
          res.status(200).json({
            message: "Duplicate users removed successfully",
            deletedCount: result.deletedCount,
            duplicatesFound: duplicateUserIds.length,
          });
        });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ error });
    });
});

router.post("/", (req, res, next) => {
  const user = new User({
    _id: new mongoose.Types.ObjectId(),
    name: req.body.name,
    cfid: req.body.cfid,
    bitsid: req.body.bitsid,
  });

  user
    .save()
    .then((result) => {
      console.log(result);
      res.status(201).json({
        message: "Handling POST requests to /database route",
        createdUser: result,
      });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({
        error: error,
      });
    });
});
// all users
router.get("/", (req, res, next) => {
  User.find()
    .exec()
    .then((docs) => {
      console.log(docs);
      res.status(200).json(docs);
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({
        error: error,
      });
    });
});

// router.get("/deleteAll", (req, res, next) => {
//   User.deleteMany({})
//     .exec()
//     .then((result) => {
//       console.log(result);
//       res.status(200).json({
//         message: "All users deleted successfully!",
//         result: result,
//       });
//     })
//     .catch((error) => {
//       console.log(error);
//       res.status(500).json({
//         error: error,
//       });
//     });
// });

router.get("/:userId", (req, res, next) => {
  const id = req.params.userId;
  User.findById(id)
    .exec()
    .then((result) => {
      console.log(result);
      if (result) {
        res.status(200).json(result);
      } else {
        res.status(404).json({
          message: "No valid entry found for the provided ID!",
        });
      }
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({
        error: error,
      });
    });
});

router.delete("/:userId", (req, res, next) => {
  const id = req.params.userId;
  User.deleteOne({
    _id: id,
  })
    .exec()
    .then((result) => {
      console.log(result);
      res.status(200).json(result);
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({
        error: error,
      });
    });
});

module.exports = router;
