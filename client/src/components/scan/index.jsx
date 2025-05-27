import React, { useState } from "react";
import "./scan.css";

function Scan() {
  const [activeTab, setActiveTab] = useState("services");
  const [scanType, setScanType] = useState("TCP");
  const [osDetection, setOsDetection] = useState(false);
  const [snortEnabled, setSnortEnabled] = useState(false);
  const [services, setServices] = useState([
    { name: "SSH", enabled: true },
    { name: "HTTP", enabled: true },
    { name: "SMTP", enabled: true },
    { name: "FTP", enabled: true },
    { name: "Telnet", enabled: false },
    { name: "HTTPS", enabled: false },
    { name: "SMB", enabled: false },
    { name: "DNS", enabled: false },
  ]);

  const [scanResult, setScanResult] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleService = (index) => {
    const updated = [...services];
    updated[index].enabled = !updated[index].enabled;
    setServices(updated);
  };

  const handleScan = async () => {
    setLoading(true);
    setScanResult("");
    try {
      // 1. Wysyłamy do backendu status usług do włączenia/wyłączenia (linux_machine_2)
      const servicesPayload = services.map(s => ({ name: s.name, enabled: s.enabled }));
      await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services: servicesPayload }),
      });

      // 2. Uruchamiamy snort na linux_machine_2 jeśli włączony
      if (snortEnabled) {
        await fetch("/api/snort", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enable: true }),
        });
      } else {
        await fetch("/api/snort", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enable: false }),
        });
      }

      // 3. Uruchamiamy nmap scan na linux_machine_1 (adres IP stały)
      const nmapActionMap = {
        TCP: "nmap_scan_1",
        Stealth: "nmap_scan_2",
        UDP: "nmap_scan_3",
      };
      const nmapAction = nmapActionMap[scanType];

      const nmapResp = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ action: nmapAction }),
      });

      const text = await nmapResp.text();
      setScanResult(text); // renderujemy cały zwrócony HTML albo wyświetlamy jako tekst

      setLoading(false);
    } catch (e) {
      setLoading(false);
      setScanResult("Error during scan: " + e.message);
    }
  };

  return (
    <div className="scan-wrapper">
      <div className="scan-container">
        <h2 className="scan-title">Network Scanner</h2>

        <div className="tabs">
          <button className={`tab-button ${activeTab === "services" ? "active" : ""}`} onClick={() => setActiveTab("services")}>Services</button>
          <button className={`tab-button ${activeTab === "nmap" ? "active" : ""}`} onClick={() => setActiveTab("nmap")}>Nmap</button>
          <button className={`tab-button ${activeTab === "snort" ? "active" : ""}`} onClick={() => setActiveTab("snort")}>Snort</button>
        </div>

        {activeTab === "services" && (
          <div className="services-section">
            <h3>Services (linux_machine_2)</h3>
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
            <select id="scanType" value={scanType} onChange={(e) => setScanType(e.target.value)}>
              <option value="TCP">TCP Scan</option>
              <option value="Stealth">Stealth Scan</option>
              <option value="UDP">UDP Scan</option>
            </select>

            <p className="scan-help">
              <a href="https://nmap.org/book/man.html" target="_blank" rel="noopener noreferrer">
                See the official <strong>nmap</strong> documentation
              </a>
            </p>
            <label>
              <input type="checkbox" checked={osDetection} onChange={(e) => setOsDetection(e.target.checked)} />
              Enable OS Detection (optional)
            </label>
          </form>
        )}

        {activeTab === "snort" && (
          <form>
            <label>
              <input type="checkbox" checked={snortEnabled} onChange={(e) => setSnortEnabled(e.target.checked)} />
              Enable Snort (IDS/IPS on linux_machine_2)
            </label>
            <p className="scan-help">
              <a href="http://manual-snort-org.s3-website-us-east-1.amazonaws.com/" target="_blank" rel="noopener noreferrer">
                See the official <strong>snort</strong> documentation
              </a>
            </p>
          </form>
        )}

        <button className="submit-button" onClick={handleScan} disabled={loading}>
          {loading ? "Scanning..." : "Start Scanning"}
        </button>

        {scanResult && (
          <div className="status-message" style={{ whiteSpace: "pre-wrap", marginTop: "1rem" }}>
            {scanResult}
          </div>
        )}
      </div>
    </div>
  );
}

export default Scan;