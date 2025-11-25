const express = require("express");
const filterRouter = express.Router();
const { filterAccount,getallSubAssetClass,getAssetClassByAccount, getPanKpiByClient, getSubAssetsByAccount,filterPan, getAccount, filterAssetclass1, filterAllAssetClass, getAllSubAsset, getPanAssetSummary, getAccountKpiByClient } = require("../../Contoller/filterController/filterController");
// const verifyUser = require('../../Middleware/authMiddleware')
// const {verifyUser} = require("../../Contoller/userController/userController")
const { verifyToken } = require('../../Middleware/authMiddleware')



// Example: GET /api/account?currency=USD
filterRouter.get("/api/account-summary/:client_id", verifyToken, getAccountKpiByClient);

 filterRouter.get("/api/filter/accounts/:client_id", verifyToken,filterAccount);
 filterRouter.get("/api/filter/pan/:account_id", verifyToken, filterPan);
filterRouter.get('/api/filter/accounts', verifyToken, getAccount);
filterRouter.get("/api/filter/assetclass/:account_id/:pan_no", verifyToken, filterAssetclass1)
filterRouter.get("/api/filter/:client_id/:assetClass", verifyToken, getAllSubAsset);
filterRouter.get("/api/asset-classes/:clientId", verifyToken, filterAllAssetClass)
filterRouter.get("/api/assetclass2/:accountId/:assetClass", verifyToken, getAllSubAsset)
filterRouter.get("/api/asset-summary/:client_id",verifyToken, getPanAssetSummary);
filterRouter.get("/api/account-asset/:client_id/:account_name", verifyToken, getAssetClassByAccount);
filterRouter.get("/api/account/sub-asset/:client_id/:account_name", getSubAssetsByAccount);
// e.g. in panRouter.js or kpiRouter.js
filterRouter.get("/api/pan-summary1/:client_id", verifyToken, getPanKpiByClient);

filterRouter.get("/api/subassets/:client_id/:account_name/:asset_class",verifyToken,getallSubAssetClass); 


filterRouter.get('/api/comparison-data', (req, res) => {
  const data = [
    {
      date: "Sep'24",
      equity: 0,
      fixedIncome: 0,
      cash: 0,
      alternative: 0,
      nifty50: 0,
      nse150: 0,
      nse500: 0,
      nseGscm: 0
    },
    {
      date: "Oct'24",
      equity: 5.2,
      fixedIncome: 2.1,
      cash: 0.5,
      alternative: 3.8,
      nifty50: 4.1,
      nse150: 4.5,
      nse500: 4.2,
      nseGscm: 5.1
    },
    {
      date: "Nov'24",
      equity: 10.5,
      fixedIncome: 4.3,
      cash: 1.1,
      alternative: 8.2,
      nifty50: 9.2,
      nse150: 9.7,
      nse500: 8.9,
      nseGscm: 9.9
    },
    {
      date: "Dec'24",
      equity: 15.3,
      fixedIncome: 6.8,
      cash: 1.8,
      alternative: 12.1,
      nifty50: 13.5,
      nse150: 13.4,
      nse500: 12.7,
      nseGscm: 14.2
    },
    {
      date: "Jan'25",
      equity: 20.1,
      fixedIncome: 9.2,
      cash: 2.4,
      alternative: 16.5,
      nifty50: 17.8,
      nse150: 16.8,
      nse500: 15.9,
      nseGscm: 18.3
    },
    {
      date: "Feb'25",
      equity: 22.5,
      fixedIncome: 10.5,
      cash: 3.0,
      alternative: 19.8,
      nifty50: 18.2,
      nse150: 18.4,
      nse500: 17.0,
      nseGscm: 20.0
    }
  ];

  res.json(data);
});






module.exports = filterRouter;
