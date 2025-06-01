from flask import Flask, request, jsonify, send_file, make_response
import xml.etree.ElementTree as ET
import subprocess
import time
import io
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from models import db, User, ScanFile

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['JWT_SECRET_KEY'] = 'super-secret'
CORS(app)

db.init_app(app)
jwt = JWTManager(app)

ATTACKER_NAME = "linux_machine_1"
DEFENDER_NAME = "linux_machine_2"

def run_docker_command(container_name, command, timeout=60):
    try:
        cmd = ["docker", "exec", "--privileged", container_name, "bash", "-c", command]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return result.stdout if result.returncode == 0 else f"ERROR: {result.stderr.strip()}"
    except subprocess.TimeoutExpired:
        return "ERROR: Command timed out"

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    user = User.query.filter_by(username=email).first()
    if user and user.password == password:
        token = create_access_token(identity=str(user.id))
        return jsonify(access_token=token), 200
    return jsonify(message='Invalid credentials'), 401

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

@app.route("/api/services", methods=["POST"])
def set_services():
    data = request.get_json()
    services = data.get("services", [])
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
        name = service.get("name", "").lower()
        enabled = service.get("enabled")
        service_name = service_map.get(name)
        if not service_name:
            return jsonify(message=f"Unknown service: {name}"), 400
        cmd = f"service {service_name} {'start' if enabled else 'stop'}"
        out = run_docker_command(DEFENDER_NAME, cmd)
        if out.startswith("ERROR"):
            return jsonify(message=f"Error updating service {service_name}: {out}"), 500
    return jsonify(message="Services updated"), 200

@app.route("/api/snort", methods=["POST"])
def set_snort():
    data = request.get_json()
    enable = data.get("enable", False)

    if enable:
        # Wyczyść stare reguły iptables
        run_docker_command(DEFENDER_NAME, "iptables -F")
        # Dodaj regułę przekierowującą do NFQUEUE
        run_docker_command(DEFENDER_NAME, "iptables -A INPUT -j NFQUEUE --queue-num 0")

        # Uruchom skrypt startowy Snorta IPS w tle i przekieruj logi
        cmd = "nohup /start-snort-ips.sh > /tmp/snort.log 2>&1 &"
    else:
        # Zatrzymaj Snorta i wyczyść reguły iptables
        run_docker_command(DEFENDER_NAME, "pkill snort || true")
        run_docker_command(DEFENDER_NAME, "iptables -F")
        cmd = "echo 'Snort stopped'"

    out = run_docker_command(DEFENDER_NAME, cmd)
    if out.startswith("ERROR"):
        return jsonify(message=out), 500
    return jsonify(message=f"Snort {'started with IPS script' if enable else 'stopped'}"), 200



@app.route("/api/scan", methods=["POST"])
def run_nmap():
    action = request.form.get("action")
    scan_type_map = {'nmap_scan_1': '-sT', 'nmap_scan_2': '-sS', 'nmap_scan_3': '-sU'}
    nmap_flag = scan_type_map.get(action)
    if not nmap_flag:
        return jsonify(message="Invalid scan action"), 400
    target_ip = "172.19.0.2"
    os_detection = request.form.get("osDetection", "false").lower() == "true"
    cmd = f"nmap {nmap_flag} {target_ip} -p-1500{' -O' if os_detection else ''} -oX -"
    xml_output = run_docker_command(ATTACKER_NAME, cmd)
    if xml_output.startswith("ERROR"):
        return jsonify(message=xml_output), 500
    try:
        root = ET.fromstring(xml_output)
        result_lines = []
        host = root.find('host')
        if host is not None:
            result_lines.append("SCAN FINISHED\n\n== PORTS ==\n\nPORT\tSTATE\tSERVICE")
            for port in host.findall(".//port"):
                port_id = port.attrib['portid']
                proto = port.attrib['protocol']
                state = port.find('state').attrib['state']
                service = port.find('service')
                service_info = f"{service.attrib.get('name', '')} {service.attrib.get('product', '')} {service.attrib.get('version', '')}".strip() if service is not None else ""
                line = f"{port_id}/{proto}\t{state}\t{service_info}".strip()
                result_lines.append(line)
            osmatch = host.find('.//osmatch')
            if osmatch is not None:
                result_lines.append(f"\n== OS VERSION ==\nOS Detection: {osmatch.attrib['name']}")
        else:
            result_lines.append("No host information found.")
        return jsonify(parsed="\n".join(result_lines), raw_xml=xml_output)
    except Exception as e:
        return jsonify(message=f"Error parsing nmap output: {str(e)}"), 500

@app.route('/api/user/scans', methods=['GET'])
@jwt_required()
def get_user_scans():
    user_id = get_jwt_identity()
    scans = ScanFile.query.filter_by(user_id=user_id).all()
    scan_list = [{
        'id': scan.id,
        'filename': scan.filename,
        'filetype': scan.filetype,
        'hashtag': scan.hashtag,
        'created_at': scan.created_at.strftime('%Y-%m-%d %H:%M:%S') if scan.created_at else 'Unknown'
    } for scan in scans]
    return jsonify(scans=scan_list), 200

@app.route('/api/download/<int:scan_id>', methods=['GET'])
@jwt_required()
def download_scan(scan_id):
    user_id = get_jwt_identity()
    scan = ScanFile.query.filter_by(id=scan_id, user_id=user_id).first()
    if not scan:
        return jsonify(message="Scan not found"), 404
    file_data = scan.filedata.encode('utf-8') if isinstance(scan.filedata, str) else scan.filedata
    file_stream = io.BytesIO(file_data)
    response = make_response(send_file(file_stream, download_name=scan.filename, as_attachment=True, mimetype='application/xml'))
    response.headers["Content-Disposition"] = f"attachment; filename={scan.filename}"
    return response

@app.route('/api/save_scan', methods=['POST'])
@jwt_required()
def save_scan():
    user_id = get_jwt_identity()
    data = request.get_json()
    xml_data = data.get('xml')
    filename = data.get('filename', f'scan_{int(time.time())}.xml')
    hashtag = data.get('hashtag', '')
    if not xml_data:
        return jsonify(message='Missing XML data'), 400
    scan = ScanFile(
        user_id=user_id,
        filename=filename,
        filetype='nmap',
        hashtag=hashtag,
        filedata=xml_data
    )
    db.session.add(scan)
    db.session.commit()
    return jsonify(message='Scan saved successfully'), 200

if __name__ == "__main__":
    with app.app_context():
        db.create_all()  # tworzy tabele jeśli ich nie ma
    app.run(host="0.0.0.0", port=5000, debug=True)
