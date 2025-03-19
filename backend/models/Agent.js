const mongoose = require("mongoose");

const AgentSchema = new mongoose.Schema({
  name: String,
  email: String,
  mobile: String,
  password: String,
});

module.exports = mongoose.model("Agent", AgentSchema);
