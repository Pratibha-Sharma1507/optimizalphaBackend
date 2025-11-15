// const connection = require("../../Model/dbConnect");

// // GET — Alternative Investments
// const getAlternative = (req, res) => {
//   const query = `
//     SELECT * FROM assetclass_kpi_summary
//     WHERE asset_class = 'Alternative Investments'
//   `;

//   connection.query(query, (error, results) => {
//     if (error) {
//       console.error("Database error:", error);
//       return res.status(500).json({ error: error.sqlMessage });
//     }

//     console.log("Alternative Investments Data:", results);
//     res.status(200).json(results);
//   });
// };

// // GET — Cash
// const getCash = (req, res) => {
//   const query = `
//     SELECT * FROM assetclass_kpi_summary
//     WHERE asset_class = 'Cash'
//   `;

//   connection.query(query, (error, results) => {
//     if (error) {
//       console.error("Database error:", error);
//       return res.status(500).json({ error: error.sqlMessage });
//     }

//     console.log("Cash Data:", results);
//     res.status(200).json(results);
//   });
// };

// // GET — Equity
// const getEquity = (req, res) => {
//   const query = `
//     SELECT * FROM assetclass_kpi_summary
//     WHERE asset_class = 'Equity'
//   `;

//   connection.query(query, (error, results) => {
//     if (error) {
//       console.error("Database error:", error);
//       return res.status(500).json({ error: error.sqlMessage });
//     }

//     console.log("Equity Data:", results);
//     res.status(200).json(results);
//   });
// };

// // GET — Fixed Income
// const getFixedIncome = (req, res) => {
//   const query = `
//     SELECT * FROM assetclass_kpi_summary
//     WHERE asset_class = 'Fixed Income'
//   `;

//   connection.query(query, (error, results) => {
//     if (error) {
//       console.error("Database error:", error);
//       return res.status(500).json({ error: error.sqlMessage });
//     }

//     console.log("Fixed Income Data:", results);
//     res.status(200).json(results);
//   });
// };

// module.exports = { getAlternative, getCash, getEquity, getFixedIncome };


const axios = require("axios");
const connection = require("../../Model/dbConnect");

// --- Cache setup ---
let cachedRates = null;
let lastFetched = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour cache

// --- Utility: Convert INR → Target Currency ---
async function getInrToCurrencyRate(targetCurrency) {
  const now = Date.now();

  //  Use cached rates if still valid
  if (cachedRates && now - lastFetched < CACHE_TTL) {
    const usdToTarget = cachedRates[targetCurrency];
    const usdToInr = cachedRates["INR"];
    if (!usdToTarget || !usdToInr) return null;
    return +(usdToTarget / usdToInr).toFixed(4);
  }

  //  Fetch fresh rates from API
  const response = await axios.get("https://api.exchangerate-api.com/v4/latest/USD");
  cachedRates = response.data.rates;
  lastFetched = now;

  const usdToTarget = cachedRates[targetCurrency];
  const usdToInr = cachedRates["INR"];
  if (!usdToTarget || !usdToInr) return null;

  // Convert INR → targetCurrency
  return +(usdToTarget / usdToInr).toFixed(4);
}

// --- Shared handler for all asset classes ---
async function handleAssetClassQuery(assetClass, req, res) {
  const requestedCurrency = (req.query.currency || "INR").toUpperCase();

  const query = `
    SELECT * FROM assetclass1_kpi_summary
    WHERE asset_class = ?
  `;

  connection.query(query, [assetClass], async (error, results) => {
    if (error) {
      console.error(`${assetClass} DB error:`, error);
      return res.status(500).json({ error: error.sqlMessage });
    }

    try {
      let rate = 1;

      // Convert only if requested currency ≠ INR
      if (requestedCurrency !== "INR") {
        rate = await getInrToCurrencyRate(requestedCurrency);
        if (!rate) {
          return res
            .status(400)
            .json({ error: `Currency '${requestedCurrency}' not supported` });
        }
      }

      //  Only convert "today_total"
      const convertedData = results.map((row) => ({
        pan_no: row.pan_no,
        account_name: row.account_name,
        asset_class: row.asset_class,
        base_currency: "INR",
        currency: requestedCurrency,
        latest_date: row.latest_date,
        previous_date: row.previous_date,
        today_total: row.today_total ? +(row.today_total * rate).toFixed(2) : null,
        yesterday_total: row.yesterday_total, // keep same
        daily_return_pct: row.daily_return_pct,
        "3d_return_pct": row["3d_return_pct"],
        "1w_return_pct": row["1w_return_pct"],
        mtd_return_pct: row.mtd_return_pct,
        fytd_return_pct: row.fytd_return_pct,
        conversion_rate: rate,
      }));

      console.log(`${assetClass} Data (converted today_total only):`, convertedData);
      res.status(200).json(convertedData);
    } catch (err) {
      console.error("Exchange rate fetch error:", err.message);
      res.status(502).json({ error: "Failed to fetch currency rate" });
    }
  });
}

// --- Individual Endpoints ---
const getAlternative = (req, res) => handleAssetClassQuery("Alternative Investments", req, res);
const getCash = (req, res) => handleAssetClassQuery("Cash", req, res);
const getEquity = (req, res) => handleAssetClassQuery("Equity", req, res);
const getFixedIncome = (req, res) => handleAssetClassQuery("Fixed Income", req, res);

module.exports = {
  getAlternative,
  getCash,
  getEquity,
  getFixedIncome,
};

