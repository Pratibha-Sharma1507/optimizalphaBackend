const express = require("express");
const assetRouter = express.Router();
const { getAlternative, getCash, getEquity, getFixedIncome } = require("../../Contoller/assetClassController/assetClassController");

assetRouter.get("/alternative", getAlternative);
assetRouter.get("/cash", getCash);
assetRouter.get("/euity", getEquity);
assetRouter.get("/fixedincome", getFixedIncome);

module.exports = assetRouter;