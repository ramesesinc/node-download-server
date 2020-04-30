const path = require("path");
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const serveIndex = require("serve-index");

const rconfig = require("./api/rameses-config-builder");

const port = process.env.port || 8000;

app.use("/", express.static("public"));

app.use(
  "/config",
  express.static("public"),
  serveIndex("public", {
    icons: true,
    stylesheet: path.join(__dirname, "res", "serve-index.css")
  })
);

app.use("/config/rebuild", function(req, res, next) {
  try {
    rconfig.buildUpdatesXml(__dirname);
    res.send("Configuration successfully rebuilt.");
  } catch (err) {
    const errData = { error: err.message };
    if (req.query.trace == "true") {
      errData.trace = err.stack;
    }
    res.send(JSON.stringify(errData));
  }
});

app.use(function(req, res, next) {
  res.status(404).send("Request not found.");
});

rconfig.buildUpdatesXml(__dirname);

http.listen(port, err => {
  if (err) {
    console.log(err);
  } else {
    console.log(`Server listening on port ${port}`);
  }
});
