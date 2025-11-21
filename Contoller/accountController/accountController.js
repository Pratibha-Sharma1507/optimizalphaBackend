const axios = require("axios");
const connection = require("../../Model/dbConnect"); // adjust path as needed

let cachedRates = null;
let lastFetched = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour cache

// --- Utility: Convert INR → Target Currency ---
async function getInrToCurrencyRate(targetCurrency) {
  const now = Date.now();

  //  Use cached data if still valid
  if (cachedRates && now - lastFetched < CACHE_TTL) {
    const usdToTarget = cachedRates[targetCurrency];
    const usdToInr = cachedRates["INR"];
    if (!usdToTarget || !usdToInr) return null;
    // Correct formula (same as working assetClass API)
    return +(usdToTarget / usdToInr).toFixed(6);
  }

  //  Fetch fresh rates from API
  const response = await axios.get("https://api.exchangerate-api.com/v4/latest/USD");
  cachedRates = response.data.rates;
  lastFetched = now;

  const usdToTarget = cachedRates[targetCurrency];
  const usdToInr = cachedRates["INR"];
  if (!usdToTarget || !usdToInr) return null;

  //  Correct formula for INR → Target Currency
  return +(usdToTarget / usdToInr).toFixed(6);
}

// --- Main API: Get Account KPI Summary (convert only today_total) ---
async function getAccountKpiSummary(req, res) {
  try {
    const requestedCurrency = (req.query.currency || "INR").toUpperCase();

    //  Get logged-in user's account_id (decoded from JWT middleware)
    const client_id = req.user?.client_id;

    if (!client_id) {
      return res.status(401).json({ error: "Unauthorized: client_id missing" });
    }

    const query = `
      SELECT 
        id, 
        client_id,
        latest_date,
        today_total,
        prev_date,
        yesterday_total,
        daily_return,
          \`1w_value\`,
        \`1w_return\`,
          \`1m_value\`,
         \`1m_return\`,
           \`3m_value\`,
          \`3m_return\`,
            \`6m_value\`,
           \`6m_return\`,
        mtd_return,
          mtd_value,
        fytd_return,
         fytd_value
      FROM pan_kpi_summary
      WHERE client_id = ?
    `;

    connection.query(query, [client_id], async (error, results) => {
      if (error) {
        console.error("Account KPI DB error:", error);
        return res.status(500).json({ error: error.sqlMessage });
      }

      let rate = 1;

      // Currency conversion only if needed
      if (requestedCurrency !== "INR") {
        rate = await getInrToCurrencyRate(requestedCurrency);
        if (!rate) {
          return res
            .status(400)
            .json({ error: `Currency '${requestedCurrency}' not supported` });
        }
      }

      // Convert ONLY today_total
      const convertedData = results.map((row) => ({
        id: row.id,
        client_id: row.client_id,
        client_no: row.client_no,
        base_currency: "INR",
        currency: requestedCurrency,
        latest_date: row.latest_date,
        today_total: row.today_total ? +(row.today_total * rate).toFixed(2) : null,
        prev_date: row.prev_date,
       yesterday_total: row.today_total ? +(row.yesterday_total * rate).toFixed(2) : null,
        daily_return: row.daily_return,
            "1w_value": row["1w_value"],
        "1w_return": row["1w_return"],
         "1m_value": row["1m_value"],
          "1m_return": row["1m_return"],
           "3m_value": row["3m_value"],
            "3m_return": row["3m_return"],
              "6m_value": row["6m_value"],
              "6m_return": row["6m_return"],
        mtd_return: row.mtd_return,
           mtd_value: row.mtd_value,
        fytd_return: row.fytd_return,
           fytd_value: row.fytd_value,
        conversion_rate: rate,
      }));

      return res.status(200).json(convertedData);
    });
  } catch (err) {
    console.error("Account KPI Error:", err.message);
    res.status(502).json({ error: "Failed to fetch KPI summary" });
  }
}

module.exports = { getAccountKpiSummary };
