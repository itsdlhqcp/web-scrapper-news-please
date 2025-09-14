const express = require("express");
const { scrapeArticle } = require("./scraper");
const urls = require("./urls");

const app = express();
// Use environment PORT or fallback to 3000
const PORT = process.env.PORT || 3001;

// Add CORS middleware for cross-origin requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Add timeout and error handling
app.get("/articles", async (req, res) => {
  try {
    // Set response timeout
    req.setTimeout(60000); // 60 seconds
    
    // Add response headers
    res.setHeader('Content-Type', 'application/json');
    
    // Process URLs in smaller batches to avoid timeout
    const batchSize = 10;
    const results = [];
    
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(url => scrapeArticle(url))
      );
      
      // Extract results from Promise.allSettled
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

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "News Scraper API",
    endpoints: {
      articles: "/articles",
      health: "/health"
    }
  });
});

// Handle 404 - use proper middleware syntax
app.use((req, res, next) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Error handler
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