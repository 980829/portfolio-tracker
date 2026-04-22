// api/harga.js — Vercel Serverless Function
// Proxy ke Yahoo Finance untuk ambil harga saham IDX real-time

export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { tickers } = req.query;

  if (!tickers) {
    return res.status(400).json({ error: 'tickers parameter required' });
  }

  // Convert ticker list: "BBRI,SSMS" → "BBRI.JK,SSMS.JK"
  const yahooTickers = tickers
    .split(',')
    .map(t => t.trim().toUpperCase() + '.JK')
    .join(',');

  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${yahooTickers}&fields=regularMarketPrice,regularMarketChangePercent`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance error: ${response.status}`);
    }

    const data = await response.json();
    const quotes = data?.quoteResponse?.result || [];

    // Format response: { BBRI: 3270, SSMS: 1365, ... }
    const prices = {};
    quotes.forEach(q => {
      const ticker = q.symbol.replace('.JK', '');
      prices[ticker] = {
        price: Math.round(q.regularMarketPrice),
        changePct: parseFloat(q.regularMarketChangePercent?.toFixed(2) || 0)
      };
    });

    return res.status(200).json({ success: true, prices, updatedAt: new Date().toISOString() });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
