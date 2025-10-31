const express = require("express");
const userPortfolioRouter = express.Router();
const {viewUserPortfolio, getPortfolioData} = require("../../Contoller/userPortfolioController/userPortfolioController");


userPortfolioRouter.get("/viewuserportfolio", viewUserPortfolio);
userPortfolioRouter.get("/data", getPortfolioData);


module.exports = userPortfolioRouter


