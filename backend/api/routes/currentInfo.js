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

// get the current profilepic, rating, rank, creationTime, problems, etc of any user
router.get("/:userId", (req, res, next) => {});

// get the [bitsid, cfid, name, rating, rank, problems, creationTime] of all users
router.get("/all", (req, res, next) => {});

module.exports = router;
