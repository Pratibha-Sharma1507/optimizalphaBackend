const express = require("express");
const accountRouter = express.Router();
const { getAccountKpiSummary } = require("../../Contoller/accountController/accountController");
// const verifyUser = require('../../Middleware/authMiddleware')
// const {verifyUser} = require("../../Contoller/userController/userController")
const { verifyToken } = require('../../Middleware/authMiddleware')



// Example: GET /api/account?currency=USD
accountRouter.get("/account", verifyToken, getAccountKpiSummary);

module.exports = accountRouter;
