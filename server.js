const express = require("express");
const fs = require("fs");
const path = require("path");
const scraper = require("./scraper");
const regenerateAuthors = require("./regenerateauthors");

/* -------------------- util functions ------ */
function zeroPad(num, places) {
  return String(num).padStart(places, "0");
}
function yyyymmdd(date) {
  return (
    "" +
    date.getFullYear() +
    "-" +
    zeroPad(date.getMonth() + 1, 2) +
    "-" +
    zeroPad(date.getDate(), 2)
  );
}

/* -------------------- article filename utils------------ */
function articlesFileBaseName(date) {
  return "articles." + yyyymmdd(date) + ".json";
}
function articlesFileFullName(date) {
  return path.resolve(path.join(".data", articlesFileBaseName(date)));
}
function todayArticlesFilename() {
  let today = new Date();
  return articlesFileFullName(today);
}
function dateFromArticlesFilename(name) {
  let datestr = name.split(".")[1];
  return new Date(datestr);
}

/* -------------------- server global data ---- */
let articles = [];
let authors = {};
let started = Date.now();
let loaded = 0;  

/* -------------------- articles ------------ */
async function fetchArticles() {
  try {
    articles = await scraper.scrapeArticles();
    loaded = Date.now();
    console.log(`articles loaded in ${loaded - started} ms`);
    let name = todayArticlesFilename();
    fs.writeFile(name, JSON.stringify(articles), "utf8", function(err) {
      if (err) console.log("creation", name, "failed", err);
    });
  } catch (e) {
    console.error(e);
  }
}
async function obtainArticles() {
  let name = todayArticlesFilename();
  fs.readFile(name, "utf8", (err, content) => {
    if (err) return fetchArticles();
    articles = content;
    fs.stat(name, function(err, stat) {
      loaded = stat.mtime;
    });
  });
}
obtainArticles();

/* -------------------- authors ---------- */
function authorsFileName() {
  return path.join(".data", "authors.json");
}
async function obtainAuthors() {
  let name = authorsFileName();
  fs.readFile(name, "utf8", (err, content) => {
    authors = JSON.parse(content);
    fs.stat(name, function(err, stat) {
      authors.loaded = stat.mtime;
    });
  });
}
regenerateAuthors(); 
obtainAuthors();

/* -------------------- server routes ------ */
let app = express();
app.use(express.static("client"));

app.get("/articles", (request, response) => {
  if (articles.length === 0) {
    return response
      .status(202)
      .send("Request Accepted but data not ready yet. Retry later");
  }
  //if (Date.now() - loaded > 12 * 60 * 60 * 1000) fetchArticles(); // data older than 12h? refresh
  response.send(articles);
});

app.get("/authors", (request, response) => {
  if (!authors.loaded) {
    obtainAuthors();
    return response
      .status(202)
      .send("Request Accepted but data not ready yet. Retry later");
  }
  response.send(authors);
});

app.get("/info", (request, response) => {
  response.send({ started, loaded });
});

app.get("/history", (request, response) => {
  fs.readdir(".data", (err, files) => {
    if (err) return response.status(404).send({ err });
    let history = files
      .filter( fn => fn.startsWith('articles') )
      .map( fn => dateFromArticlesFilename(fn) );
    response.send(history);
  });
});

async function removeArticlesFileAndRespond(fn,response) {
  let backupfn = path.join(
    path.dirname(fn),
    path.basename(fn, ".json") + "." + Date.now() + ".bck"
  );
  try {
    await fs.promises.stat(fn);   
    await fs.promises.rename(fn,backupfn);
    return response.send("OK");
  } catch(err) {
    return response.status(404,{err})
  }
}
  

app.delete("/history" , (request, response) => {
  let fn = todayArticlesFilename();
  removeArticlesFileAndRespond(fn,response)
});

app.delete("/history/:date", (request, response) => {
  let fn = articlesFileFullName(new Date(Number(request.params.date)));
  removeArticlesFileAndRespond(fn,response);
}); 

app.get("/history/:date", (request, response) => {
  fs.readFile(
    articlesFileFullName(new Date(Number(request.params.date))),
    "utf8",
    (err, content) => {
      if (err) return response.status(404).send({ err });
      response.send(content);
    }
  );
});
const listener = app.listen(process.env.PORT, () => {
  console.log(
    `La Vanguardia scraper server is listening on port ${
      listener.address().port
    }`
  );
});
