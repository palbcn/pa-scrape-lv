# pa-scrape-lv

An example of web scraping with express.

## design

#### back-end

- the app starts at `server.js`, a simple web app based on `express`
- the scraping code resides in `scraper.js` that uses `superagent` and `cheerio`
- records the history of scraped pages as json files in `.data/`
- asynchronously regenerate authors code after scraping (so they might not be yet ready if page is invoked quickly)

#### front-end

- very simple html layout in `client/index.html` 
- front-end code in `/client/script.js` that uses `fetch` to obtain the info and plain DOM manipulation with vanilla javascript


# Run time

Hosted in [Glitch](https://glitch.com/)
