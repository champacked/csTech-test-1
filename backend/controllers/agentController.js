const Agent = require("../models/Agent");

exports.createAgent = async (req, res) => {
  const agent = new Agent(req.body);
  await agent.save();
  res.json(agent);
};
