import React from "react"
import "./snort.css"
import snortLogo from '../../images/snort-logo.png'

function Snort() {
  return (
    <div className="snort-container">
      <img src={snortLogo} alt="Snort Logo" className="snort-logo" />
      <div className="snort-content">
        <h1>What is Snort?</h1>
        <p>
          <strong>Snort</strong> is an open-source network intrusion detection system (IDS) and intrusion prevention system (IPS) developed and maintained by Cisco Systems. It is widely used in both enterprise and personal environments to monitor network traffic in real-time, detect suspicious behavior, and actively block potential threats.
        </p>
        <p>
          <strong>Snort</strong> operates by analyzing network packets and applying a set of user-defined rules to identify malicious activity, such as port scans, buffer overflow attacks, web application exploits, denial-of-service (DoS) attempts, and more. It uses a powerful and flexible rule-based language that allows users to create custom rules tailored to their specific environments.
        </p>
      </div>
    </div>
  )
}

export default Snort;
