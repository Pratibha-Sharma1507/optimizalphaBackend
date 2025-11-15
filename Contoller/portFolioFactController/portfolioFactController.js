// const connection = require("../../Model/dbConnect");

// // 🟢 Level 1 – Asset Class 1 summary


// // 🟢 Get Asset Class 1 Summary (cleaned query)
// const getAssetClass1Summary = (req, res) => {
//   const query = `
//     SELECT 
//       asset_class,
//       today_total,
//       yesterday_total,
//       daily_return_pct,
//       \`3d_return_pct\`,
//       \`1w_return_pct\`,
//       mtd_return_pct,
//       fytd_return_pct
//     FROM assetclass_kpi_summary
//     ORDER BY asset_class;
//   `;

//   connection.query(query, (error, results) => {
//     if (error) {
//       console.error("❌ DB Error:", error);
//       return res.status(500).json({ error: error.sqlMessage });
//     }
//     res.status(200).json(results);
//   });
// };


// // Level 2 – Asset Class 2 summary for a given Asset Class 1
// const getAssetClass2Summary = (req, res) => {
//   const { asset1 } = req.params;
//   const query = `
//     SELECT 
//       \`Asset Class_1\`,
//       \`Asset Class_2\`,
//       SUM(today_total) AS total_today_total,
//       SUM(yesterday_total) AS total_yesterday_total,
//       SUM(today_total - yesterday_total) AS total_realized_pl,
//       AVG(daily_return_pct) AS avg_daily_return_pct,
//       AVG(\`3d_return_pct\`) AS avg_3d_return_pct,     --  Added 3-day return
//       AVG(\`1w_return_pct\`) AS avg_1w_return_pct,     -- Added 1-week return
//       AVG(mtd_return_pct) AS avg_mtd_return_pct,
//       AVG(fytd_return_pct) AS avg_fytd_return_pct
//     FROM portfolio_kpi_fact
//     WHERE \`Asset Class_1\` = ?
//     GROUP BY \`Asset Class_1\`, \`Asset Class_2\`
//     ORDER BY \`Asset Class_2\`;
//   `;
//   connection.query(query, [asset1], (error, results) => {
//     if (error) return res.status(500).json({ error: error.sqlMessage });
//     res.status(200).json(results);
//   });
// };

// // Level 3 – Portfolio details under Asset Class 1 + 2
// // const getPortfolioDetails = (req, res) => {
// //   const { asset1, asset2 } = req.params;
// //   const query = `
// //     SELECT 
// //       \`Asset Class_1\`,
// //       \`Asset Class_2\`,
// //       \`Portfolio Name\`,
// //       \`Category\`,
// //       \`Fund / Stock Ticker\`,
// //       today_total,
// //       yesterday_total,
// //       (today_total - yesterday_total) AS realized_pl,
// //       daily_return_pct,
// //       \`3d_return_pct\`,
// //       \`1w_return_pct\`,
// //       mtd_return_pct,
// //       fytd_return_pct
// //     FROM portfolio_kpi_fact
// //     WHERE \`Asset Class_1\` = ?
// //       AND \`Asset Class_2\` = ?
// //     ORDER BY \`Portfolio Name\`;
// //   `;
// //   connection.query(query, [asset1, asset2], (error, results) => {
// //     if (error) return res.status(500).json({ error: error.sqlMessage });
// //     res.status(200).json(results);
// //   });
// // };
// const getPortfolioDetails = (req, res) => {
//   const { asset1, asset2 } = req.params;

//   const query = `
//     SELECT 
//       \`Asset Class_1\`,
//       \`Asset Class_2\`,
//       \`Portfolio Name\`,
//       GROUP_CONCAT(DISTINCT \`Category\` ORDER BY \`Category\` SEPARATOR ', ') AS categories,
//       GROUP_CONCAT(DISTINCT \`Fund / Stock Ticker\` ORDER BY \`Fund / Stock Ticker\` SEPARATOR ', ') AS tickers,
//       SUM(today_total) AS today_total,
//       SUM(yesterday_total) AS yesterday_total,
//       SUM(today_total - yesterday_total) AS realized_pl,
//       ROUND(AVG(daily_return_pct), 4) AS daily_return_pct,
//       ROUND(AVG(\`3d_return_pct\`), 4) AS \`3d_return_pct\`,
//       ROUND(AVG(\`1w_return_pct\`), 4) AS \`1w_return_pct\`,
//       ROUND(AVG(mtd_return_pct), 4) AS mtd_return_pct,
//       ROUND(AVG(fytd_return_pct), 4) AS fytd_return_pct
//     FROM portfolio_kpi_fact
//     WHERE \`Asset Class_1\` = ?
//       AND \`Asset Class_2\` = ?
//     GROUP BY \`Portfolio Name\`
//     ORDER BY \`Portfolio Name\`;
//   `;

//   connection.query(query, [asset1, asset2], (error, results) => {
//     if (error) return res.status(500).json({ error: error.sqlMessage });
//     res.status(200).json(results);
//   });
// };






// module.exports = {
//   getAssetClass1Summary,
//   getAssetClass2Summary,
//   getPortfolioDetails
// };








const axios = require("axios");
const connection = require("../../Model/dbConnect");

// ---  Cache setup ---
let cachedRates = null;
let lastFetched = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour cache

// --- Utility: Convert INR → Target Currency ---
async function getInrToCurrencyRate(targetCurrency) {
  const now = Date.now();

  if (cachedRates && now - lastFetched < CACHE_TTL) {
    const usdToTarget = cachedRates[targetCurrency];
    const usdToInr = cachedRates["INR"];
    if (!usdToTarget || !usdToInr) return null;
    return +(usdToTarget / usdToInr).toFixed(4);
  }

  const response = await axios.get("https://api.exchangerate-api.com/v4/latest/USD");
  cachedRates = response.data.rates;
  lastFetched = now;

  const usdToTarget = cachedRates[targetCurrency];
  const usdToInr = cachedRates["INR"];
  if (!usdToTarget || !usdToInr) return null;

  return +(usdToTarget / usdToInr).toFixed(4);
}

//  Level 1 – Asset Class 1 Summary
const getAssetClass1Summary = async (req, res) => {
  const requestedCurrency = (req.query.currency || "INR").toUpperCase();

  const query = `
    SELECT 
      asset_class,
      today_total,
      yesterday_total,
      daily_return_pct,
      \`3d_return_pct\`,
      \`1w_return_pct\`,
      mtd_return_pct,
      fytd_return_pct
    FROM assetclass_kpi_summary
    ORDER BY asset_class;
  `;

  connection.query(query, async (error, results) => {
    if (error) return res.status(500).json({ error: error.sqlMessage });

    try {
      let rate = 1;
      if (requestedCurrency !== "INR") {
        rate = await getInrToCurrencyRate(requestedCurrency);
        if (!rate) return res.status(400).json({ error: `Currency '${requestedCurrency}' not supported` });
      }

      const converted = results.map((row) => ({
        ...row,
        currency: requestedCurrency,
        today_total: row.today_total ? +(row.today_total * rate).toFixed(2) : null,
        yesterday_total: row.yesterday_total ? +(row.yesterday_total * rate).toFixed(2) : null,
      }));

      res.status(200).json(converted);
    } catch (err) {
      console.error("Exchange rate fetch error:", err.message);
      res.status(502).json({ error: "Failed to fetch currency rate" });
    }
  });
};

//  Level 2 – Asset Class 2 Summary
const getAssetClass2Summary = async (req, res) => {
  const { asset1 } = req.params;
  const requestedCurrency = (req.query.currency || "INR").toUpperCase();

  const query = `
    SELECT 
      \`Asset Class_1\`,
      \`Asset Class_2\`,
      SUM(today_total) AS total_today_total,
      SUM(yesterday_total) AS total_yesterday_total,
      SUM(today_total - yesterday_total) AS total_realized_pl,
      AVG(daily_return_pct) AS avg_daily_return_pct,
      AVG(\`3d_return_pct\`) AS avg_3d_return_pct,
      AVG(\`1w_return_pct\`) AS avg_1w_return_pct,
      AVG(mtd_return_pct) AS avg_mtd_return_pct,
      AVG(fytd_return_pct) AS avg_fytd_return_pct
    FROM portfolio_kpi_fact
    WHERE \`Asset Class_1\` = ?
    GROUP BY \`Asset Class_1\`, \`Asset Class_2\`
    ORDER BY \`Asset Class_2\`;
  `;

  connection.query(query, [asset1], async (error, results) => {
    if (error) return res.status(500).json({ error: error.sqlMessage });

    try {
      let rate = 1;
      if (requestedCurrency !== "INR") {
        rate = await getInrToCurrencyRate(requestedCurrency);
        if (!rate) return res.status(400).json({ error: `Currency '${requestedCurrency}' not supported` });
      }

      const converted = results.map((row) => ({
        ...row,
        currency: requestedCurrency,
        total_today_total: row.total_today_total ? +(row.total_today_total * rate).toFixed(2) : null,
        total_yesterday_total: row.total_yesterday_total ? +(row.total_yesterday_total * rate).toFixed(2) : null,
      }));

      res.status(200).json(converted);
    } catch (err) {
      console.error("Exchange rate fetch error:", err.message);
      res.status(502).json({ error: "Failed to fetch currency rate" });
    }
  });
};

//  Level 3 – Portfolio Details
const getPortfolioDetails = async (req, res) => {
  const { asset1, asset2 } = req.params;
  const requestedCurrency = (req.query.currency || "INR").toUpperCase();

 const query = `
    SELECT 
      \`Asset Class_1\`,
      \`Asset Class_2\`,
      \`Portfolio Name\`,
      \`Category\`,
      \`Fund / Stock Ticker\`,
      today_total,
      yesterday_total,
      (today_total - yesterday_total) AS realized_pl,
      daily_return_pct,
      \`3d_return_pct\`,
      \`1w_return_pct\`,
      mtd_return_pct,
      fytd_return_pct
    FROM portfolio_kpi_fact
    WHERE \`Asset Class_1\` = ?
      AND \`Asset Class_2\` = ?
    ORDER BY \`Portfolio Name\`;
  `;

  connection.query(query, [asset1, asset2], async (error, results) => {
    if (error) return res.status(500).json({ error: error.sqlMessage });

    try {
      let rate = 1;
      if (requestedCurrency !== "INR") {
        rate = await getInrToCurrencyRate(requestedCurrency);
        if (!rate) return res.status(400).json({ error: `Currency '${requestedCurrency}' not supported` });
      }

      const converted = results.map((row) => ({
        ...row,
        currency: requestedCurrency,
        today_total: row.today_total ? +(row.today_total * rate).toFixed(2) : null,
        yesterday_total: row.yesterday_total ? +(row.yesterday_total * rate).toFixed(2) : null,
      }));

      res.status(200).json(converted);
    } catch (err) {
      console.error("Exchange rate fetch error:", err.message);
      res.status(502).json({ error: "Failed to fetch currency rate" });
    }
  });
};

module.exports = {
  getAssetClass1Summary,
  getAssetClass2Summary,
  getPortfolioDetails,
};

