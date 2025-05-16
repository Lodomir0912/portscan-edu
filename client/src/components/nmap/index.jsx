import React from "react"
import "./nmap.css"
import nmapLogo from '../../images/nmap-logo.png'

function Nmap() {
  return (
    <div className="nmap-container">
      <img src={nmapLogo} alt="Nmap Logo" className="nmap-logo" />
      <div className="nmap-content">
        <h1>What is Nmap?</h1>
        <p>
          <strong>Nmap</strong> (Network Mapper) is a free and open-source utility used for network discovery and security auditing. It is designed to rapidly scan large networks, but it also works well against single hosts. Nmap uses raw IP packets to determine which hosts are available on the network, what services (application name and version) those hosts are offering, what operating systems they are running, and what type of firewalls or packet filters are in use.
        </p>
        <p>
          <strong>Nmap</strong> is widely used by system administrators, network engineers, and cybersecurity professionals for tasks such as network inventory, managing service upgrade schedules, and monitoring host or service uptime. It is a powerful tool in penetration testing and vulnerability assessments.
        </p>
      </div>
    </div>
  )
}

export default Nmap
