import React, { useEffect, useState } from "react";
import "./account.css";

function Account() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchScans = async () => {
      try {
        const token = localStorage.getItem("access_token"); // Pobranie tokenu JWT
        if (!token) {
          setError("Not authenticated. Please log in.");
          setLoading(false);
          return;
        }
        const response = await fetch("/api/user/scans", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          const data = await response.json();
          setError(data.message || "Failed to fetch scans.");
          setLoading(false);
          return;
        }
        const data = await response.json();
        setScans(data.scans);
        setLoading(false);
      } catch (err) {
        setError("Error fetching scans: " + err.message);
        setLoading(false);
      }
    };

    fetchScans();
  }, []);

  const handleDownload = async (id, filename) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`/api/download/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        alert("Error downloading file");
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Download failed: " + err.message);
    }
  };

  return (
    <div className="user-scans-wrapper">
      <h2>Your Recent Scans</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="error-message">{error}</p>}
      {!loading && !error && scans.length === 0 && <p>No scans found.</p>}
      {!loading && !error && scans.length > 0 && (
        <table className="scans-table">
          <thead>
            <tr>
              <th>Filename</th>
              <th>Type</th>
              <th>Hashtag</th>
              <th>Date</th>
              <th>Download</th>
            </tr>
          </thead>
          <tbody>
            {scans.map((scan) => (
              <tr key={scan.id}>
                <td>{scan.filename}</td>
                <td>{scan.filetype}</td>
                <td>{scan.hashtag}</td>
                <td>{scan.created_at}</td>
                <td>
                  <button
                    className="download-button"
                    onClick={() => handleDownload(scan.id, scan.filename)}
                  >
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Account;
