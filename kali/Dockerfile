FROM kalilinux/kali-rolling

RUN apt update && apt install -y \
    nmap net-tools openssh-server vsftpd ftp \
    mariadb-server python3 python3-pip curl vim sudo snort apache2 \
    postfix rpcbind bind9 iptables iproute2

RUN rm /etc/snort/snort.lua

# Dodanie reguł do lokalnego pliku
RUN echo 'alert tcp any any -> $HOME_NET any (msg:"TCP Port Scan Detected"; detection_filter: track by_src, count 3, seconds 10; sid:1000001; rev:1;)' >> /etc/snort/rules/local.rules && \
    echo 'alert tcp any any -> $HOME_NET any (msg:"Stealth Scan Detected"; flags:S; detection_filter: track by_src, count 5, seconds 3; sid:1000002; rev:1;)' >> /etc/snort/rules/local.rules && \
    echo 'alert udp any any -> $HOME_NET any (msg:"UDP Port Scan Detected"; detection_filter: track by_src, count 5, seconds 5; sid:1000003; rev:1;)' >> /etc/snort/rules/local.rules && \
    echo 'alert tcp any any -> $HOME_NET any (msg:"NULL Scan Detected"; flags:0; detection_filter: track by_src, count 3, seconds 10; sid:1000004; rev:1;)' >> /etc/snort/rules/local.rules && \
    echo 'alert tcp any any -> $HOME_NET any (msg:"FIN Scan Detected"; flags:F; detection_filter: track by_src, count 3, seconds 10; sid:1000005; rev:1;)' >> /etc/snort/rules/local.rules && \
    echo 'alert tcp any any -> $HOME_NET any (msg:"XMAS Scan Detected"; flags:FPU; detection_filter: track by_src, count 3, seconds 10; sid:1000006; rev:1;)' >> /etc/snort/rules/local.rules

# Dostosowanie konfiguracji snort.lua do IDS
RUN cat << 'EOF' > /etc/snort/snort.lua
HOME_NET = '172.0.0.0/8'
EXTERNAL_NET = 'any'

include 'snort_defaults.lua'

ips = {
    variables = default_variables,
    include = '/etc/snort/rules/local.rules'
}

alert_fast = {
    file = true,
    limit = 0,
}
EOF

# Skrypt startowy w trybie IDS
RUN echo '#!/bin/bash\n\
ip link set eth0 promisc on\n\
snort -c /etc/snort/snort.lua -i eth0 -A fast' > /start-snort-ids.sh && \
    chmod +x /start-snort-ids.sh

CMD ["/bin/bash"]
