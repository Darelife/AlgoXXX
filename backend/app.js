const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const databaseRoutes = require("./api/routes/database");
const currentInfoRoutes = require("./api/routes/currentInfo");
const verifyRoutes = require("./api/routes/verify");

const app = express();
app.use(cors());
app.use(morgan("dev")); //middleware that logs requests to the console
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use("/database", databaseRoutes);
app.use("/currentInfo", currentInfoRoutes);
app.use("/verify", verifyRoutes);

app.use((req, res, next) => {
  //all the requests and responses have to pass through our app and the next parameter allows us to pass them to the next middleware to be processed/executed
  res.status(200).json({
    //status 200 indicates "OK"
    message: "Hello there, welcome to Algomaniax!", //custom JSON message
  });
});

//if the request reaches this point, i.e., it wasn't able to find the above two routes, it throws the following error!
app.use((req, res, next) => {
  const error = new Error("Not found");
  error.status = 404;
  next(error);
});

//error status code 500 means internal server error, the following middleware might not be useful at this point, but later on when we add a database and it has its own operations and something fails, our request will reach this and throw an error accordingly
app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
    },
  });
});

app.use((req, res, next) => {
  // Dynamically set allowed origin for CORS
  const allowedOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://algomaniax.vercel.app",
    // "https://www.postman.com",
    // "https://postman.com",
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});

module.exports = app; //lets us use our express app elsewhere in the backend program
