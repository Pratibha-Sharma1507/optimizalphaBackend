const express = require("express");
const panRouter = express.Router();
const {getPanList, getAllPans, getAllPanId, getAllPanBYID} = require("../../Contoller/panController/panController");
const { verifyToken } = require('../../Middleware/authMiddleware')

panRouter.get("/pans", verifyToken, getPanList);
panRouter.get("/api/pan-list/:account_id", verifyToken, getAllPans)
panRouter.get("/api/pan-details/:account_id/:pan_no", verifyToken, getAllPanId);
panRouter.get("/api/pan-summary/:account_id/:pan_no", verifyToken, getAllPanBYID);

module.exports = panRouter;
