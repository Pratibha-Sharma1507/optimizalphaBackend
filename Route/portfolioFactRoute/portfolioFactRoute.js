const express = require("express");
const router = express.Router();
const {
  getAssetClass1Summary,
  getAssetClass2Summary,
  getPortfolioDetails
} = require("../../Contoller/portFolioFactController/portfolioFactController");

router.get("/assetclass1", getAssetClass1Summary);
router.get("/assetclass2/:asset1", getAssetClass2Summary);
router.get("/portfolio/details/:asset1/:asset2", getPortfolioDetails);

module.exports = router;
