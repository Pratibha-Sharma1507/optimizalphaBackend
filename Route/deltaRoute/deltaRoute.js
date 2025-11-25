const express = require("express");
const deltaRouter = express.Router()
const {  getClientFYTD, getClientMTD, getEntityFYTD } = require("../../Contoller/deltaController/deltaContoller");
// const verifyUser = require('../../Middleware/authMiddleware')
// const {verifyUser} = require("../../Contoller/userController/userController")
const { verifyToken } = require('../../Middleware/authMiddleware')




deltaRouter.get("/api/fytd/:client_id",verifyToken, getClientFYTD);
deltaRouter.get("/api/mtd/:client_id",verifyToken, getClientMTD);
deltaRouter.get("/api/entity/fytd/:client_id",verifyToken, getEntityFYTD);

module.exports = deltaRouter;
