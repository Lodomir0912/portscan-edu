from flask import Flask, request, jsonify, render_template, send_from_directory
import paramiko
import xml.etree.ElementTree as ET
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

# ---------------- CONFIG LOADING ----------------
def load_config_attacker():
    with open(os.path.join(os.path.dirname(__file__), "config.txt")) as f:
        lines = f.read().splitlines()
        return {"ip": lines[0], "user": lines[1], "password": lines[2]}

def load_config_snort():
    with open(os.path.join(os.path.dirname(__file__), "config_snort.txt")) as f:
        lines = f.read().splitlines()
        return {"ip": lines[0], "user": lines[1], "password": lines[2]}

# ---------------- UTILS ----------------
def parse_nmap_xml(xml_output):
    root = ET.fromstring(xml_output)
    result = {"target": None, "ports": [], "os": None}
    host = root.find('host')
    if host is not None:
        addr = host.find('address')
        if addr is not None:
            result['target'] = addr.attrib['addr']
        for port in host.findall(".//port"):
            port_id = port.attrib['portid']
            proto = port.attrib['protocol']
            state = port.find('state').attrib['state']
            service = port.find('service')
            if service is not None:
                name = service.attrib.get('name', '')
                product = service.attrib.get('product', '')
                version = service.attrib.get('version', '')
                desc = f"{port_id}/{proto} {state} {name} {product} {version}".strip()
            else:
                desc = f"{port_id}/{proto} {state}"
            result['ports'].append(desc)
        osmatch = host.find('.//osmatch')
        if osmatch is not None:
            result['os'] = osmatch.attrib['name']
    return result

def filter_snort_log(log_text: str) -> list[str]:
    useful_keywords = [
        "Packet Statistics", "Module Statistics", "port_scan", "packets:", "trackers:",
        "flows:", "sessions:", "detected apps", "Application:", "tcp", "bad_tcp",
        "runtime:", "signals:", "Commencing packet processing", "++ [", "** caught term signal", "-- ["
    ]
    return [line.strip() for line in log_text.splitlines() if any(k in line for k in useful_keywords)]

# ---------------- ROOT REDIRECT ----------------
@app.route('/api')
def index():
    return "Backend is running!"

# ---------------- SCAN ENDPOINT (z JWT) ----------------
@app.route('/api/check', methods=['GET', 'POST'])
@jwt_required()
def check():
    nmap_result = None
    snort_result = None
    user_id = get_jwt_identity()  # Pobiera ID użytkownika z tokenu

    if request.method == 'POST':
        action = request.form['action']
        target_ip = load_config_snort()["ip"]

        if action.startswith('nmap_scan'):
            scan_type = {
                'nmap_scan_1': '-sT',
                'nmap_scan_2': '-sS',
                'nmap_scan_3': '-sU'
            }[action]
            cmd = f"nmap {scan_type} {target_ip} -p-1000 -O -oX -"
            try:
                attacker_cfg = load_config_attacker()
                ssh = paramiko.SSHClient()
                ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
                ssh.connect(attacker_cfg["ip"], username=attacker_cfg["user"], password=attacker_cfg["password"], timeout=10)
                stdin, stdout, stderr = ssh.exec_command(cmd)
                xml_output = stdout.read().decode()
                ssh.close()
                nmap_result = parse_nmap_xml(xml_output)

                filename = f"nmap_{int(time.time())}.xml"
                scans_dir = os.path.join(os.path.dirname(__file__), "scans")
                os.makedirs(scans_dir, exist_ok=True)
                filepath = os.path.join(scans_dir, filename)
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(xml_output)

                scanfile = ScanFile(user_id=user_id, filename=filename, filetype="nmap", hashtag="#nmapscan")
                db.session.add(scanfile)
                db.session.commit()
            except Exception as e:
                nmap_result = {"error": str(e)}

        elif action == 'snort_start':
            try:
                snort_cfg = load_config_snort()
                attacker_cfg = load_config_attacker()

                ssh_snort = paramiko.SSHClient()
                ssh_snort.set_missing_host_key_policy(paramiko.AutoAddPolicy())
                ssh_snort.connect(snort_cfg["ip"], username=snort_cfg["user"], password=snort_cfg["password"], timeout=10)

                log_path = "/tmp/snort_output.txt"
                snort_cmd = f"echo '{snort_cfg['password']}' | sudo -S /usr/sbin/snort -i eth1 -c /etc/snort/snort.lua > {log_path} 2>&1 &"
                ssh_snort.exec_command(snort_cmd)
                time.sleep(2)

                ssh_attacker = paramiko.SSHClient()
                ssh_attacker.set_missing_host_key_policy(paramiko.AutoAddPolicy())
                ssh_attacker.connect(attacker_cfg["ip"], username=attacker_cfg["user"], password=attacker_cfg["password"], timeout=10)
                nmap_cmd = f"nmap -sS {snort_cfg['ip']} -p-1000"
                ssh_attacker.exec_command(nmap_cmd)
                ssh_attacker.close()

                time.sleep(14)
                ssh_snort.exec_command(f"echo '{snort_cfg['password']}' | sudo -S pkill snort")
                time.sleep(1)

                sftp = ssh_snort.open_sftp()
                with sftp.open(log_path, 'r') as log_file:
                    raw_log = log_file.read().decode()

                log_filename = f"snort_{int(time.time())}.log"
                logs_dir = os.path.join(os.path.dirname(__file__), "scans")
                os.makedirs(logs_dir, exist_ok=True)
                log_filepath = os.path.join(logs_dir, log_filename)
                with open(log_filepath, "w", encoding="utf-8") as f:
                    f.write(raw_log)

                scanfile = ScanFile(user_id=user_id, filename=log_filename, filetype="snort", hashtag="#snortlog")
                db.session.add(scanfile)
                db.session.commit()
                sftp.remove(log_path)
                sftp.close()
                ssh_snort.close()

                snort_result = filter_snort_log(raw_log) or ["Brak wykrytych zdarzeń."]
            except Exception as e:
                snort_result = [f"Błąd połączenia: {e}"]

    return render_template("check.html", nmap_result=nmap_result, snort_result=snort_result)
    
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=5000, debug=True)
