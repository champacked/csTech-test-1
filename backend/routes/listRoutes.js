const express = require("express");
const multer = require("multer");
const {
  uploadList,
  getDistributedList,
} = require("../controllers/listController");

const router = express.Router();

// Configure multer to store files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/upload", upload.single("file"), uploadList);
router.get("/lists", getDistributedList);

module.exports = router;
