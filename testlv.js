
const fs = require('fs');
const cheerio = require('cheerio');

let text= fs.readFileSync(__dirname+"/testlv.html","utf-8");

let $ = cheerio.load(text);

let datePublished = $("meta[itemprop=datePublished]").attr("content");
let fullArticle = $("article");
let title = fullArticle.find("header h1").text().trim();
let author = fullArticle.find("a.story-leaf-author-link").text().trim();
let bodyArticle = fullArticle.find("[itemprop=articleBody]");
let paragraphs = bodyArticle[0].children.filter(element => element.type==="tag" && element.name==="p");
let fullhtml = paragraphs.map(element => $(element).removeAttr('class').html()).join('\n');
console.log(fullhtml);

