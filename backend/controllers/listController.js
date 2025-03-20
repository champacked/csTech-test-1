const csv = require("csv-parser");
const { Readable } = require("stream");
const List = require("../models/List");
const Agent = require("../models/Agent");
const XLSX = require("xlsx");

// Validate file type
const validateFileType = (file) => {
  const allowedTypes = [
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];
  const allowedExtensions = [".csv", ".xls", ".xlsx"];

  const fileExtension = "." + file.originalname.split(".").pop().toLowerCase();

  if (!allowedExtensions.includes(fileExtension)) {
    throw new Error(
      "Invalid file type. Only CSV, XLS, and XLSX files are allowed."
    );
  }

  if (file.mimetype && !allowedTypes.includes(file.mimetype)) {
    throw new Error(
      "Invalid file type. Only CSV, XLS, and XLSX files are allowed."
    );
  }
};

// Validate required columns
const validateColumns = (headers) => {
  const requiredColumns = ["FirstName", "Phone"];
  const missingColumns = requiredColumns.filter(
    (col) => !headers.includes(col)
  );

  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(", ")}`);
  }
};

// Process Excel file
const processExcelFile = (buffer) => {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

  if (data.length < 2) {
    // At least headers and one row
    throw new Error("File is empty or contains no data rows");
  }

  const headers = data[0].map((h) => String(h).trim());
  validateColumns(headers);

  return data
    .slice(1)
    .map((row) => ({
      firstName: row[headers.indexOf("FirstName")]?.toString().trim() || "",
      phone: row[headers.indexOf("Phone")]?.toString().trim() || "",
      notes: row[headers.indexOf("Notes")]?.toString().trim() || "",
    }))
    .filter((item) => item.firstName && item.phone);
};

// Process CSV file
const processCSVFile = async (fileContent) => {
  let items = [];
  let headers = null;

  const stream = Readable.from(fileContent);

  return new Promise((resolve, reject) => {
    stream
      .pipe(csv())
      .on("headers", (csvHeaders) => {
        headers = csvHeaders.map((h) => h.trim());
        try {
          validateColumns(headers);
        } catch (error) {
          reject(error);
        }
      })
      .on("data", (row) => {
        if (row.FirstName && row.Phone) {
          items.push({
            firstName: row.FirstName.trim(),
            phone: row.Phone.trim(),
            notes: row.Notes ? row.Notes.trim() : "",
          });
        }
      })
      .on("end", () => resolve(items))
      .on("error", (error) => reject(error));
  });
};

exports.uploadList = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        msg: "No file uploaded. Please upload a valid CSV, XLS, or XLSX file.",
      });
    }

    // Validate file type
    validateFileType(req.file);

    let items = [];
    const fileExtension = req.file.originalname.split(".").pop().toLowerCase();

    // Process file based on type
    if (fileExtension === "csv") {
      const fileContent = req.file.buffer
        .toString("utf8")
        .replace(/^\uFEFF/, "");
      items = await processCSVFile(fileContent);
    } else {
      items = processExcelFile(req.file.buffer);
    }

    if (items.length === 0) {
      return res.status(400).json({
        msg: "No valid data found in the file. Please ensure the file contains valid data in the correct format.",
      });
    }

    // Get all agents
    let agents = await Agent.find();
    if (agents.length < 5) {
      await Agent.deleteMany();
      agents = await Agent.insertMany(
        Array.from({ length: 5 }, (_, i) => ({ name: `Agent ${i + 1}` }))
      );
    }

    // Clear existing lists before adding new ones
    await List.deleteMany({});

    // Distribute items among agents
    const distributedLists = items.map((item, index) => ({
      ...item,
      agentId: agents[index % agents.length]._id,
    }));

    // Save distributed lists in MongoDB
    await List.insertMany(distributedLists);

    res.status(201).json({
      msg: "File processed and saved successfully",
      distributedLists,
    });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(400).json({
      msg: error.message || "Error processing file",
      error: error.message,
    });
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
