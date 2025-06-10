# PORTSCAN-EDU

**PORTSCAN-EDU** is an educational web application for learning about network security, port scanning techniques, and intrusion detection. It simulates a realistic environment using Docker containers and integrates tools like **Nmap** and **Snort** to detect or block malicious scanning activity.

---

## Features

- Enable/disable specific services (e.g., SSH, HTTP, FTP, etc.)
- Choose the type of Nmap scan (SYN, TCP, UDP, aggressive, etc.)
- Launch Snort in:
  - **IDS mode (Intrusion Detection System)** – detect and report scans
  - **IPS mode (Intrusion Prevention System)** – actively block scans
- Intuitive React-based web interface
- Export Nmap scan results as XML

---

### Requirements

- Docker
- Docker Compose

### Setup & Run

```
git clone https://github.com/Lodomir0912/portscan_edu.git
cd portscan_edu/PORTSCAN-EDU
docker-compose up --build
```

Lastly, visit http://localhost:8080.
