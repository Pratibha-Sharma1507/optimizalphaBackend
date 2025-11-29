const express = require("express");
const filterRouter = express.Router();
const {getComparisonData, filterAccount,getallSubAssetClass,getAssetClassByAccount, getPanKpiByClient, getSubAssetsByAccount,filterPan, getAccount, filterAssetclass1, filterAllAssetClass, getAllSubAsset, getPanAssetSummary, getAccountKpiByClient } = require("../../Contoller/filterController/filterController");
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


filterRouter.get('/api/comparison-data', verifyToken,getComparisonData);



module.exports = filterRouter;
