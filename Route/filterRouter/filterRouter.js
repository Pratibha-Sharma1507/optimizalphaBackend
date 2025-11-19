const express = require("express");
const filterRouter = express.Router();
const { filterAccount, filterPan, getAccount, filterAssetclass1, filterAllAssetClass, getAllSubAsset, getPanAssetSummary } = require("../../Contoller/filterController/filterController");
// const verifyUser = require('../../Middleware/authMiddleware')
// const {verifyUser} = require("../../Contoller/userController/userController")
const { verifyToken } = require('../../Middleware/authMiddleware')



// Example: GET /api/account?currency=USD
 filterRouter.get("/api/filter/accounts/:pan_id", verifyToken,filterAccount);
 filterRouter.get("/api/filter/pan/:account_id", verifyToken, filterPan);
filterRouter.get('/api/filter/accounts', verifyToken, getAccount);
filterRouter.get("/api/filter/assetclass/:account_id/:pan_no", verifyToken, filterAssetclass1)
filterRouter.get("/api/filter/:pan_id/:assetClass", verifyToken, getAllSubAsset);
filterRouter.get("/api/asset-classes/:panId", verifyToken, filterAllAssetClass)
filterRouter.get("/api/assetclass2/:accountId/:assetClass", verifyToken, getAllSubAsset)
filterRouter.get("/api/asset-summary/:pan_id",verifyToken, getPanAssetSummary);

module.exports = filterRouter;
