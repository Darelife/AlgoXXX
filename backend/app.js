const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
require("dotenv").config();

const databaseRoutes = require("./api/routes/database");
const currentInfoRoutes = require("./api/routes/currentInfo");
const verifyRoutes = require("./api/routes/verify");

const app = express();

app.use(morgan("dev")); // middleware that logs requests to the console
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// ==========================================
// GLOBAL CORS MIDDLEWARE
// ==========================================
app.use((req, res, next) => {
  const ALLOWED_ORIGIN = "https://algomaniax.vercel.app";
  const restrictedMethods = ["POST", "PUT", "PATCH", "DELETE"];

  const isRestrictedMethod = restrictedMethods.includes(req.method);
  const isPreflightForRestricted =
    req.method === "OPTIONS" &&
    restrictedMethods.includes(req.headers["access-control-request-method"]);

  // Dynamically assign origin based on method
  if (isRestrictedMethod || isPreflightForRestricted) {
    res.header("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  } else {
    res.header("Access-Control-Allow-Origin", "*");
  }

  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );

  // Handle browser preflight checks
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH");
    return res.status(200).json({});
  }

  // Strictly block restricted methods from unapproved origins
  if (isRestrictedMethod) {
    const origin = req.headers.origin;
    if (origin !== ALLOWED_ORIGIN) {
      return res.status(403).json({
        error:
          "Access Denied: CORS policy restricts modifications to the official app.",
      });
    }
  }

  next();
});

// ==========================================
// ROUTE DEFINITIONS
// ==========================================
app.use("/database", databaseRoutes);
app.use("/currentInfo", currentInfoRoutes);
app.use("/verify", verifyRoutes);

// Root Route - Fixed to app.get so it doesn't swallow 404 errors
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Hello there, welcome to Algomaniax!",
  });
});

// ==========================================
// ERROR HANDLING
// ==========================================
// If the request reaches this point, i.e., it wasn't able to find the above routes, it throws the following error!
app.use((req, res, next) => {
  const error = new Error("Not found");
  error.status = 404;
  next(error);
});

// error status code 500 means internal server error
app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
    },
  });
});

module.exports = app;
