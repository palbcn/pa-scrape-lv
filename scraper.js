/*
 leer la opinión de La Vanguardia
 pa bcn
*/

const request = require("superagent");
const cheerio = require("cheerio");

async function scrapeArticlesList() {
  try {
    const ROOT = "https://www.lavanguardia.com";
    let res = await request(ROOT);
    let $ = cheerio.load(res.text);
    let $allopinion = $("article.article-module-opinion, article.article-module-editorial");
    let $lacontra = $( "article .lacontra-container").parent().parent();
    $allopinion = $allopinion.add( $lacontra );
    let articles = [];
    $allopinion.each(function () {
      let $a = $(this).find("a");
      $a.each(function () {
        let lnk = ROOT + $(this).attr('href');
        let title = $(this).text();
        articles.push({
          title,
          lnk
        });
      });
    });
    return articles;
  } catch (e) {
    console.error("scrapeArticlesList",e.message);
    return [];
  }
}

function includeTrailingPeriod(str) {
  const PERIOD = '.';  
  if (str!=='' && str.substr(-1) != PERIOD ) str += PERIOD;
  return str;
}

function extractArticleContent(html) {
  try {
    let $ = cheerio.load(html);
    let datePublished = $("meta[name=date]").attr("content");  // was $("meta[itemprop=datePublished]")
    let fullArticle = $("article");
    let title = includeTrailingPeriod(fullArticle.find("header h1").text().trim());
    //let subtitle = fullArticle.find("header h2").text().trim();
    let author = fullArticle.find(".author-opinion-name").text().trim();
    let bodyArticle = fullArticle.find("div.article-modules");
    let paragraphs = bodyArticle[0].children.filter(element => element.type === "tag" && element.name === "p");
    let bodyHtml = '<p>' + paragraphs.map(element => $(element).html()).join('</p>\n<p>') + '</p>';
    let header = bodyArticle.find("span.content-subtitle").text().split('\n').map(e => includeTrailingPeriod(e.trim())).join(' ').trim();
    let lacontra = fullArticle.find("header figcaption .interviewed").text().trim();
    lacontra += fullArticle.find("h2.epigraph").text().trim();
    header += lacontra;
    let bodyText = fullArticle
      .text()
      .replace(/\t/g, " ") // replace tabs
      .replace(/ *(\n|\r|\r\n) */g, "\n")
      .replace(/\n+(?=\n)/g, "") // Replace multiple lines with single line
      .replace(/ +(?= )/g, "");
    return { title, header, author, datePublished, text: bodyText, html: bodyHtml };
  } catch (e) {
    console.error("extractArticleContent",e.message);
    return { };
  }
}

async function scrapeArticles() {
  let articles = await scrapeArticlesList();
  let fullArticles = await Promise.all(
    articles.map(async function(article) {
      try {
        let resArt = await request(article.lnk);
        let content = extractArticleContent(resArt.text);
        let full = Object.assign({}, article, content);
        return full;
      } catch (e) {
        console.error("scrapeArticle",e.message);
        return article;
      }
    })   
  );
  return fullArticles;  
}

module.exports = { scrapeArticles };
