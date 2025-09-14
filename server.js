const express = require("express");
const { scrapeArticle } = require("./scraper");
const urls = require("./urls");

const app = express();
const PORT = 3000;

app.get("/articles", async (req, res) => {
  const results = await Promise.all(urls.map(url => scrapeArticle(url)));
  res.json(results);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
