 const connection = require("../../Model/dbConnect");



const formatDateLabel = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid Date";

  const day = date.getDate();
  const monthNames = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
  ];
  const month = monthNames[date.getMonth()];

  return `${day} ${month}`;
};

// Format full date for tooltip
const formatFullDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid Date";

  const day = date.getDate();
  const monthNames = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
};

// Get labels for previous month based on fullDate ("29 Nov 2024")
const getPreviousMonthLabels = (fullDateLabel) => {
  const parts = fullDateLabel.split(" ");
  if (parts.length !== 3) return null;

  const [dayStr, monthStr, yearStr] = parts;
  const day = Number(dayStr);
  const monthNames = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
  ];
  const monthIndex = monthNames.indexOf(monthStr);
  const year = Number(yearStr);

  if (isNaN(day) || isNaN(year) || monthIndex === -1) return null;

  const d = new Date(year, monthIndex, day);
  d.setMonth(d.getMonth() - 1);

  const prevDay = d.getDate();
  const prevMonth = monthNames[d.getMonth()];
  const prevYear = d.getFullYear();

  return {
    date: `${prevDay} ${prevMonth}`,
    fullDate: `${prevDay} ${prevMonth} ${prevYear}`,
  };
};

// Map frontend asset class values to database values
const assetClass1Mapping = {
  equity: "Equity",
  fixedIncome: "Fixed Income",
  cash: "Cash",
  alternative: "Alternative Investments",
};

// Map frontend sub-asset class values to database values
const assetClass2Mapping = {
  equityListed: "Equity - Listed",
  equityMF: "Equity - MF",
  equityPEDirect: "Equity - Private Equity - Direct",
  equityPEVC: "Equity - Private Equity - VC",
  fixedIncomeMF: "Fixed Income - MF",
  cashMMF: "Cash - MMF",
  aifREIT: "AIF - REIT",
  aifHF: "AIF - HF",
};

// =============== getComparisonData ===================
const getComparisonData = (req, res) => {
  const { assetClass1, assetClass2, client_id } = req.query;

  if (!client_id) {
    return res.status(400).json({ message: "client_id is required" });
  }

  const dbAssetClass1 = assetClass1Mapping[assetClass1];
  if (!dbAssetClass1) {
    return res.status(400).json({ message: "Invalid asset class 1" });
  }

  console.log(
    `Fetching comparison data for: ${dbAssetClass1}, SubClass: ${
      assetClass2 || "None"
    }, Client ID: ${client_id}`
  );

  // Case 1: No subcategory
  if (!assetClass2) {
    const sql = `
      SELECT 
        date,
        asset_class_1,
        index_name,
        ROUND(one_month_return, 2) AS one_month_return,
        ROUND(composite_calculation_sum, 2) AS composite_calculation_sum
      FROM asset_class
      WHERE asset_class_1 = ?
        AND client_id = ?
        AND date IS NOT NULL
      ORDER BY date ASC, index_name ASC
    `;

    connection.query(sql, [dbAssetClass1, client_id], (err, rows) => {
      if (err) {
        console.error("MySQL Query Error:", err);
        return res.status(500).json({ message: "Database error", error: err.sqlMessage });
      }

      if (!rows.length) return res.json([]);

      console.log(`Found ${rows.length} records for client_id: ${client_id}`);

      const dateMap = new Map();

      rows.forEach((row) => {
        const dateKey = row.date.toISOString().split("T")[0];
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, {
            date: formatDateLabel(row.date),
            fullDate: formatFullDate(row.date),
            value: parseFloat(row.one_month_return) || 0,
            nifty50: 0,
            nse150: 0,
            nse500: 0,
            nseGscmp: 0,
            overnightLiquid: 0,
          });
        }

        const data = dateMap.get(dateKey);
        const indexValue = parseFloat(row.composite_calculation_sum) || 0;

        switch (row.index_name) {
          case "NIFTY 50": data.nifty50 = indexValue; break;
          case "NSE 150": data.nse150 = indexValue; break;
          case "NSE 500": data.nse500 = indexValue; break;
          case "NSE GSCMP": data.nseGscmp = indexValue; break;
          case "Overnight Liquid Rate": data.overnightLiquid = indexValue; break;
        }
      });

      let formattedData = Array.from(dateMap.values());
  
      if (formattedData.length > 0) {
        const first = formattedData[0];
        const prev = getPreviousMonthLabels(first.fullDate);
        if (prev) {
          formattedData.unshift({
            date: prev.date,
            fullDate: prev.fullDate,
            value: 0,
            nifty50: 0,
            nse150: 0,
            nse500: 0,
            nseGscmp: 0,
            overnightLiquid: 0,
          });
        }
      }

      res.json(formattedData);
    });
  }

  // Case 2: If subcategory exists
  else {
    const dbAssetClass2 = assetClass2Mapping[assetClass2];
    if (!dbAssetClass2) {
      return res.status(400).json({ message: "Invalid asset class 2" });
    }

    const sql = `
      SELECT 
        sa.date,
        sa.asset_class_1,
        sa.asset_class_2,
        sa.index_name,
        ROUND(sa.composite_calculation, 2) AS composite_calculation,
        ROUND(sa.one_month_return, 2) AS one_month_return
      FROM subassetclass sa
      WHERE sa.asset_class_2 = ?
        AND sa.asset_class_1 = ?
        AND sa.client_id = ?
        AND sa.date IS NOT NULL
      ORDER BY sa.date ASC, sa.index_name ASC
    `;

    connection.query(sql, [dbAssetClass2, dbAssetClass1, client_id], (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Database error", error: err.sqlMessage });
      }

      if (!rows.length) return res.json([]);

      const dateMap = new Map();

      rows.forEach((row) => {
        const dateKey = row.date.toISOString().split("T")[0];

        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, {
            date: formatDateLabel(row.date),
            fullDate: formatFullDate(row.date),
            value: 0,
            nifty50: 0,
            nse150: 0,
            nse500: 0,
            nseGscmp: 0,
            overnightLiquid: 0,
          });
        }

        const data = dateMap.get(dateKey);
        const calculatedValue = parseFloat(row.composite_calculation) || 0;

        switch (row.index_name) {
          case "NIFTY 50": data.nifty50 = calculatedValue; break;
          case "NSE 150": data.nse150 = calculatedValue; break;
          case "NSE 500": data.nse500 = calculatedValue; break;
          case "NSE GSCMP": data.nseGscmp = calculatedValue; break;
          case "Overnight Liquid Rate": 
            data.overnightLiquid = calculatedValue;
            data.value = parseFloat(row.one_month_return) || 0;
            break;
        }
      });

      let formattedData = Array.from(dateMap.values());

      if (formattedData.length > 0) {
        const first = formattedData[0];
        const prev = getPreviousMonthLabels(first.fullDate);
        if (prev) {
          formattedData.unshift({
            date: prev.date,
            fullDate: prev.fullDate,
            value: 0,
            nifty50: 0,
            nse150: 0,
            nse500: 0,
            nseGscmp: 0,
            overnightLiquid: 0,
          });
        }
      }

      res.json(formattedData);
    });
  }
};



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
      mtd_value,
      mtd_return,
      fytd_value,
      fytd_return
    FROM pan_kpi_summary
    WHERE client_id = ?
  `;

  console.log("Client ID:", req.params.client_id);

  connection.query(sql, [req.params.client_id], (err, rows) => {
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
     client_id,
     asset_class,
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
    FROM asset_class_summary
    WHERE client_id = ?
    ORDER BY FIELD(asset_class, 
      'Equity', 
      'Fixed Income', 
      'Alternative Investments', 
      'Cash'
    );
  `;

  connection.query(sql, [req.params.clientId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json(rows);
  });
};


const getAccountKpiByClient = (req, res) => {
  const rawClient = req.params.client_id;
  const client_id = Number(rawClient);

  if (!rawClient || isNaN(client_id)) {
    return res.status(400).json({ error: "Invalid or missing client_id" });
  }

  const sql = `
    SELECT *
    FROM account_kpi_summary
    WHERE client_id = ?
    ORDER BY account_name ASC;
  `;

  connection.query(sql, [client_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });

    res.json(rows);
  });
};


const getAssetClassByAccount = (req, res) => {
  const rawClient = req.params.client_id;
  const client_id = Number(rawClient);
  const accountName = req.params.account_name?.trim();

  if (!rawClient || isNaN(client_id) || !accountName) {
    return res.status(400).json({ error: "Invalid client_id or account_name missing" });
  }

  const sql = `
    SELECT 
      account_name,
      asset_class,
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
    FROM assetclass1_kpi_summary
    WHERE client_id = ?
      AND account_name = ?
    ORDER BY FIELD(asset_class, 
      'Equity', 
      'Fixed Income', 
      'Alternative Investments', 
      'Cash'
    );
  `;

  connection.query(sql, [client_id, accountName], (err, rows) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });

    res.json(rows);
  });
};




const getAllSubAsset = (req, res) => {
  const rawClient = req.params.client_id;
  const client_id = Number(rawClient);
  const assetClass = req.params.assetClass?.trim() || "";

  if (!rawClient || isNaN(client_id)) {
    return res.status(400).json({ error: "Invalid or missing client_id" });
  }

  console.log("Client:", client_id, "| AssetClass:", assetClass);
const sql = `
  SELECT DISTINCT
    asset_class2 AS sub_asset,
    id,
    client_id,
    asset_class AS asset_class_1,
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
  FROM asset_class2_summary
  WHERE client_id = ?
  AND LOWER(TRIM(asset_class)) = LOWER(TRIM(?))
  ORDER BY sub_asset;
`;


  connection.query(sql, [client_id, assetClass], (err, rows) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json(rows);
  });
};


const getSubAssetsByAccount = (req, res) => {
  const client_id = Number(req.params.client_id);
  const accountName = decodeURIComponent(req.params.account_name).trim();

  if (!client_id || !accountName) {
    return res.status(400).json({ error: "Invalid client_id or account_name missing" });
  }

  const sql = `
    SELECT 
      account_name,
      asset_class,
      asset_class2 AS sub_asset_class,
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
    FROM assetclass2_kpi_summary
    WHERE client_id = ?
      AND LOWER(TRIM(account_name)) = LOWER(TRIM(?))
    ORDER BY 
      FIELD(asset_class, 'Equity', 'Fixed Income', 'Alternative Investments', 'Cash'),
      sub_asset_class;
  `;

  connection.query(sql, [client_id, accountName], (err, rows) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });

    res.json(rows);
  });
};
// const getallSubAssetClass = async (req, res) => {
//   const { client_id, account_name, asset_class } = req.params;

//   const [rows] = await connection.query(
//     `SELECT sub_asset_class, today_total
//      FROM AssetClass2_KPI_Summary 
//      WHERE client_id=? AND account_name=? AND asset_class=?`,
//     [client_id, account_name, asset_class]
//   );

//   res.json({ subassets: rows });
// };

const getallSubAssetClass = (req, res) => {
  const { client_id, account_name, asset_class } = req.params;

  const sql = `
    SELECT asset_class2, today_total, daily_return
    FROM assetclass2_kpi_summary
    WHERE client_id = ? AND account_name = ? AND asset_class = ?
  `;

  connection.query(sql, [client_id, account_name, asset_class], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.sqlMessage });
    }

    res.json({ subassets: rows });
  });
};




 const getPanAssetSummary = (req, res) => {
  const { client_id } = req.params;

  const sql = `
    SELECT 
      client_id,
      account_name,
      asset_class,
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
    FROM assetclass1_kpi_summary
    WHERE client_id = ?
    ORDER BY asset_class, account_name;
  `;

  connection.query(sql, [client_id], (err, rows) => {
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



// PAN KPI - get all PANs for a client
const getPanKpiByClient = (req, res) => {
  const rawClient = req.params.client_id;
  const client_id = Number(rawClient);

  if (!rawClient || isNaN(client_id)) {
    return res.status(400).json({ error: "Invalid or missing client_id" });
  }

  const sql = `
    SELECT *
    FROM pan_kpi_summary
    WHERE client_id = ?
    ORDER BY client_no ASC;
  `;

  connection.query(sql, [client_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });

    res.json(rows);
  });
};




module.exports = {getComparisonData, filterAccount,getallSubAssetClass,  getPanKpiByClient,getAssetClassByAccount,getSubAssetsByAccount,filterPan, getAccount, filterAssetclass1, filterSubAsset, filterAllAssetClass, getAllSubAsset, getPanAssetSummary, getAccountKpiByClient};
