const express = require("express");
const multer = require("multer");
const { uploadFile } = require("../../Contoller/uploadController/uploadController");

const router = express.Router();

// Use memory storage for file buffer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST /upload
router.post("/", upload.single("file"), uploadFile);

module.exports = router;
