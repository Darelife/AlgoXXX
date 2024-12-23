const http = require("http"); // to handle HTTP requests
const app = require("./app"); // imports the express application defined in app.js
const port = process.env.PORT || 3000;

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
