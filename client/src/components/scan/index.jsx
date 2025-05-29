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
    { name: "RPC", enabled: true },
    { name: "DNS", enabled: true },
  ]);

  const [scanResult, setScanResult] = useState("");
  const [rawXml, setRawXml] = useState(""); // dodane: przechowuje surowy XML
  const [loading, setLoading] = useState(false);

  const toggleService = (index) => {
    const updated = [...services];
    updated[index].enabled = !updated[index].enabled;
    setServices(updated);
  };

  const handleScan = async () => {
    setLoading(true);
    setScanResult("");
    setRawXml("");
    try {
      const servicesPayload = services.map(s => ({ name: s.name, enabled: s.enabled }));
      await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services: servicesPayload }),
      });

      await fetch("/api/snort", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enable: snortEnabled }),
      });

      const nmapActionMap = { TCP: "nmap_scan_1", Stealth: "nmap_scan_2", UDP: "nmap_scan_3" };
      const nmapAction = nmapActionMap[scanType];

      const nmapResp = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ action: nmapAction, osDetection: osDetection.toString() }),
      });

      const data = await nmapResp.json();
      if (nmapResp.ok) {
          setScanResult(data.parsed);
          setRawXml(data.raw_xml); // surowy XML
      } else {
          setScanResult(`Error: ${data.message}`);
      }


      setLoading(false);
    } catch (e) {
      setLoading(false);
      setScanResult("Error during scan: " + e.message);
    }
  };

  const downloadXml = () => {
    const blob = new Blob([rawXml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "scan_result.xml";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <h3>Services</h3>
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
            {rawXml && (
              <div className="download-container">
                <button className="download-button" onClick={downloadXml}>Download Raw XML</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Scan;
