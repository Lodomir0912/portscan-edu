import React, { useState } from "react";
import "./scan.css";

function Scan() {
  const [activeTab, setActiveTab] = useState("nmap");
  const [scanType, setScanType] = useState("TCP");
  const [osDetection, setOsDetection] = useState(false);
  const [snortEnabled, setSnortEnabled] = useState(false);
  const [scanResult, setScanResult] = useState("");

  const handleScan = () => {
    // Placeholder for triggering backend logic
    setScanResult("Scan has started...\n\n(output from backend)");
  };

  return (
    <div className="scan-wrapper">
      <div className="scan-container">
        <h2 className="scan-title">Scan Services</h2>

        <div className="tabs">
          <button
            className={`tab-button ${activeTab === "nmap" ? "active" : ""}`}
            onClick={() => setActiveTab("nmap")}
          >
            Nmap
          </button>
          <button
            className={`tab-button ${activeTab === "snort" ? "active" : ""}`}
            onClick={() => setActiveTab("snort")}
          >
            Snort
          </button>
        </div>

        {activeTab === "nmap" && (
          <form>
            <label htmlFor="scanType"><h3>Scan Type:</h3></label>
            <select
              id="scanType"
              value={scanType}
              onChange={(e) => setScanType(e.target.value)}
            >
              <option value="TCP">TCP Scan</option>
              <option value="Stealth">Stealth Scan</option>
              <option value="UDP">UDP Scan</option>
            </select>
            
            <p className="scan-help">
                <a
                    href="https://nmap.org/book/man.html"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                See the official <strong>nmap</strong> documentation for more details
              </a>
            </p>
            <label>
              <input
                type="checkbox"
                checked={osDetection}
                onChange={(e) => setOsDetection(e.target.checked)}
              />
              Enable OS Detection
            </label>
          </form>
        )}

        {activeTab === "snort" && (
          <form>
            <label>
              <input
                type="checkbox"
                checked={snortEnabled}
                onChange={(e) => setSnortEnabled(e.target.checked)}
              />
              Enable Snort (IDS/IPS)
            </label>
            <p className="scan-help">
                <a
                    href="http://manual-snort-org.s3-website-us-east-1.amazonaws.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                See the official <strong>snort</strong> documentation for more details
              </a>
            </p>
          </form>
        )}

        <button className="submit-button" onClick={handleScan}>
          Start Scanning
        </button>

        {scanResult && <p className="status-message">{scanResult}</p>}
      </div>
    </div>
  );
}

export default Scan;
