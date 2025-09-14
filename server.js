const express = require("express");
const { scrapeArticle } = require("./scraper");
const urls = require("./urls");

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.get("/articles", async (req, res) => {
  try {
    req.setTimeout(60000); 
    
    res.setHeader('Content-Type', 'application/json');
    const batchSize = 10;
    const results = [];
    
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(url => scrapeArticle(url))
      );
      
      const processedResults = batchResults.map(result => 
        result.status === 'fulfilled' ? result.value : { error: 'Batch processing failed' }
      );
      
      results.push(...processedResults);
    }
    
    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error('Error in /articles endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.get("/", (req, res) => {
  res.json({
    message: "News Scraper API",
    endpoints: {
      articles: "/articles",
      health: "/health"
    }
  });
});

app.use((req, res, next) => {
  res.status(404).json({ error: "Endpoint not found" });
});

app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

module.exports = app;