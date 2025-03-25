const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to compute Pearson correlation coefficient
function computeCorrelation(x, y) {
  const n = x.length;
  if (n === 0) return null;

  const meanX = x.reduce((sum, val) => sum + val, 0) / n;
  const meanY = y.reduce((sum, val) => sum + val, 0) / n;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const xDiff = x[i] - meanX;
    const yDiff = y[i] - meanY;
    numerator += xDiff * yDiff;
    denomX += xDiff * xDiff;
    denomY += yDiff * yDiff;
  }

  if (denomX === 0 || denomY === 0) return 0;
  return numerator / Math.sqrt(denomX * denomY);
}

// Helper function to delay execution (useful for handling API rate limits)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// API Endpoints
app.get('/api/correlation', async (req, res) => {
  try {
    const { token1, token2, days = 30 } = req.query;
    
    if (!token1 || !token2) {
      return res.status(400).json({ error: 'Both token1 and token2 are required' });
    }

    console.log(`Fetching data for tokens: ${token1} and ${token2} for ${days} days`);

    // Fetch historical data for both tokens from CoinGecko with a delay between requests
    try {
      // Fetch first token
      const token1Response = await axios.get(`https://api.coingecko.com/api/v3/coins/${token1}/market_chart`, {
        params: { 
          vs_currency: 'usd', 
          days,
          precision: 'full'
        },
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Crypto Correlation Analyzer'
        }
      });
      
      // Add delay to avoid rate limiting
      await delay(1000);
      
      // Fetch second token
      const token2Response = await axios.get(`https://api.coingecko.com/api/v3/coins/${token2}/market_chart`, {
        params: { 
          vs_currency: 'usd', 
          days,
          precision: 'full'
        },
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Crypto Correlation Analyzer'
        }
      });
      
      // Extract price data
      const token1Prices = token1Response.data.prices.map(item => item[1]);
      const token2Prices = token2Response.data.prices.map(item => item[1]);

      if (!token1Prices.length || !token2Prices.length) {
        console.error('Empty price data received');
        return res.status(500).json({ error: 'No price data available for one or both tokens' });
      }

      console.log(`Received data points: ${token1Prices.length} for ${token1}, ${token2Prices.length} for ${token2}`);

      // Calculate correlation (use the smaller array length to avoid index errors)
      const minLength = Math.min(token1Prices.length, token2Prices.length);
      const correlation = computeCorrelation(
        token1Prices.slice(0, minLength),
        token2Prices.slice(0, minLength)
      );

      res.json({
        correlation,
        token1: token1,
        token2: token2,
        days: days,
        dataPoints: minLength
      });
    } catch (apiError) {
      console.error('CoinGecko API Error:', apiError.response ? apiError.response.data : apiError.message);
      
      if (apiError.response && apiError.response.status === 429) {
        return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
      }
      
      if (apiError.response && apiError.response.status === 404) {
        return res.status(404).json({ error: 'One or both tokens not found. Please check token IDs.' });
      }
      
      return res.status(500).json({ error: 'Failed to fetch data from CoinGecko API' });
    }
  } catch (error) {
    console.error('Server Error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API Endpoints for Basket Correlation
app.post('/api/basket-correlation', async (req, res) => {
  try {
    const { basket1, basket2, days = 30 } = req.body;
    
    if (!basket1 || !basket2 || !Array.isArray(basket1) || !Array.isArray(basket2)) {
      return res.status(400).json({ error: 'Both basket1 and basket2 are required and must be arrays' });
    }
    
    if (basket1.length === 0 || basket2.length === 0) {
      return res.status(400).json({ error: 'Both baskets must contain at least one token' });
    }

    console.log(`Calculating correlation between baskets: [${basket1.join(', ')}] and [${basket2.join(', ')}] for ${days} days`);

    try {
      // Fetch data for all tokens in both baskets
      const basket1Data = await fetchBasketData(basket1, days);
      const basket2Data = await fetchBasketData(basket2, days);
      
      // Calculate average price movements for each basket
      const basket1Avg = calculateBasketPriceMovements(basket1Data);
      const basket2Avg = calculateBasketPriceMovements(basket2Data);
      
      // Ensure both arrays have the same length
      const minLength = Math.min(basket1Avg.length, basket2Avg.length);
      
      // Calculate correlation between the two baskets
      const correlation = computeCorrelation(
        basket1Avg.slice(0, minLength),
        basket2Avg.slice(0, minLength)
      );
      
      res.json({
        correlation,
        basket1: basket1,
        basket2: basket2,
        days: days,
        dataPoints: minLength
      });
    } catch (apiError) {
      console.error('CoinGecko API Error:', apiError.response ? apiError.response.data : apiError.message);
      
      if (apiError.response && apiError.response.status === 429) {
        return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
      }
      
      if (apiError.response && apiError.response.status === 404) {
        return res.status(404).json({ error: 'One or more tokens not found. Please check token IDs.' });
      }
      
      return res.status(500).json({ error: 'Failed to fetch data from CoinGecko API' });
    }
  } catch (error) {
    console.error('Server Error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to fetch data for all tokens in a basket
async function fetchBasketData(tokens, days) {
  const basketData = [];
  
  for (const token of tokens) {
    console.log(`Fetching data for token: ${token}`);
    
    const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${token}/market_chart`, {
      params: { 
        vs_currency: 'usd', 
        days,
        precision: 'full'
      },
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Crypto Correlation Analyzer'
      }
    });
    
    basketData.push({
      token,
      prices: response.data.prices.map(item => item[1])
    });
    
    // Add delay to avoid rate limiting
    await delay(1000);
  }
  
  return basketData;
}

// Helper function to calculate average price movements for a basket
function calculateBasketPriceMovements(basketData) {
  // Find the token with the minimum number of data points
  const minLength = Math.min(...basketData.map(item => item.prices.length));
  
  // Normalize all token arrays to the same length
  const normalizedData = basketData.map(item => {
    return item.prices.slice(0, minLength);
  });
  
  // Calculate average price for each data point across all tokens in the basket
  const avgPrices = [];
  for (let i = 0; i < minLength; i++) {
    const sum = normalizedData.reduce((acc, prices) => acc + prices[i], 0);
    avgPrices.push(sum / normalizedData.length);
  }
  
  return avgPrices;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 