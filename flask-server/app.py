from flask import Flask, request, jsonify
import xml.etree.ElementTree as ET
import subprocess
import os
import time
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from models import db, User, ScanFile
from flask import send_file, abort, make_response
import io

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
        "rpc": "rpcbind",
        "smb": "smbd",
        "dns": "named"
        }
        for service in services:
            name = service["name"].lower()
            enabled = service["enabled"]

            # zamiana na właściwą nazwę serwisu
            service_name = service_map.get(name)
            if not service_name:
                return jsonify(message=f"Unknown service: {name}"), 400
            if enabled:
                cmd = f"service {service_name} start"
            else:
                cmd = f"pkill -f {service_name}"
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

    # # zapisanie pliku konfiguracyjnego snorta
    # user_id = get_jwt_identity()
    # filename = f"nmap_{int(time.time())}.xml"
    # scanfile = ScanFile(
    #     user_id=user_id,
    #     filename=filename,
    #     filetype="nmap",
    #     hashtag="#nmapscan",
    #     filedata=data.encode("utf-8")  # zamiana na bajty
    # )
    # db.session.add(scanfile)
    # db.session.commit()
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
@app.route("/api/scan", methods=["POST"])
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

    target_ip = "172.19.0.2"
    os_detection = request.form.get("osDetection", "false").lower() == "true"

    cmd = f"nmap {nmap_flag} {target_ip} -p-1500"
    if os_detection:
        cmd += " -O"
    cmd += " -oX -"
    xml_output = run_docker_command_attacker(cmd)

    # # zapisanie pliku konfiguracyjnego nmapa
    # user_id = get_jwt_identity()
    # filename = f"nmap_{int(time.time())}.xml"
    # scanfile = ScanFile(
    #     user_id=user_id,
    #     filename=filename,
    #     filetype="nmap",
    #     hashtag="#nmapscan",
    #     filedata=xml_output.encode("utf-8")  # zamiana na bajty
    # )
    # db.session.add(scanfile)
    # db.session.commit()
    if xml_output.startswith("ERROR"):
        return jsonify(message=xml_output), 500

    try:
        root = ET.fromstring(xml_output)
        result_lines = []
        host = root.find('host')
        if host is not None:
            addr = host.find('address')
            if addr is not None:
                result_lines.append(f"SCAN FINISHED\n\n== PORTS ==\n\nPORT\tSTATE\tSERVICE")
            for port in host.findall(".//port"):
                port_id = port.attrib['portid']
                proto = port.attrib['protocol']
                state = port.find('state').attrib['state']
                service = port.find('service')
                if service is not None:
                    name = service.attrib.get('name', '')
                    product = service.attrib.get('product', '')
                    version = service.attrib.get('version', '')
                    line = f"{port_id}/{proto}\t{state}\t{name} {product} {version}".strip()
                else:
                    line = f"{port_id}/{proto} {state}"
                result_lines.append(line)
            osmatch = host.find('.//osmatch')
            if osmatch is not None:
                result_lines.append(f"\n== OS VERSION ==\nOS Detection: {osmatch.attrib['name']}")
        else:
            result_lines.append("No host information found.")
        return jsonify(parsed="\n".join(result_lines), raw_xml=xml_output)
    except Exception as e:
        return jsonify(message=f"Error parsing nmap output: {str(e)}"), 500

# @app.route('/api/user/scans', methods=['GET'])
# @jwt_required()
# def get_user_scans():
#     user_id = get_jwt_identity()
#     scans = ScanFile.query.filter_by(user_id=user_id).order_by(ScanFile.created_at.desc()).all()
#     return jsonify({
#         "scans": [
#             {
#                 "id": scan.id,
#                 "filename": scan.filename,
#                 "filetype": scan.filetype,
#                 "hashtag": scan.hashtag,
#                 "created_at": scan.created_at.strftime("%Y-%m-%d %H:%M:%S") if scan.created_at else ""
#             }
#             for scan in scans
#         ]
#     })

# @app.route('/api/user', methods=['GET'])
# @jwt_required()
# def get_user_info(): 
#     user_id = get_jwt_identity()
#     user = User.query.filter_by(id=user_id).first()
#     return jsonify({
#         "username": user.username,
#         "password": user.password,
#     })

# @app.route('/api/download/<int:scanfile_id>', methods=['GET'])
# @jwt_required()
# def download_scanfile(scanfile_id):
#     user_id = get_jwt_identity()
#     scanfile = ScanFile.query.filter_by(id=scanfile_id, user_id=user_id).first()
#     if not scanfile:
#         return abort(404)
#     return send_file(
#         io.BytesIO(scanfile.filedata),
#         as_attachment=True,
#         download_name=scanfile.filename,
#         mimetype="application/octet-stream"
#     )

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
