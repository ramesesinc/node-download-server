const path = require("path");
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const serveIndex = require("serve-index");

const excludedFileExtensions = ["myml", "pyml", "conf"];
const rconfig = require("./api/rameses-config-builder");

const port = process.env.port || 8000;

app.use("/", express.static("public"));

app.use(
  "/config",
  express.static("public"),
  serveIndex("public", {
    icons: true,
    stylesheet: path.join(__dirname, "res", "serve-index.css"),
    filter: (filename, idx, files, dir) => {
      for (let i = 0; i < excludedFileExtensions.length; i++) {
        if (filename.toLowerCase().endsWith(excludedFileExtensions[i])) {
          return false;
        }
      }
      return true;
    },
  })
);

app.get("/resources/downloads/config/", (req, res) => {
  const files = rconfig.buildUpdatesXml(__dirname);
  if (files.length > 0) {
    res.json(files);
  } else {
    res.status(404).send("Files not found");
  }
});

app.get("/resources/downloads/:filename", (req, res) => {
  const filename = req.params.filename;
  const files = rconfig.buildUpdatesXml(__dirname);
  const file = files.find(f => f.filename === filename)
  if (file) {
    res.set("Content-Type", "text/xml");
    res.send(file.xml);
  } else {
    res.status(404).send("Not found");
  }
});

app.use(function (req, res, next) {
  res.status(404).send("Request not found.");
});

http.listen(port, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log(`Server listening on port ${port}`);
  }
});
