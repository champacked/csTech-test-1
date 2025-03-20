const csv = require("csv-parser");
const { Readable } = require("stream");
const List = require("../models/List");
const Agent = require("../models/Agent");

exports.uploadList = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ msg: "No file uploaded. Please upload a valid CSV file." });
    }

    console.log("File received:", req.file);

    let fileContent = req.file.buffer.toString("utf8").replace(/^\uFEFF/, "");
    let items = [];
    const stream = Readable.from(fileContent);

    stream
      .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
      .on("data", (row) => {
        if (row.FirstName && row.Phone) {
          items.push({
            firstName: row.FirstName.trim(),
            phone: row.Phone.trim(),
            notes: row.Notes ? row.Notes.trim() : "",
          });
        }
      })
      .on("end", async () => {
        if (items.length === 0) {
          return res.status(400).json({ msg: "Invalid or empty CSV file" });
        }

        // Ensure we have exactly 5 agents in the database
        let agents = await Agent.find();
        if (agents.length < 5) {
          await Agent.deleteMany(); // Clear existing agents
          agents = await Agent.insertMany(
            Array.from({ length: 5 }, (_, i) => ({ name: `Agent ${i + 1}` }))
          );
        }

        // Distribute items among agents
        let distributedLists = items.map((item, index) => ({
          ...item,
          agentId: agents[index % agents.length]._id, // Assign agent in round-robin
        }));

        // Save distributed lists in MongoDB
        await List.insertMany(distributedLists);

        res.status(201).json({
          msg: "File processed and saved successfully",
          distributedLists,
        });
      })
      .on("error", (err) => {
        console.error("CSV Parsing Error:", err);
        res
          .status(500)
          .json({ msg: "Error processing file", error: err.message });
      });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Fetch distributed lists with agent details
exports.getDistributedList = async (req, res) => {
  try {
    const lists = await List.find().populate("agentId", "name");
    if (!lists.length) {
      return res.status(404).json({ msg: "No distributed lists found" });
    }
    res.status(200).json(lists);
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Redistribute contacts among all agents
exports.redistributeContacts = async (req, res) => {
  try {
    // Get all agents and contacts
    const agents = await Agent.find();
    const contacts = await List.find();

    if (!agents.length) {
      return res.status(400).json({ msg: "No agents found" });
    }

    if (!contacts.length) {
      return res.status(400).json({ msg: "No contacts to redistribute" });
    }

    // Calculate contacts per agent
    const contactsPerAgent = Math.floor(contacts.length / agents.length);
    const remainingContacts = contacts.length % agents.length;

    // Create distribution array
    let distribution = [];
    let currentIndex = 0;

    // Distribute contacts evenly among agents
    for (let i = 0; i < agents.length; i++) {
      let agentContacts = contactsPerAgent;
      // Add one more contact for the first 'remainingContacts' agents
      if (i < remainingContacts) {
        agentContacts++;
      }

      // Assign contacts to current agent
      for (
        let j = 0;
        j < agentContacts && currentIndex < contacts.length;
        j++
      ) {
        distribution.push({
          updateOne: {
            filter: { _id: contacts[currentIndex]._id },
            update: { $set: { agentId: agents[i]._id } },
          },
        });
        currentIndex++;
      }
    }

    // Execute bulk update
    if (distribution.length > 0) {
      await List.bulkWrite(distribution);
    }

    res.status(200).json({
      msg: "Contacts redistributed successfully",
      totalContacts: contacts.length,
      agentsCount: agents.length,
      contactsPerAgent,
    });
  } catch (error) {
    console.error("Redistribution Error:", error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};
