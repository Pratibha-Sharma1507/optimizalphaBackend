const axios = require("axios");
const connection = require("../../Model/dbConnect"); // adjust path as needed

let cachedRates = null;
let lastFetched = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour cache

// --- Utility: Convert INR → Target Currency ---
async function getInrToCurrencyRate(targetCurrency) {
  const now = Date.now();

  // ✅ Use cached data if still valid
  if (cachedRates && now - lastFetched < CACHE_TTL) {
    const usdToTarget = cachedRates[targetCurrency];
    const usdToInr = cachedRates["INR"];
    if (!usdToTarget || !usdToInr) return null;
    // ✅ Correct formula (same as working assetClass API)
    return +(usdToTarget / usdToInr).toFixed(6);
  }

  // ✅ Fetch fresh rates from API
  const response = await axios.get("https://api.exchangerate-api.com/v4/latest/USD");
  cachedRates = response.data.rates;
  lastFetched = now;

  const usdToTarget = cachedRates[targetCurrency];
  const usdToInr = cachedRates["INR"];
  if (!usdToTarget || !usdToInr) return null;

  // ✅ Correct formula for INR → Target Currency
  return +(usdToTarget / usdToInr).toFixed(6);
}

// --- Main API: Get Account KPI Summary (convert only today_total) ---
async function getAccountKpiSummary(req, res) {
  const requestedCurrency = (req.query.currency || "INR").toUpperCase();

  const query = `
    SELECT 
      id, pan, account, latest_date, previous_date,
      today_total, yesterday_total, daily_return_pct,
      \`3d_return_pct\`, \`1w_return_pct\`,
      mtd_return_pct, fytd_return_pct
    FROM account_kpi_summary
  `;

  connection.query(query, async (error, results) => {
    if (error) {
      console.error("Account KPI DB error:", error);
      return res.status(500).json({ error: error.sqlMessage });
    }

    try {
      let rate = 1;

      // ✅ Convert only if requested currency ≠ INR
      if (requestedCurrency !== "INR") {
        rate = await getInrToCurrencyRate(requestedCurrency);
        if (!rate) {
          return res
            .status(400)
            .json({ error: `Currency '${requestedCurrency}' not supported` });
        }
      }

      // ✅ Convert ONLY today_total
      const convertedData = results.map((row) => ({
        id: row.id,
        pan: row.pan,
        account: row.account,
        base_currency: "INR",
        currency: requestedCurrency,
        latest_date: row.latest_date,
        previous_date: row.previous_date,
        today_total: row.today_total ? +(row.today_total * rate).toFixed(2) : null,
        yesterday_total: row.yesterday_total,
        daily_return_pct: row.daily_return_pct,
        "3d_return_pct": row["3d_return_pct"],
        "1w_return_pct": row["1w_return_pct"],
        mtd_return_pct: row.mtd_return_pct,
        fytd_return_pct: row.fytd_return_pct,
        conversion_rate: rate,
      }));

      console.log("✅ Account KPI Data:", convertedData);
      res.status(200).json(convertedData);
    } catch (err) {
      console.error("Exchange rate fetch error:", err.message);
      res.status(502).json({ error: "Failed to fetch currency rate" });
    }
  });
}

module.exports = { getAccountKpiSummary };
