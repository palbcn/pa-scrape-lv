// generate first authors index from history
const fs = require("fs").promises;
const os = require("os");
const path = require("path");
const replaceDiacritics = require("replace-diacritics");

/* -------------------- string and date utils------------ */
function replaceNonWordChars(str, withstr) {
  return str.replace(/[\W]/g, withstr);
}
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
/* -------------------- author utils------------ */
function adjustAuthor(author="") {
  // trim the end of the name
  return author.replace(/[\-\.,\s]*$/, "");
}
function authorID(author="") {
  // simple hash of name to become an ID.
  function jenkinshash(s) { // jenkins one at a time hash
    let a = 0;
    for (let i = 0; i < s.length; i++) {
      a += s.charCodeAt(i);  a += a << 10;  a ^= a >> 6;
    }
    a += a << 3; a ^= a >> 11; a += (a << 15) & 4294967295;
    return a >>> 0;
  }
  let cleanauthor = replaceNonWordChars(
    replaceDiacritics(author).toLowerCase(),
    ""
  );
  return jenkinshash(cleanauthor).toString(36);
}
/* -------------------- article utils------------ */
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
/* -------------------- .data article files ------------ */
async function allHistory() {
  let dirname = "./.data";
  let files = await fs.readdir(dirname);
  files = files.filter(f => f.match(/articles[\.\-\d]+\.json$/i));
  return files;
}
/* -------------------- articles file ------------ */
async function allArticles(filename) {
  let text = await fs.readFile(path.join("./.data", filename), "utf8");
  let articles = JSON.parse(text);
  articles = articles.map(function(article, index) {
    article.filename = filename;
    article.fileID = dateFromArticlesFilename(filename).getTime();
    article.index = index;
    article.author = adjustAuthor(article.author);
    article.authorID = authorID(article.author);
    delete article.text;
    delete article.html;
    return article;
  });
  return articles;
}

/* ----------------------------- */
async function regenerateAuthors() {
  let allpapers = await allHistory(); // every day saved in .data
  let allarticles = await Promise.all(
    allpapers.map(async function(paper) {
      // all articles in ecah day
      let articles = await allArticles(paper);
      return articles;
    })
  );
  allarticles = [].concat(...allarticles); // concatenated in a single array
  let byauthor = {};
  allarticles.forEach(function(elem) {
    // grouped by authorID
    if (!byauthor[elem.authorID])
      byauthor[elem.authorID] = { author: elem.author, articles: [] };
    byauthor[elem.authorID].articles.push(elem);
  });

  byauthor = Object.keys(byauthor) // sorted alphabetically
    .sort((a, b) => byauthor[a].author.localeCompare(byauthor[b].author))
    .reduce((obj, key) => {
      obj[key] = byauthor[key];
      return obj;
    }, {});

  let results = { generated: Date.now(), authors: byauthor };
  // save the results
  await fs.writeFile(".data/authors.json", JSON.stringify(results), "utf8");
}

/* -------------------- main ------------ */
if (module.parent) {
  // we were require()d from somewhere else
  module.exports = regenerateAuthors;
  
} else {
  (async function() {
    try {
      await regenerateAuthors();
      console.log("Saved in .data/authors.json");
    } catch (error) { console.error("The Big Catch", error);  }
  })();
}


