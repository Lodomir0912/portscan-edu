import React, { useState } from "react";
import "./scan.css";

function Scan() {
  const [activeTab, setActiveTab] = useState("services");
  const [scanType, setScanType] = useState("TCP");
  const [osDetection, setOsDetection] = useState(false);
  const [snortEnabled, setSnortEnabled] = useState(false);
  const [scanResult, setScanResult] = useState("");

  const defaultServices = [
    { name: "SSH", enabled: true },
    { name: "HTTP", enabled: true },
    { name: "SMTP", enabled: true },
    { name: "FTP", enabled: true },
  ];

  const optionalServices = [
    { name: "Telnet", enabled: false },
    { name: "HTTPS", enabled: false },
    { name: "SMB", enabled: false },
    { name: "DNS", enabled: false },
  ];

  const [services, setServices] = useState([...defaultServices, ...optionalServices]);

  const toggleService = (index) => {
    const updated = [...services];
    updated[index].enabled = !updated[index].enabled;
    setServices(updated);
  };

  const handleScan = () => {
    setScanResult("Scan has started...\n\n(output from backend)");
  };

  const downloadOutput = () => {
    const blob = new Blob([scanResult], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scan_output.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="scan-wrapper">
      <div className="scan-container">
        <h2 className="scan-title">Network Scanner</h2>

        <div className="tabs">
          <button
            className={`tab-button ${activeTab === "services" ? "active" : ""}`}
            onClick={() => setActiveTab("services")}
          >
            Services
          </button>
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

        {activeTab === "services" && (
          <div className="services-section">
            <h2>Enabled Services</h2>
            <div className="services-list">
              {services.map((service, idx) => (
                <div key={idx} className={`service-item ${service.enabled ? "enabled" : "disabled"}`}>
                  <span>{service.name}</span>
                  <button onClick={() => toggleService(idx)}>
                    {service.enabled ? "Stop" : "Start"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
                See the official <strong>nmap</strong> documentation
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
                See the official <strong>snort</strong> documentation
              </a>
            </p>
          </form>
        )}

        <button className="submit-button" onClick={handleScan}>
          Start Scanning
        </button>

        {scanResult && (
          <div className="output-section">
            <p className="status-message">{scanResult}</p>
            <button className="download-button" onClick={downloadOutput}>
              Download Output
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Scan;
