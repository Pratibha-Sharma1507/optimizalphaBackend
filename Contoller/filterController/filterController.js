 const connection = require("../../Model/dbConnect");


 const getAccount = (req, res) => {
  const sql = `
    SELECT DISTINCT account_id, account_name 
    FROM account_kpi_summary
    ORDER BY account_name ASC
  `;
  connection.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json(rows);
  });
};

const filterAccount = (req, res) => {
  const sql = `
    SELECT 
      account_id,
      account_name,
      today_total,
      yesterday_total,
      daily_return_pct,
      \`3d_return_pct\`,
      \`1w_return_pct\`,
      mtd_return_pct,
      fytd_return_pct
    FROM account_kpi_summary
    WHERE account_id = ?
  `;
console.log('res', req.params.account_id)
  connection.query(sql, [req.params.account_id], (err, rows) => {
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
    WHERE account_id = ?
    ORDER BY pan_no ASC;
  `;

  connection.query(sql, [req.params.account_id], (err, rows) => {
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
  const { account_id, pan_no } = req.params;

  const sql = `
    SELECT 
      pan_no,
      asset_class_2 AS sub_asset_class,
      today_total,
      yesterday_total,
      daily_return_pct,
      3d_return_pct,
      1w_return_pct,
      mtd_return_pct,
      fytd_return_pct
    FROM assetclass2_kpi_summary
    WHERE account_id = ? AND pan_no = ?
    ORDER BY sub_asset_class;
  `;

  connection.query(sql, [account_id, pan_no], (err, rows) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json(rows);
  });
};


const filterAllAssetClass = (req, res) => {
  const sql = `
    SELECT 
      id,
      account_id,
      account_name,
      asset_class,
      latest_date,
      today_total,
      yesterday_total,
      daily_return_pct,
      3d_return_pct ,
      1w_return_pct,
      mtd_return_pct,
      fytd_return_pct
    FROM asset_class_summary
    WHERE account_id = ?
    ORDER BY FIELD(asset_class, 
      'Equity', 
      'Fixed Income', 
      'Alternative Investments', 
      'Cash'
    );
  `;

  connection.query(sql, [req.params.accountId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json(rows);
  });
};



const getAllSubAsset = (req, res) => {
  const { accountId, assetClass } = req.params;

  const sql = `
    SELECT 
      id,
      account_id,
      asset_class_2 AS sub_asset,
      today_total,
      yesterday_total,
      daily_return_pct,
      3d_return_pct,
      1w_return_pct,
      mtd_return_pct,
      fytd_return_pct
    FROM assetclass2_kpi_summary
    WHERE account_id = ?
      AND asset_class_1 = ?
    ORDER BY sub_asset;
  `;

  connection.query(sql, [accountId, assetClass], (err, rows) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });

    res.json(rows);
  });
};




module.exports = { filterAccount, filterPan, getAccount, filterAssetclass1, filterSubAsset, filterAllAssetClass, getAllSubAsset};
