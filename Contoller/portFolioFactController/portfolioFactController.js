const connection = require("../../Model/dbConnect");

// 🟢 Level 1 – Asset Class 1 summary


// 🟢 Get Asset Class 1 Summary (cleaned query)
const getAssetClass1Summary = (req, res) => {
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

  connection.query(query, (error, results) => {
    if (error) {
      console.error("❌ DB Error:", error);
      return res.status(500).json({ error: error.sqlMessage });
    }
    res.status(200).json(results);
  });
};


const getAssetClass2Summary = (req, res) => {
  const { asset1 } = req.params;
  console.log("🔍 asset1 param:", asset1); // 👈 check what comes from frontend
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
  WHERE LOWER(TRIM(\`Asset Class_1\`)) = LOWER(TRIM(?))
  GROUP BY \`Asset Class_1\`, \`Asset Class_2\`
  ORDER BY \`Asset Class_2\`;
`;

  connection.query(query, [asset1], (error, results) => {
    if (error) return res.status(500).json({ error: error.sqlMessage });
    console.log("✅ SQL Results:", results);
    res.status(200).json(results);
  });
};


// Level 3 – Portfolio details under Asset Class 1 + 2
const getPortfolioDetails = (req, res) => {
  const { asset1, asset2 } = req.params;
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
  connection.query(query, [asset1, asset2], (error, results) => {
    if (error) return res.status(500).json({ error: error.sqlMessage });
    res.status(200).json(results);
  });
};

module.exports = {
  getAssetClass1Summary,
  getAssetClass2Summary,
  getPortfolioDetails
};
