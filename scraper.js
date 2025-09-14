const axios = require("axios");
const cheerio = require("cheerio");

async function scrapeArticle(url) {
  try {
    // Enhanced axios configuration for deployment
    const { data } = await axios.get(url, {
      timeout: 15000, // Increased timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      maxRedirects: 5,
      validateStatus: function (status) {
        return status >= 200 && status < 300;
      }
    });

    const $ = cheerio.load(data);

    // Enhanced content extraction with fallbacks
    let title = $("meta[property='og:title']").attr("content") || 
                $("meta[name='twitter:title']").attr("content") ||
                $("h1").first().text() ||
                $("title").text() ||
                "No title found";

    let description = $("meta[property='og:description']").attr("content") || 
                     $("meta[name='twitter:description']").attr("content") ||
                     $("meta[name='description']").attr("content") ||
                     "";

    // More robust text extraction
    let text = "";
    const contentSelectors = [
      'article p',
      '.article-content p',
      '.story-body p',
      '.content p',
      '.post-content p',
      'main p',
      'p'
    ];

    for (const selector of contentSelectors) {
      const paragraphs = $(selector);
      if (paragraphs.length > 0) {
        text = paragraphs.map((i, el) => $(el).text().trim())
                        .get()
                        .filter(paragraph => paragraph.length > 20) // Filter out short paragraphs
                        .join(" ");
        if (text.length > 100) break; // Use this selector if we got substantial content
      }
    }

    // If still no content, try getting all text
    if (text.length < 100) {
      text = $("body").text().replace(/\s+/g, ' ').trim();
    }

    return {
      url,
      title: title.trim().substring(0, 200), // Limit title length
      description: description.trim().substring(0, 300), // Limit description length
      content: text.length > 500 ? text.substring(0, 500) + "..." : text,
      scraped_at: new Date().toISOString(),
      success: true
    };
  } catch (err) {
    console.error(`Failed to scrape ${url}:`, err.message);
    
    return { 
      url, 
      title: "Failed to scrape",
      description: "",
      content: "",
      error: err.code === 'ENOTFOUND' ? 'DNS resolution failed' :
             err.code === 'ETIMEDOUT' ? 'Request timeout' :
             err.response?.status ? `HTTP ${err.response.status}` :
             'Failed to scrape',
      scraped_at: new Date().toISOString(),
      success: false
    };
  }
}

module.exports = { scrapeArticle };