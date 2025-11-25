const connection = require("../../Model/dbConnect"); // 


const getClientFYTD = (req, res) => {
  const { client_id } = req.params;

  const sql = `
    SELECT client_no, date, fytd_return
    FROM client_fytd_returns
    WHERE client_id = ?
    ORDER BY STR_TO_DATE(date, '%d-%m-%Y') DESC
    LIMIT 1
  `;

  connection.query(sql, [client_id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.sqlMessage });
    }

    res.json({ fytd: rows.length ? rows[0] : null });
  });
};


const getClientMTD = (req, res) => {
  const { client_id } = req.params;

  const sql = `
    SELECT *
    FROM client_mtd_returns
    WHERE client_id = ?
  `;

  connection.query(sql, [client_id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.sqlMessage });
    }

    // Return exactly as DB rows
    res.json({ mtd: rows });
  });
};


const getEntityFYTD = (req, res) => {
  const { client_id } = req.params;

  const sql = `
    SELECT *
    FROM client_entity_fytd_returns
    WHERE client_id = ?
  `;

  connection.query(sql, [client_id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.sqlMessage });
    }

    // Return exactly as DB rows
    res.json({ mtd: rows });
  });
};


module.exports = { getClientFYTD, getClientMTD,getEntityFYTD};
