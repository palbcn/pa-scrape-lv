
/*
 leer la opinión de La Vanguardia
 Pere Albert, Barcelona. palbcn@yahoo.com
*/
import request from "superagent";
import cheerio from "cheerio";

async function scrapeArticlesList() {
  let res = await request("https://www.lavanguardia.com");
  let $ = cheerio.load(res.text);
  let articles = [];
  let $allopinion = $("a.opinion-header-title-link, article.tpl-analisis a.story-header-title-link");
  $allopinion.each(function () {
    let lnk = $(this).attr('href');
    let title = $(this).text();
    articles.push({ title, lnk });
  });
  return articles;
}

function extractArticleContent(html) {
  function removeUnwantedLines(txt) {
    let unwanted = [/^\| Actualizado a /, /^Comparte en /, /^\d+\s*$/];
    let lines = txt.split(/\r?\n/);
    let wanted = lines.filter(e => !unwanted.some(r => r.test(e)));
    return wanted.join("\n");
  }
  let $ = cheerio.load(html);
  let datePublished = $("meta[itemprop=datePublished]").attr("content");
  let fullArticle = $("article");
  let title = fullArticle.find("header h1").text().trim();
  let author = fullArticle.find("a.story-leaf-author-link").text().trim();
  let bodyArticle = fullArticle.find("[itemprop=articleBody]");
  let paragraphs = bodyArticle[0].children.filter(element => element.type === "tag" && element.name === "p");
  let fullHtml = '<p>' + paragraphs.map(element => $(element).html()).join('</p>\n<p>') + '</p>';
  let fullText = fullArticle
    .text()
    .replace(/\t/g, " ") // replace tabs
    .replace(/ *(\n|\r|\r\n) */g, "\n")
    .replace(/\n+(?=\n)/g, "") // Replace multiple lines with single line
    .replace(/ +(?= )/g, "");
  let cleanText = removeUnwantedLines(fullText);
  return { title, author, datePublished, text: cleanText, html: fullHtml };
}

export async function scrapeArticles() {
  let articles = await scrapeArticlesList();
  let fullArticles = await Promise.all(articles.map(async function (article) {
    let full = Object.assign({}, article)
    let resArt = await request(article.lnk);
    let content = extractArticleContent(resArt.text);
    Object.assign(full, content);
    return full;
  }));
  return fullArticles;
}

/*
if (require.main === module) {

  (async () => {
    try {
      let all = await scrapeArticles();
      all.forEach((a, i) => console.log(`
________________________________________________________________
#${i} ${a.title} [${a.lnk}]
${a.author}
${new Date(a.datePublished).toLocaleString('es')}

${a.text}
    `))
    } catch (err) {
      console.error(err);
    }
  })();

} else {

  module.exports = scrapeArticles;
}
*/
