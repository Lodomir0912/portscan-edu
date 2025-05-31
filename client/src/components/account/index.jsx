import React, { useState, useEffect } from "react";
import "./account.css";

function Account() {
  const [userData, setUserData] = useState(null);
  const [scanFiles, setScanFiles] = useState([]);
  const [error, setError] = useState("");

  const token = localStorage.getItem("access_token");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch("/api/user", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch user data");
        const data = await res.json();
        setUserData(data);
      } catch (e) {
        setError("Błąd pobierania danych użytkownika");
      }
    };

    const fetchScanFiles = async () => {
      try {
        const res = await fetch("/api/user/scans", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch scans");
        const data = await res.json();
        setScanFiles(data.scans || []);
      } catch (e) {
        setError("Błąd pobierania skanów");
      }
    };

    if (token) {
      fetchUserData();
      fetchScanFiles();
    }
  }, [token]);

  // Funkcja do pobierania pliku z backendu
  const handleDownload = async (scan) => {
    try {
      const res = await fetch(`/api/download/${scan.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Błąd pobierania pliku");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = scan.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError("Błąd pobierania pliku");
    }
  };

  return (
    <div className="scan-wrapper">
      <div className="scan-container">
        <h2 className="scan-title">Konto użytkownika</h2>
        {error && <div className="status-message">{error}</div>}
        {!userData ? (
          <div>Ładowanie danych...</div>
        ) : (
          <div>
            <div className="user-section">
              <h3>Dane użytkownika</h3>
              <p><strong>Email:</strong> {userData.username}</p>
              <p><strong>Hasło:</strong> {userData.password}</p>
            </div>
            <div className="scans-section">
              <h3>Twoje skany</h3>
              {scanFiles.length === 0 ? (
                <p>Brak zapisanych skanów.</p>
              ) : (
                <ul>
                  {scanFiles.map((scan) => (
                    <li key={scan.id}>
                      <strong>{scan.filetype}</strong>: {scan.filename}{" "}
                      {scan.hashtag && <span>({scan.hashtag})</span>}{" "}
                      <span>{scan.created_at}</span>
                      <button
                        className="download-button"
                        onClick={() => handleDownload(scan)}
                      >
                        Pobierz
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Account;