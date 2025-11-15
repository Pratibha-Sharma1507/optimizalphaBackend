const express = require("express");
const filterRouter = express.Router();
const { filterAccount, filterPan, getAccount, filterAssetclass1, filterSubAsset } = require("../../Contoller/filterController/filterController");
// const verifyUser = require('../../Middleware/authMiddleware')
// const {verifyUser} = require("../../Contoller/userController/userController")
const { verifyToken } = require('../../Middleware/authMiddleware')



// Example: GET /api/account?currency=USD
 filterRouter.get("/api/filter/accounts/:account_id", verifyToken,filterAccount);
 filterRouter.get("/api/filter/pan/:account_id", verifyToken, filterPan);
filterRouter.get('/api/filter/accounts', verifyToken, getAccount);
filterRouter.get("/api/filter/assetclass/:account_id/:pan_no", verifyToken, filterAssetclass1)
filterRouter.get("/api/filter/subassetclass/:account_id/:pan_no",verifyToken, filterSubAsset)
module.exports = filterRouter;
