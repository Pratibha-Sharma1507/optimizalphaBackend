const connection = require("../../Model/dbConnect"); // 


// const getClientFYTD = (req, res) => {
//   const { client_id } = req.params;

//   const sql = `
//     SELECT client_no, date, fytd_return
//     FROM client_fytd_returns
//     WHERE client_id = ?
//     ORDER BY STR_TO_DATE(date, '%d-%m-%Y') DESC
//     LIMIT 1
//   `;

//   connection.query(sql, [client_id], (err, rows) => {
//     if (err) {
//       return res.status(500).json({ error: err.sqlMessage });
//     }

//     res.json({ fytd: rows.length ? rows[0] : null });
//   });
// };


// const getClientMTD = (req, res) => {
//   const { client_id } = req.params;

//   const sql = `
//     SELECT *
//     FROM client_mtd_returns
//     WHERE client_id = ?
//   `;

//   connection.query(sql, [client_id], (err, rows) => {
//     if (err) {
//       return res.status(500).json({ error: err.sqlMessage });
//     }

//     // Return exactly as DB rows
//     res.json({ mtd: rows });
//   });
// };


// const getEntityFYTD = (req, res) => {
//   const { client_id } = req.params;

//   const sql = `
//     SELECT *
//     FROM client_entity_fytd_returns
//     WHERE client_id = ?
//   `;

//   connection.query(sql, [client_id], (err, rows) => {
//     if (err) {
//       return res.status(500).json({ error: err.sqlMessage });
//     }

//     // Return exactly as DB rows
//     res.json({ mtd: rows });
//   });
// };



const allYear = (req, res) => {
  const { clientId } = req.params;

  if (!clientId) {
    return res.status(400).json({ message: "clientId is required" });
  }

  const sql = `
    SELECT
      RIGHT(time, 2) AS year,
      AVG(market_value) AS avg_market_value
    FROM monthly_yearly_data
    WHERE client_id = ?
      AND RIGHT(time, 2) IN ('24','25')
    GROUP BY year
    ORDER BY year;
  `;

  connection.query(sql, [clientId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.sqlMessage });
    }

    // Format result (convert 24 -> 2024, 25 -> 2025)
    const formatted = rows.map((r) => ({
      year: Number("20" + r.year),
      avg: parseFloat(r.avg_market_value),
    }));

    res.json({ data: formatted });
  });
};


const getMonthlyComparison = (req, res) => {
  const { clientId } = req.params;

  if (!clientId) {
    return res.status(400).json({ message: "clientId is required" });
  }

  const sql = `
    SELECT
        LEFT(time, 3) AS month,
        RIGHT(time, 2) AS year,
        AVG(market_value) AS avg_market_value
    FROM monthly_yearly_data
    WHERE client_id = ?
      AND RIGHT(time, 2) IN ('24','25')
      AND time IN (
        'Jun-25','Jul-25','Aug-25','Sep-25','Oct-25'
      )
    GROUP BY month, year
    ORDER BY STR_TO_DATE(CONCAT(month, '-', year), '%b-%y');
  `;
connection.query(sql, [clientId], (err, rows) => {
  if (err) {
    return res.status(500).json({ error: err.sqlMessage });
  }

  const formatted = rows.map((row) => ({
    month: row.month,
    year: Number("20" + row.year),
    avg: Number(Number(row.avg_market_value).toFixed(2))
  }));

  res.json({ data: formatted });
});

};

const getEntityYearlyAverage = (req, res) => {
  const { clientId } = req.params;

  const sql = `
    SELECT
        account_name AS entity,
        CONCAT('20', RIGHT(time, 2)) AS year,
        AVG(market_value) AS avg_market_value
    FROM monthly_yearly_data
    WHERE client_id = ?
    GROUP BY entity, year
    ORDER BY entity, year;
  `;

  connection.query(sql, [clientId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });

    const formatted = rows.map(row => ({
      entity: row.entity,
      year: Number(row.year),
      avg: Number(Number(row.avg_market_value).toFixed(2))
    }));

    res.json({ data: formatted });
  });
};


const getEntityMonthlyComparison = (req, res) => {
  const { clientId } = req.params;

  if (!clientId) {
    return res.status(400).json({ message: "clientId is required" });
  }

  const sql = `
    SELECT
      account_name AS entity,
      LEFT(time, 3) AS month,
      RIGHT(time, 2) AS year,
      AVG(market_value) AS avg_market_value
    FROM monthly_yearly_data
    WHERE client_id = ?
      AND RIGHT(time, 2) IN ('24','25')
      AND time IN (
          'Jun-25','Jul-25','Aug-25','Sep-25','Oct-25'
      )
    GROUP BY entity, month, year
    ORDER BY 
      entity,
      STR_TO_DATE(CONCAT(month, '-', year), '%b-%y');
  `;

  connection.query(sql, [clientId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.sqlMessage });
    }

    // Format output for frontend graph
    const formatted = rows.map(row => ({
      entity: row.entity,
      month: row.month,
      year: Number("20" + row.year),
      avg: Number(row.avg_market_value)
    }));

    res.json({ data: formatted });
  });
};


const getAssetClassYearlyAvg = (req, res) => {
  const { clientId } = req.params;

  if (!clientId) {
    return res.status(400).json({ message: "clientId required" });
  }

  const sql = `
    SELECT
        asset_class1,
        CONCAT('20', RIGHT(time, 2)) AS year,
        AVG(market_value) AS avg_market_value
    FROM monthly_yearly_data
    WHERE client_id = ?
    GROUP BY asset_class1, year
    ORDER BY 
      FIELD(asset_class1, 'Equity', 'Fixed Income', 'Alternative Investments', 'Cash'),
      year;
  `;

  connection.query(sql, [clientId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });

    const formatted = rows.map(r => {
      const value = Number(r.avg_market_value);

      return {
        asset_class: r.asset_class1,
        year: Number(r.year),
        avg: isNaN(value) ? 0 : Number(value.toFixed(2))
      };
    });

    res.json({ data: formatted });
  });
};

const getAssetClassMonthly = (req, res) => {
  const { clientId } = req.params;

  if (!clientId) return res.status(400).json({ message: "clientId is required" });

  const sql = `
   SELECT
    SUBSTRING_INDEX(time, '-', 1) AS month,
    CONCAT('20', SUBSTRING_INDEX(time, '-', -1)) AS year,
    AVG(market_value) AS avg_market_value,
    asset_class1 AS asset_class
FROM monthly_yearly_data
WHERE client_id = ?
  AND time IN (
      'Oct-25','Sep-25','Aug-25','Jul-25','Jun-25'
  )
GROUP BY month, year, asset_class
ORDER BY 
    STR_TO_DATE(CONCAT(month, '-', year), '%b-%Y'),
    FIELD(asset_class1, 'Equity', 'Fixed Income', 'Alternative Investments', 'Cash');

  `;

  connection.query(sql, [clientId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });

    const formatted = rows.map(r => ({
      month: r.month,
      year: Number(r.year),
      asset_class: r.asset_class,
      avg: Number(Number(r.avg_market_value).toFixed(2))
    }));

    res.json({ data: formatted });
  });
};


const getAssetClass2Yearly = (req, res) => {
  const { clientId } = req.params;

  if (!clientId) {
    return res.status(400).json({ message: "clientId is required" });
  }

  const sql = `
    SELECT
    asset_class2,
    CONCAT('20', RIGHT(time, 2)) AS year,
    AVG(market_value) AS avg_market_value
FROM monthly_yearly_data
WHERE client_id = ?
GROUP BY asset_class2, year
ORDER BY
    CASE
        WHEN asset_class2 LIKE 'Equity%' THEN 1
        WHEN asset_class2 LIKE 'Fixed Income%' THEN 2
        WHEN asset_class2 LIKE 'AIF%' THEN 3
        WHEN asset_class2 LIKE 'Cash%' THEN 4
        ELSE 5
    END,
    year;

  `;

  connection.query(sql, [clientId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });

    const formatted = rows.map(r => ({
      asset_class: r.asset_class2,
      year: Number(r.year),
      avg: Number(Number(r.avg_market_value).toFixed(2))
    }));

    res.json({ data: formatted });
  });
};




const getAssetClass2Monthly = (req, res) => {
  const { clientId } = req.params;

  if (!clientId) {
    return res.status(400).json({ message: "clientId is required" });
  }

  const sql = `
    SELECT
    SUBSTRING_INDEX(time, '-', 1) AS month,
    CONCAT('20', SUBSTRING_INDEX(time, '-', -1)) AS year,
    AVG(market_value) AS avg_market_value,
    asset_class2 AS asset_class
FROM monthly_yearly_data
WHERE client_id = ?
  AND time IN (
      'Jun-25','Jul-25','Aug-25','Sep-25','Oct-25'
  )
GROUP BY month, year, asset_class
ORDER BY 
    STR_TO_DATE(CONCAT(month, '-', year), '%b-%Y'),
    CASE
        WHEN asset_class2 LIKE 'Equity%' THEN 1
        WHEN asset_class2 LIKE 'Fixed Income%' THEN 2
        WHEN asset_class2 LIKE 'AIF%' THEN 3
        WHEN asset_class2 LIKE 'Cash%' THEN 4
        ELSE 5
    END;

  `;

  connection.query(sql, [clientId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.sqlMessage });
    }

    // Format response
    const formatted = rows.map((row) => ({
      asset_class: row.asset_class,
      month: row.month,
      year: Number(row.year),
      avg: Number(row.avg_market_value), // no .toFixed() to avoid error
    }));

    res.json({ data: formatted });
  });
};




module.exports = { allYear, getMonthlyComparison, getEntityYearlyAverage, getEntityMonthlyComparison, getAssetClassYearlyAvg, getAssetClassMonthly, getAssetClass2Yearly, getAssetClass2Monthly};
