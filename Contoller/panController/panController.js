const connection = require("../../Model/dbConnect"); // 

const getPanList = (req, res) => {
  const pan_id = req.user?.pan_id;

  if (!account_id) return res.status(401).json({ error: "Unauthorized" });

  const sql = `SELECT DISTINCT account_id, account_name FROM account_kpi_summary WHERE pan_id = ?`;

  connection.query(sql, [pan_id], (err, result) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.status(200).json(result);
  });
};


// GET /api/pan-list/:account_id
 const getAllPans = (req, res) => {
  const { client_id } = req.params;

  const sql = `
   SELECT DISTINCT account_id, account_name, today_total FROM account_kpi_summary WHERE client_id = ?
  `;

  connection.query(sql, [client_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json(rows);
  });
};


// GET /api/pan-details/:account_id/:pan_no
const getAllPanId =  (req, res) => {
  const { account_id, pan_no } = req.params;

const sql = `
  SELECT 
    pan_no,
    asset_class_1,
    asset_class_2 AS sub_asset_class,
    today_total,
    yesterday_total,
    daily_return_pct,
    3d_return_pct,
    1w_return_pct,
    mtd_return_pct,
    fytd_return_pct
  FROM assetclass2_kpi_summary
  WHERE account_id = ? AND pan_no = ?;
`;


  connection.query(sql, [account_id, pan_no], (err, rows) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json(rows);
  });
};

const getAllPanBYID = (req, res) => {
  let { client_id, account_name } = req.params;

  account_name = decodeURIComponent(account_name);

  console.log("REQ PARAMS:", { client_id, account_name });

  const sql = `
    SELECT 
      client_id,
      account_name,
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
      mtd_value,
      mtd_return,
      fytd_value,
      fytd_return
          FROM account_kpi_summary
    WHERE client_id = ?
    AND REPLACE(LOWER(account_name), ' ', '') = REPLACE(LOWER(?), ' ', '');
  `;

  connection.query(sql, [client_id, account_name], (err, rows) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json(rows);
  });
};


module.exports = { getPanList, getAllPans , getAllPanId, getAllPanBYID};
