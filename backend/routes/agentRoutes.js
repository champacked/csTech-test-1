const express = require("express");
const { createAgent } = require("../controllers/agentController");

const router = express.Router();
router.post("/add", createAgent);

module.exports = router;
