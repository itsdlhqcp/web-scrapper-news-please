const axios = require("axios");
const cheerio = require("cheerio");

async function scrapeArticle(url) {
  try {
    const { data } = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(data);

    // (title, text, date)
    let title = $("meta[property='og:title']").attr("content") || $("title").text();
    let description = $("meta[property='og:description']").attr("content") || "";
    let text = $("p").map((i, el) => $(el).text()).get().join(" ");

    return {
      url,
      title: title.trim(),
      description: description.trim(),
      content: text.slice(0, 500) + "...", 
    };
  } catch (err) {
    return { url, error: "Failed to scrape" };
  }
}

module.exports = { scrapeArticle };
