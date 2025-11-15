const connection = require("../../Model/dbConnect"); // adjust path as needed

const getPanList = (req, res) => {
  const account_id = req.user?.account_id;

  if (!account_id) return res.status(401).json({ error: "Unauthorized" });

  const sql = `SELECT DISTINCT pan_id, pan_no FROM pan_kpi_summary WHERE account_id = ?`;

  connection.query(sql, [account_id], (err, result) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.status(200).json(result);
  });
};


// GET /api/pan-list/:account_id
 const getAllPans = (req, res) => {
  const { account_id } = req.params;

  const sql = `
   SELECT DISTINCT pan_id, pan_no FROM pan_kpi_summary WHERE account_id = ?
  `;

  connection.query(sql, [account_id], (err, rows) => {
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

const getAllPanBYID =  (req, res) => {
  const { account_id, pan_no } = req.params;

  const sql = `
    SELECT 
      pan_no,
      today_total,
      yesterday_total,
      daily_return_pct,
      3d_return_pct,
      1w_return_pct,
      mtd_return_pct,
      fytd_return_pct
    FROM pan_kpi_summary
    WHERE account_id = ? AND pan_no = ?;
  `;

  connection.query(sql, [account_id, pan_no], (err, rows) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json(rows);
  });
};



module.exports = { getPanList, getAllPans , getAllPanId, getAllPanBYID};
