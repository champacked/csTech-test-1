import { useState, useEffect } from "react";
import axios from "axios";

function Dashboard({ onLogout }) {
  const [file, setFile] = useState(null);
  const [lists, setLists] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [groupedLists, setGroupedLists] = useState({});

  useEffect(() => {
    fetchLists();
  }, []);

  useEffect(() => {
    // Group lists by agent when lists data changes
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
        "http://localhost:2000/api/lists/lists",
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

  return (
    <div className="dashboard-container">
      <div className="header">
        <h2>Dashboard</h2>
        <button onClick={onLogout}>Logout</button>
      </div>

      <div className="upload-section">
        <h3>Upload CSV File</h3>
        {error && <div className="error">{error}</div>}
        {successMessage && <div className="success">{successMessage}</div>}
        <form onSubmit={handleUpload}>
          <input type="file" accept=".csv" onChange={handleFileChange} />
          <button type="submit">Upload</button>
        </form>
      </div>

      <div className="lists-section">
        <h3>Distributed Lists by Agent</h3>
        <div className="agents-grid">
          {Object.entries(groupedLists).map(([agentName, agentLists]) => (
            <div key={agentName} className="agent-section">
              <h4 className="agent-name">{agentName}</h4>
              <div className="agent-lists">
                {agentLists.map((item, index) => (
                  <div key={index} className="list-item">
                    <p>
                      <strong>Name:</strong> {item.firstName}
                    </p>
                    <p>
                      <strong>Phone:</strong> {item.phone}
                    </p>
                    <p>
                      <strong>Notes:</strong> {item.notes}
                    </p>
                  </div>
                ))}
              </div>
              <div className="agent-stats">
                <p>Total Contacts: {agentLists.length}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
