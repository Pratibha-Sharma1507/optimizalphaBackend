 const connection = require("../../Model/dbConnect");

 const getAccount = (req, res) => {
  const sql = `
    SELECT DISTINCT pan_id, pan_no 
    FROM pan_kpi_summary
    ORDER BY pan_no ASC
  `;
  connection.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json(rows);
  });
};

const filterAccount = (req, res) => {
  const sql = `
    SELECT 
      pan_id,
        today_total,
      yesterday_date,
      daily_return,
      \`1w_return\`,
        \`1m_return\`,
          \`3m_return\`,
            \`6m_return\`,
      mtd_return,
      fytd_return
    FROM pan_kpi_summary
    WHERE pan_id = ?
  `;
console.log('res', req.params.pan_id)
  connection.query(sql, [req.params.pan_id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.sqlMessage });
    }
    res.json(rows);
  });
};

const filterPan = (req, res) => {
  const sql = `
    SELECT 
      pan_no,
      today_total,
      yesterday_total,
      daily_return_pct,
      \`3d_return_pct\`,
      \`1w_return_pct\`,
      mtd_return_pct,
      fytd_return_pct
    FROM pan_kpi_summary
    WHERE pan_id = ?
    ORDER BY pan_no ASC;
  `;

  connection.query(sql, [req.params.pan_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json(rows);
  });
};

const filterAssetclass1 = (req, res) => {
  const { account_id, pan_no } = req.params;

const sql = `
  SELECT DISTINCT
    pan_no,
    asset_class,
    today_total,
    yesterday_total,
    daily_return_pct,
    3d_return_pct,
    1w_return_pct,
    mtd_return_pct,
    fytd_return_pct
  FROM assetclass1_kpi_summary
  WHERE account_id = ? AND pan_no = ?
  ORDER BY 
    CASE 
      WHEN asset_class = 'Equity' THEN 1
      WHEN asset_class = 'Fixed Income' THEN 2
      WHEN asset_class = 'Alternative Investments' THEN 3
      WHEN asset_class = 'Cash' THEN 4
      ELSE 5
    END;
`;


  connection.query(sql, [account_id, pan_no], (err, rows) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json(rows);
  });
};


const filterSubAsset = (req, res) => {
  const { pan_id, account_name } = req.params;

  const sql = `
    SELECT 
    pan_id,
      pan_no,
      asset_class2 AS sub_asset_class,
      today_total,
      yesterday_date,
      daily_return,
      1w_return,
       1m_return,
       3m_return,
       6m_return,
      mtd_return,
      fytd_return
    FROM assetclass2_kpi_summary
    WHERE pan_id = ? AND account_name = ?
    ORDER BY sub_asset_class;
  `;

  connection.query(sql, [pan_id, account_name], (err, rows) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json(rows);
  });
};


const filterAllAssetClass = (req, res) => {
  const sql = `
    SELECT 
      id,
      pan_id,
      asset_class,
      latest_date,
      today_total,
      yesterday_date,
      daily_return_pct,
      1w_return,
     1m_return,
       3m_return,
         6m_return,
      mtd_return,
      fytd_return
    FROM asset_class_summary
    WHERE pan_id = ?
    ORDER BY FIELD(asset_class, 
      'Equity', 
      'Fixed Income', 
      'Alternative Investments', 
      'Cash'
    );
  `;

  connection.query(sql, [req.params.panId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json(rows);
  });
};



const getAllSubAsset = (req, res) => {
  const { pan_id, assetClass } = req.params;

  const sql = `
    SELECT 
      id,
      pan_id,
      account_name,
      asset_class AS asset_class_1,
      asset_class2 AS sub_asset,
      latest_date,
      today_total,
      yesterday_date,
      daily_return,
      \`3m_return\`,
      \`1w_return\`,
      \`1m_return\`,
      \`6m_return\`,
      mtd_return,
      fytd_return
    FROM assetclass2_kpi_summary
    WHERE pan_id = ?
      AND asset_class = ?
    ORDER BY sub_asset, account_name;
  `;

  connection.query(sql, [pan_id, assetClass], (err, rows) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });

    res.json(rows);
  });
};


 const getPanAssetSummary = (req, res) => {
  const { pan_id } = req.params;

  const sql = `
    SELECT 
      pan_id,
      account_name,
      asset_class,
      latest_date,
      today_total,
      yesterday_date,
      daily_return,
      \`1w_return\`,
      \`1m_return\`,
      \`3m_return\`,
      \`6m_return\`,
      mtd_return,
      fytd_return
    FROM assetclass1_kpi_summary
    WHERE pan_id = ?
    ORDER BY asset_class, account_name;
  `;

  connection.query(sql, [pan_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });

    // ---  Grouping Logic ---
    const grouped = {};

    for (const row of rows) {
      if (!grouped[row.asset_class]) {
        grouped[row.asset_class] = [];
      }
      grouped[row.asset_class].push(row);
    }

    res.json(grouped);
  });
};







module.exports = { filterAccount, filterPan, getAccount, filterAssetclass1, filterSubAsset, filterAllAssetClass, getAllSubAsset, getPanAssetSummary};
