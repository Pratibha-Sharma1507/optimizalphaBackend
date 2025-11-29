const express = require("express");
const deltaRouter = express.Router()
const { allYear, getMonthlyComparison, getEntityYearlyAverage, getEntityMonthlyComparison,getAssetClassYearlyAvg , getAssetClassMonthly,getAssetClass2Yearly, getAssetClass2Monthly} = require("../../Contoller/deltaController/deltaContoller");
// const verifyUser = require('../../Middleware/authMiddleware')
// const {verifyUser} = require("../../Contoller/userController/userController")
const { verifyToken } = require('../../Middleware/authMiddleware')





deltaRouter.get("/api/avg-market-values/:clientId", verifyToken, allYear);
deltaRouter.get("/api/compare-monthly/:clientId", verifyToken,getMonthlyComparison);
deltaRouter.get("/api/avg-entity-values/:clientId", verifyToken, getEntityYearlyAverage);
deltaRouter.get("/api/entity-monthly/:clientId", verifyToken,getEntityMonthlyComparison);
deltaRouter.get("/api/avg-assetclass-yearly/:clientId", verifyToken, getAssetClassYearlyAvg);
deltaRouter.get("/api/avg-assetclass-monthly/:clientId", verifyToken, getAssetClassMonthly);
deltaRouter.get("/api/avg-assetclass2-yearly/:clientId", verifyToken, getAssetClass2Yearly);
deltaRouter.get("/api/avg-assetclass2-monthly/:clientId", verifyToken, getAssetClass2Monthly);


module.exports = deltaRouter;
