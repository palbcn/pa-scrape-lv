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
    article.index = index;
    article.textLength = article.text?article.text.length:0;
    delete article.text;
    delete article.html;
    return article;
  });
  return articles;
}

/* ----------------------------- */
async function notDownloadedArticles() {
  let allpapers = await allHistory(); // every day saved in .data
  let allarticles = await Promise.all(
    allpapers.map(async function(paper) {
      // all articles in ecah day
      let articles = await allArticles(paper);
      return articles;
    })
  );
  allarticles = [].concat(...allarticles); // concatenated in a single array  
  let results = allarticles.filter( art => art.author===undefined );
  return results;
}

/* -------------------- main ------------ */

  (async function() {
    try {
      let articles = await notDownloadedArticles();
      articles.forEach( art => {
        console.log(JSON.stringify(art))
      })
    } catch (error) { console.error("The Big Catch", error);  }
  })();



