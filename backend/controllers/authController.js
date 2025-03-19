const User = require("../models/User");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const { email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ msg: "User already exists" });
  }

  // Create new user
  const user = new User({ email, password });
  await user.save();

  // Generate JWT token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {});

  res.status(201).json({ msg: "User registered successfully", token });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || user.password !== password) {
    return res.status(401).json({ msg: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  res.json({ token });
};
