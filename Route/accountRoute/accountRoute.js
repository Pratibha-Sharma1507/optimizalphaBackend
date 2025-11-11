const express = require("express");
const accountRouter = express.Router();
const { getAccountKpiSummary } = require("../../Contoller/accountController/accountController");



// Example: GET /api/account?currency=USD
accountRouter.get("/account", getAccountKpiSummary);

module.exports = accountRouter;
