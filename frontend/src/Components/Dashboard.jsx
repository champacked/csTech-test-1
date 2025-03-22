import { useState, useEffect } from "react";
import axios from "axios";

function Dashboard({ onLogout }) {
  const [file, setFile] = useState(null);
  const [lists, setLists] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [groupedLists, setGroupedLists] = useState({});
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [showManageAgents, setShowManageAgents] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentFormData, setAgentFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
  });

  useEffect(() => {
    fetchLists();
  }, []);

  useEffect(() => {
    const grouped = lists.reduce((acc, item) => {
      const agentName = item.agentId?.name || "Unassigned";
      if (!acc[agentName]) {
        acc[agentName] = [];
      }
      acc[agentName].push(item);
      return acc;
    }, {});
    setGroupedLists(grouped);
  }, [lists]);

  const fetchLists = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/lists/lists`,
        {
          headers: {
            Authorization: localStorage.getItem("token"),
          },
        }
      );
      setLists(response.data);
    } catch (err) {
      setError("Failed to fetch lists");
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError("");
    setSuccessMessage("");
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post("http://localhost:2000/api/lists/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: localStorage.getItem("token"),
        },
      });
      setSuccessMessage("File uploaded successfully");
      setFile(null);
      fetchLists();
    } catch (err) {
      setError(err.response?.data?.msg || "Upload failed");
    }
  };

  const handleAgentFormChange = (e) => {
    setAgentFormData({
      ...agentFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAgentSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:2000/api/agents/add", agentFormData, {
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      });

      await axios.post(
        "http://localhost:2000/api/lists/redistribute",
        {},
        {
          headers: {
            Authorization: localStorage.getItem("token"),
          },
        }
      );

      setSuccessMessage("Agent added successfully and contacts redistributed");
      setShowAgentForm(false);
      setAgentFormData({ name: "", email: "", mobile: "", password: "" });
      fetchLists();
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to add agent");
    }
  };

  const handleAgentSelect = (agentName) => {
    setSelectedAgent(agentName === selectedAgent ? null : agentName);
  };

  return (
    <div className="dashboard-container">
      <div className="header">
        <h2>Dashboard</h2>
        <div className="header-buttons">
          <button
            className="add-agent-btn"
            onClick={() => setShowAgentForm(true)}
          >
            Add Agent
          </button>
          <button
            className="manage-agents-btn"
            onClick={() => setShowManageAgents(!showManageAgents)}
          >
            Manage Agents
          </button>
          <button onClick={onLogout}>Logout</button>
        </div>
      </div>

      {showManageAgents && (
        <div className="manage-agents-section">
          <h3>Manage Agents</h3>
          <table className="agents-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Agent Name</th>
                <th>Contact Count</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedLists).map(
                ([agentName, contacts], index) => (
                  <tr
                    key={index}
                    onClick={() => handleAgentSelect(agentName)}
                    className={
                      selectedAgent === agentName ? "selected-row" : ""
                    }
                  >
                    <td>{index + 1}</td>
                    <td>{agentName}</td>
                    <td className="contact-count">{contacts.length}</td>
                  </tr>
                )
              )}
            </tbody>
          </table>

          {selectedAgent && (
            <div className="agent-contacts-section">
              <h4>Contacts for {selectedAgent}</h4>
              <table className="contacts-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedLists[selectedAgent].map((contact, index) => (
                    <tr key={index}>
                      <td>{contact.firstName}</td>
                      <td>{contact.phone}</td>
                      <td>{contact.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showAgentForm && (
        <div className="upload-section">
          <h3>Add New Agent</h3>
          {error && <div className="error">{error}</div>}
          {successMessage && <div className="success">{successMessage}</div>}
          <form onSubmit={handleAgentSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Agent Name"
              value={agentFormData.name}
              onChange={handleAgentFormChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={agentFormData.email}
              onChange={handleAgentFormChange}
              required
            />
            <input
              type="tel"
              name="mobile"
              placeholder="Mobile Number"
              value={agentFormData.mobile}
              onChange={handleAgentFormChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={agentFormData.password}
              onChange={handleAgentFormChange}
              required
            />
            <div className="form-buttons">
              <button type="submit">Add Agent</button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowAgentForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="upload-section">
        <h3>Upload CSV File</h3>
        {error && <div className="error">{error}</div>}
        {successMessage && <div className="success">{successMessage}</div>}
        <form onSubmit={handleUpload}>
          <input type="file" accept=".csv" onChange={handleFileChange} />
          <button type="submit">Upload</button>
        </form>
      </div>
    </div>
  );
}

export default Dashboard;
