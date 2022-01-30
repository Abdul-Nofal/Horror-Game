const express = require("express");
const app = express();

let server = app.listen(3000, () => {
  console.log("Node server running...");
});

app.use(express.static("public"));