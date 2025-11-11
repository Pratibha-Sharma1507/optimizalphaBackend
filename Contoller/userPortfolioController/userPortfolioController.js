const connection = require("../../Model/dbConnect");
const axios = require("axios");
 // <-- ensure you import your MySQL connection

// cache system (to reduce API calls)
let cachedRates = null;
let lastFetched = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours cache

// universal live rate fetcher (base = INR)
async function getInrToCurrencyRate(targetCurrency) {
  const now = Date.now();

  // if cache is fresh, use it
  if (cachedRates && now - lastFetched < CACHE_TTL) {
    const usdToTarget = cachedRates[targetCurrency];
    const usdToInr = cachedRates["INR"];
    if (!usdToTarget || !usdToInr) return null;

    // convert INR → target
    return +(usdToTarget / usdToInr).toFixed(4);
  }

  // fetch latest USD base rates
  const response = await axios.get("https://api.exchangerate-api.com/v4/latest/USD");
  cachedRates = response.data.rates;
  lastFetched = now;

  const usdToTarget = cachedRates[targetCurrency];
  const usdToInr = cachedRates["INR"];
  if (!usdToTarget || !usdToInr) return null;

  // INR → targetCurrency = usdToTarget / usdToInr
  return +(usdToTarget / usdToInr).toFixed(4);
}

const viewUserPortfolio = async (req, res) => {
  const requestedCurrency = (req.query.currency || "INR").toUpperCase(); //  Default currency = INR
  const query = "SELECT * FROM user_portfolio";

  connection.query(query, async (error, result) => {
    if (error) {
      console.log("Error", error.sqlMessage);
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

      const convertedData = result.map((row) => {
        const convert = (val) =>
          val === null || val === undefined ? val : +(val * rate).toFixed(2);

        return {
          pan: row.pan,
          member_id: row.member_id,
          email: row.email,
          base_currency: "INR",
          currency: requestedCurrency,
          portfolio_value: convert(row.portfolio_value),
          total_loans: convert(row.total_loans),
          gross_value: convert(row.gross_value),
          abs_return: row.abs_return,
          itd: row.itd,
          "3_years": row["3_years"],
          "1_year": row["1_year"],
          ytd: row.ytd,
          conversion_rate: rate,
        };
      });

      res.status(200).json(convertedData);
    } catch (err) {
      console.error("Exchange rate fetch error:", err.message);
      res.status(502).json({ error: "Failed to fetch live currency rate" });
    }
  });
};



// Get user portfolio
// const viewUserPortfolio = (req, res) => {
//   const query = "SELECT * FROM user_portfolio";
//   connection.query(query, (error, result) => {
//     if (error) {
//       console.log("Error", error.sqlMessage);
//       return res.status(500).json({ error: error.sqlMessage });
//     }
//     res.status(200).json(result);
//   });
// };

// Get filtered portfolio data (allocation_by & distribution_by)
const getPortfolioData = (req, res) => {
  const { allocationBy, distributionBy } = req.query;

  if (!allocationBy || !distributionBy) {
    return res.status(400).json({ message: "Missing query parameters" });
  }

  const query = `
    SELECT * FROM portfolio_data
    WHERE allocation_by = ? AND distribution_by = ?
  `;

  connection.query(query, [allocationBy, distributionBy], (error, results) => {
    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({ error: error.sqlMessage });
    }

    console.log("Filtered portfolio data:", results);
    res.status(200).json(results);
  });
};

module.exports = {
  viewUserPortfolio,
  getPortfolioData,
};
