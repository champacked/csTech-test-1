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
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-[1400px] mx-auto p-4 md:p-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h2>
            <div className="flex flex-wrap gap-4 w-full md:w-auto">
              <button
                className="flex-1 md:flex-none px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 min-w-[120px] text-center"
                onClick={() => setShowAgentForm(true)}
              >
                Add Agent
              </button>
              <button
                className="flex-1 md:flex-none px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 min-w-[120px] text-center"
                onClick={() => setShowManageAgents(!showManageAgents)}
              >
                Manage Agents
              </button>
              <button
                className="flex-1 md:flex-none px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors duration-200 min-w-[120px] text-center"
                onClick={onLogout}
              >
                Logout
              </button>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Upload CSV File
            </h3>
            {error && (
              <div className="p-4 mb-6 rounded-lg bg-red-100 text-error font-medium text-center">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="p-4 mb-6 rounded-lg bg-green-100 text-success font-medium text-center">
                {successMessage}
              </div>
            )}
            <form onSubmit={handleUpload} className="flex flex-col gap-6">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 text-gray-700 dark:text-gray-200"
              />
              <button
                type="submit"
                className="w-full md:w-auto px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200"
              >
                Upload
              </button>
            </form>
          </div>
        </div>

        {showManageAgents && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Manage Agents
            </h3>
            <div className="overflow-x-auto rounded-lg">
              <table className="w-full min-w-[600px]">
                <thead className="bg-primary text-white">
                  <tr>
                    <th className="p-4 text-left font-semibold">ID</th>
                    <th className="p-4 text-left font-semibold">Agent Name</th>
                    <th className="p-4 text-left font-semibold">
                      Contact Count
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {Object.entries(groupedLists).map(
                    ([agentName, contacts], index) => (
                      <tr
                        key={index}
                        onClick={() => handleAgentSelect(agentName)}
                        className={`cursor-pointer transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          selectedAgent === agentName
                            ? "bg-gray-50 dark:bg-gray-700"
                            : ""
                        }`}
                      >
                        <td className="p-4 text-gray-900 dark:text-gray-200">
                          {index + 1}
                        </td>
                        <td className="p-4 text-gray-900 dark:text-gray-200">
                          {agentName}
                        </td>
                        <td className="p-4 font-semibold text-primary">
                          {contacts.length}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {selectedAgent && (
              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-bold text-primary mb-4">
                  Contacts for {selectedAgent}
                </h4>
                <div className="overflow-x-auto rounded-lg">
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-primary text-white">
                      <tr>
                        <th className="p-4 text-left font-semibold">Name</th>
                        <th className="p-4 text-left font-semibold">Phone</th>
                        <th className="p-4 text-left font-semibold">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {groupedLists[selectedAgent].map((contact, index) => (
                        <tr key={index}>
                          <td className="p-4 text-gray-900 dark:text-gray-200">
                            {contact.firstName}
                          </td>
                          <td className="p-4 text-gray-900 dark:text-gray-200">
                            {contact.phone}
                          </td>
                          <td className="p-4 text-gray-900 dark:text-gray-200">
                            {contact.notes}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {showAgentForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 max-w-[800px] mx-auto">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Add New Agent
            </h3>
            {error && (
              <div className="p-4 mb-6 rounded-lg bg-red-100 text-error font-medium text-center">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="p-4 mb-6 rounded-lg bg-green-100 text-success font-medium text-center">
                {successMessage}
              </div>
            )}
            <form onSubmit={handleAgentSubmit} className="flex flex-col gap-6">
              <input
                type="text"
                name="name"
                placeholder="Agent Name"
                value={agentFormData.name}
                onChange={handleAgentFormChange}
                required
                className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 text-gray-700 dark:text-gray-200"
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={agentFormData.email}
                onChange={handleAgentFormChange}
                required
                className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 text-gray-700 dark:text-gray-200"
              />
              <input
                type="tel"
                name="mobile"
                placeholder="Mobile Number"
                value={agentFormData.mobile}
                onChange={handleAgentFormChange}
                required
                className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 text-gray-700 dark:text-gray-200"
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={agentFormData.password}
                onChange={handleAgentFormChange}
                required
                className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 text-gray-700 dark:text-gray-200"
              />
              <div className="flex flex-col md:flex-row gap-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200"
                >
                  Add Agent
                </button>
                <button
                  type="button"
                  className="flex-1 px-6 py-3 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200"
                  onClick={() => setShowAgentForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
