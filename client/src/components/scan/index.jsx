import React, { useState, useEffect } from "react";
import "./scan.css";

function Scan() {
  const [activeTab, setActiveTab] = useState("services");
  const [scanType, setScanType] = useState("TCP");
  const [osDetection, setOsDetection] = useState(false);
  const [snortEnabled, setSnortEnabled] = useState(false);
  const [snortMode, setSnortMode] = useState("IDS");
  const [snortVerbosity, setSnortVerbosity] = useState("normal");
  const [services, setServices] = useState([
    { name: "SSH", enabled: true },
    { name: "HTTP", enabled: true },
    { name: "SMTP", enabled: true },
    { name: "FTP", enabled: true },
    { name: "RPC", enabled: true },
    { name: "DNS", enabled: true },
  ]);
  const [scanResult, setScanResult] = useState("");
  const [rawXml, setRawXml] = useState("");
  const [loading, setLoading] = useState(false);
  const [snortAlert, setSnortAlert] = useState("");

  const toggleService = (index) => {  // wykonanie akcji na serwisach - uruchomienie lub wyłączenie
    const updated = [...services];
    updated[index].enabled = !updated[index].enabled;
    setServices(updated);
  };

  const fetchSnortLogs = async () => {  // pobranie danych o logach ze snorta
  try {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`/api/snort/logs?mode=${snortMode}&verbosity=${snortVerbosity}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = await response.json();

    return data.message || "";
  } catch (e) {
    console.error("Snort error:", e);
  }
};


  const handleScan = async () => {  // obsługa skana
    setLoading(true);
    setScanResult("");
    setRawXml("");
    setSnortAlert(null);
    
    const token = localStorage.getItem("access_token");
    try {
      const servicesPayload = services.map(s => ({ name: s.name, enabled: s.enabled }));  // aktualizacja serwisów
      await fetch("/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ services: servicesPayload }),
      });

      await fetch("/api/snort", { // pobranie informacji o konfiguracji snorta
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ 
          enable: snortEnabled, 
          mode: snortMode, 
          verbosity: snortVerbosity 
        }),
      });

      const nmapActionMap = { 
        TCP: "nmap_scan_1", 
        Stealth: "nmap_scan_2", 
        UDP: "nmap_scan_3", 
        NULL: "nmap_scan_4", 
        FIN: "nmap_scan_5", 
        XMAS: "nmap_scan_6"
      };
      const nmapAction = nmapActionMap[scanType];

      const nmapResp = await fetch("/api/scan", { // pobranie informacji o konfiguracji nmapa
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: new URLSearchParams({ 
          action: nmapAction, 
          osDetection: osDetection.toString() 
        }),
      });

      const nmapData = await nmapResp.json(); // pobranie informacji o wyniku nmapa lub/i snorta
      if (nmapResp.ok) {
        let resultText = nmapData.parsed;
        if (snortEnabled) {
          const alertText = await fetchSnortLogs();
          setSnortAlert(alertText);
        }
        setScanResult(resultText);
        setRawXml(nmapData.raw_xml);
      } else {
        setScanResult(`Error: ${nmapData.message}`);
      }

    } catch (e) {
      setScanResult("Error during scan: " + e.message);
    }
    setLoading(false);
  };

  const downloadXml = () => {
    const blob = new Blob([rawXml], { type: "application/xml" }); // pobranie pliku XML ze skanu nmapem
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "scan_result.xml";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const saveScan = async () => {
    const token = localStorage.getItem("access_token"); // zapisanie pliku XML
    if (!token) {
      alert("You need to log in to save the scan.");
      return;
    }
    const filename = `scan_${Date.now()}.xml`;
    const hashtag = prompt("Enter a hashtag for the scan (optional):") || "";
    try {
      const response = await fetch("/api/save_scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          xml: rawXml,
          filename: filename,
          hashtag: hashtag,
        }),
      });
      if (response.ok) {
        alert("Scan saved successfully!");
      } else {
        const data = await response.json();
        alert(`Error saving scan: ${data.message}`);
      }
    } catch (e) {
      alert("Failed to save scan: " + e.message);
    }
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
            <select 
              id="scanType" 
              value={scanType} 
              onChange={(e) => setScanType(e.target.value)}
            >
              <option value="TCP">TCP Scan</option>
              <option value="Stealth">Stealth Scan</option>
              <option value="UDP">UDP Scan</option>
              <option value="NULL">NULL Scan</option>
              <option value="FIN">FIN Scan</option>
              <option value="XMAS">XMAS Scan</option>
            </select>
            <p className="scan-help">
              <a href="https://nmap.org/book/man.html" target="_blank" rel="noopener noreferrer">
                See the official <strong>nmap</strong> documentation
              </a>
            </p>
            <label>
              <input 
                type="checkbox" 
                checked={osDetection} 
                onChange={(e) => setOsDetection(e.target.checked)} 
              />
              Enable OS Detection (optional)
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
            <div>
              <label>Mode:</label>
              <select 
                value={snortMode} 
                onChange={(e) => setSnortMode(e.target.value)}
              >
                <option value="IDS">IDS</option>
                <option value="IPS">IPS</option>
              </select>
            </div>
            <div>
              <label>Verbosity:</label>
              <select 
                value={snortVerbosity} 
                onChange={(e) => setSnortVerbosity(e.target.value)}
              >
                <option value="normal">Normal</option>
                <option value="verbose">Verbose</option>
              </select>
            </div>
            <p className="scan-help">
              <a href="http://manual-snort-org.s3-website-us-east-1.amazonaws.com/" 
                 target="_blank" 
                 rel="noopener noreferrer">
                See the official <strong>snort</strong> documentation
              </a>
            </p>
          </form>
        )}

        <button 
          className="submit-button" 
          onClick={handleScan} 
          disabled={loading}
        >
          {loading ? "Scanning..." : "Start Scanning"}
        </button>

        {scanResult && (
          <div className="status-message" style={{ whiteSpace: "pre-wrap", marginTop: "1rem" }}>
            {snortAlert && (
              <div style={{ color: "red", fontWeight: "bold", marginBottom: "1rem" }}>
                {snortAlert}
              </div>
            )}
            {scanResult}
            {rawXml && (
              <div className="download-container">
                <button className="download-button1" onClick={downloadXml}>Download Raw XML</button>
                <button className="save-button" onClick={saveScan}>Save Scan</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Scan;