from flask import Flask, request, jsonify
import xml.etree.ElementTree as ET
import subprocess
import os
import time
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from models import db, User, ScanFile

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['JWT_SECRET_KEY'] = 'super-secret'  # Zmień na bezpieczny klucz w produkcji
CORS(app)

db.init_app(app)
jwt = JWTManager(app)

ATTACKER_NAME = "linux_machine_1"
DEFENDER_NAME = "linux_machine_2"
    
def run_docker_command_attacker(command, timeout=60):
    """Uruchamia polecenie w kontenerze przez docker exec, zwraca stdout lub błąd."""
    try:
        cmd = ["docker", "exec", "--privileged", ATTACKER_NAME, "bash", "-c", command]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        if result.returncode == 0:
            return result.stdout
        else:
            return f"ERROR: {result.stderr.strip()}"
    except subprocess.TimeoutExpired:
        return "ERROR: Command timed out"   
    
def run_docker_command_defender(command, timeout=60):
    """Uruchamia polecenie w kontenerze przez docker exec, zwraca stdout lub błąd."""
    try:
        cmd = ["docker", "exec", "--privileged", DEFENDER_NAME, "bash", "-c", command]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        if result.returncode == 0:
            return result.stdout
        else:
            return f"ERROR: {result.stderr.strip()}"
    except subprocess.TimeoutExpired:
        return "ERROR: Command timed out"

# ---------------- LOGIN ENDPOINT ----------------
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    user = User.query.filter_by(username=email).first()
    if user and user.password == password:
        token = create_access_token(identity=user.id)
        return jsonify(access_token=token), 200
    return jsonify(message='Invalid credentials'), 401

# ---------------- REGISTER ENDPOINT ----------------
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify(message='Email and password are required'), 400

    if User.query.filter_by(username=email).first():
        return jsonify(message='User already exists'), 400

    new_user = User(username=email, password=password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify(message='User registered successfully'), 201

# ---------------- SERVICES ----------------
@app.route("/api/services", methods=["POST"])
def set_services():
    data = request.get_json()
    services = data.get("services", [])

    try:
        service_map = {
        "ssh": "ssh",
        "ftp": "vsftpd",
        "http": "apache2",
        "smtp": "postfix",
        "telnet": "inetd",
        "https": "apache2",
        "smb": "smbd",
        "dns": "bind9"
        }
        for service in services:
            name = service["name"].lower()
            enabled = service["enabled"]

            # zamiana na właściwą nazwę serwisu
            service_name = service_map.get(name)
            if not service_name:
                return jsonify(message=f"Unknown service: {name}"), 400

            cmd = f"service {service_name} {'start' if enabled else 'stop'} || true"
            out = run_docker_command_defender(cmd)
            if out.startswith("ERROR"):
                return jsonify(message=f"Error updating service {service_name}: {out}"), 500

        return jsonify(message="Services updated"), 200
    except Exception as e:
        return jsonify(message=f"Error updating services: {str(e)}"), 500

# ---------------- SNORT ----------------
@app.route("/api/snort", methods=["POST"])
def set_snort():
    data = request.get_json()
    enable = data.get("enable", False)
    try:
        if enable:
            cmd = "nohup snort -i eth0 -c /etc/snort/snort.conf > /tmp/snort.log 2>&1 &"
        else:
            cmd = "pkill snort || true"
        out = run_docker_command_defender(cmd)
        if out.startswith("ERROR"):
            return jsonify(message=out), 500
        return jsonify(message=f"Snort {'started' if enable else 'stopped'}"), 200
    except Exception as e:
        return jsonify(message=f"Error toggling snort: {str(e)}"), 500

# ---------------- NMAP ----------------
@app.route("/api/check", methods=["POST"])
def run_nmap():
    action = request.form.get("action")
    if action not in ['nmap_scan_1', 'nmap_scan_2', 'nmap_scan_3']:
        return jsonify(message="Invalid scan action"), 400

    scan_type_map = {
        'nmap_scan_1': '-sT',
        'nmap_scan_2': '-sS',
        'nmap_scan_3': '-sU',
    }
    nmap_flag = scan_type_map[action]

    target_ip = "172.19.0.2"  # IP celu skanu w kontenerze lub sieci Docker

    cmd = f"nmap {nmap_flag} {target_ip} -p-1000 -O -oX -"
    xml_output = run_docker_command_attacker(cmd)
    if xml_output.startswith("ERROR"):
        return jsonify(message=xml_output), 500

    try:
        root = ET.fromstring(xml_output)
        result_lines = []
        host = root.find('host')
        if host is not None:
            addr = host.find('address')
            if addr is not None:
                result_lines.append(f"Target: {addr.attrib['addr']}")
            for port in host.findall(".//port"):
                port_id = port.attrib['portid']
                proto = port.attrib['protocol']
                state = port.find('state').attrib['state']
                service = port.find('service')
                if service is not None:
                    name = service.attrib.get('name', '')
                    product = service.attrib.get('product', '')
                    version = service.attrib.get('version', '')
                    line = f"{port_id}/{proto} {state} {name} {product} {version}".strip()
                else:
                    line = f"{port_id}/{proto} {state}"
                result_lines.append(line)
            osmatch = host.find('.//osmatch')
            if osmatch is not None:
                result_lines.append(f"OS Detection: {osmatch.attrib['name']}")
        else:
            result_lines.append("No host information found.")
        return "\n".join(result_lines)
    except Exception as e:
        return jsonify(message=f"Error parsing nmap output: {str(e)}"), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
