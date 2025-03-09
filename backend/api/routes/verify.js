const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const cors = require("cors");
router.use(cors());
const User = require("../models/users");

function checkIfUserExists(name, cfid, bitsid) {
  return User.find({ $or: [{ bitsid: bitsid }, { cfid: cfid }] })
    .then((users) => users)
    .catch((err) => {
      console.error(err);
      return [];
    });
}

router.post("/", (req, res, next) => {
  // const backendResponse = await fetch("https://algoxxx.onrender.com/verify", {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify({
  //           ...userData,
  //           contestId: problem?.contestId,
  //           index: problem?.index,
  //         }),
  //       });
  //       if (backendResponse.status === 200) {
  //         router.push("/");
  //       } else {
  //         setError("Submission failed. Please try again.");
  //       }
  //     } else {
  //       setError("Failed to verify submission. Please try again.");
  const cfid = req.body.cfid;
  const name = req.body.name;
  const bitsid = req.body.bitsid;
  const contestId = req.body.contestId;
  const index = req.body.index;
  const url = `https://codeforces.com/api/user.status?handle=${cfid}`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      const submissions = data.result;
      const submission = submissions.find(
        (submission) =>
          submission.problem.contestId == contestId &&
          submission.problem.index == index &&
          submission.verdict == "COMPILATION_ERROR"
      );
      if (submission) {
        checkIfUserExists(name, cfid, bitsid)
          .then((users) => {
            if (users.length === 0) {
              const user = new User({
                _id: new mongoose.Types.ObjectId(),
                name: name,
                cfid: cfid,
                bitsid: bitsid,
              });

              user
                .save()
                .then((result) => {
                  res.status(201).json({
                    message: "Submission verified",
                    createdUser: result,
                  });
                })
                .catch((error) => {
                  res.status(500).json({
                    error: error,
                  });
                });
            } else {
              // res.status(400).json({
              //   message: "User already exists",
              // });
              const user = users[0];
              user.name = name;
              user.cfid = cfid;
              user.bitsid = bitsid;

              user
                .save()
                .then((result) => {
                  res.status(200).json({
                    message: "User details updated",
                    updatedUser: result,
                  });
                })
                .catch((error) => {
                  res.status(500).json({
                    error: error,
                  });
                });
            }
          })
          .catch((error) => {
            res.status(500).json({
              error: error,
            });
          });
      } else {
        res.status(400).json({
          message: "Submission not found",
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        error: error,
      });
    });
});

// router
//   .post("/forceUpdate", (req, res, next) => {
//     // the only difference is that if there's a user with the same bitsid or cfid, we'll delete it, and add our user
//     const cfid = req.body.cfid;
//     const name = req.body.name;
//     const bitsid = req.body.bitsid;

//     const submission = true;
//     if (submission) {
//       User.deleteMany({ $or: [{ bitsid: bitsid }, { cfid: cfid }] })
//         .then(() => {
//           const user = new User({
//             _id: new mongoose.Types.ObjectId(),
//             name: name,
//             cfid: cfid,
//             bitsid: bitsid,
//           });

//           user
//             .save()
//             .then((result) => {
//               res.status(201).json({
//                 message: "Submission verified",
//                 createdUser: result,
//               });
//             })
//             .catch((error) => {
//               res.status(500).json({
//                 error: error,
//               });
//             });
//         })
//         .catch((error) => {
//           res.status(500).json({
//             error: error,
//           });
//         });
//     } else {
//       res.status(400).json({
//         message: "Submission not found",
//       });
//     }
//   })
//   .catch((error) => {
//     res.status(500).json({
//       error: error,
//     });
//   });

module.exports = router;
