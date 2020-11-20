//const express = require("express");
//const scrapeArticles = require("./lavanguardia");
import { scrapeArticles } from "./lavanguardia.js";
import { promises as fs, constants as fsconstants } from "fs";
import express from "express";
import path from 'path';
import { promisify } from "util";
const __dirname = path.resolve();

let articles = [];
let started = Date.now();
let loaded = 0;

async function writeIfNotExists(name, data) {
  try {
    await fs.access(name, fsconstants.F_OK);
  } catch (err) {
    await fs.writeFile(name, data, 'utf8');
  }
}
function todayArticlesFilename() {
  let today = new Date();
  return path.join('.data', 'articles.' + today.getFullYear() + (today.getMonth() + 1) + today.getDate() + '.json');
}

async function obtainArticles() {
  try {
    articles = await scrapeArticles();
    loaded = Date.now();
    let name = todayArticlesFilename();
    await writeIfNotExists(name, JSON.stringify(articles));
  } catch (e) {
    console.error(e);
  }
};
obtainArticles();

let app = express();
app.get("/", (request, response) => {
  response.sendFile(__dirname + "/lavanguardia.html");
});

app.get("/articles", (request, response) => {
  if (articles.length === 0) return response.status(202).send("Request Accepted but data not ready yet. Retry later");
  if (Date.now() - loaded > 12 * 60 * 60 * 1000) obtainArticles(); // old data? refresh
  response.send(articles);
});

app.get("/info", (request, response) => {
  response.send({ started, loaded });
});

const listener = app.listen(process.env.PORT || 7454, () => {
  console.log("La Vanguardia scraper server is listening on port " + listener.address().port);
});
