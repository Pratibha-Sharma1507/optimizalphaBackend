const express = require("express");
const multer = require("multer");
const { uploadFile, getuser } = require("../../Contoller/uploadController/uploadController");
const {verifyToken} = require("../../Middleware/authMiddleware")


const router = express.Router();

// Use memory storage for file buffer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST /upload
router.post("/", upload.single("file"), uploadFile);
router.get("/current-user", verifyToken, getuser);

module.exports = router;
