FROM kalilinux/kali-rolling

RUN apt update && apt install -y \
    nmap net-tools openssh-server vsftpd ftp \
    mariadb-server python3 python3-pip curl vim sudo snort apache2 \
    postfix rpcbind bind9 iptables iproute2 \
    snort-rules-default

RUN mkdir -p /etc/snort/rules \
    && mkdir -p /var/log/snort \
    && touch /etc/snort/rules/local.rules \
    && chmod -R 755 /var/log/snort

# Skopiuj przykładowy plik konfiguracyjny snort.conf - sprawdź lokalizację na swoim obrazie
RUN cp /usr/share/doc/snort/snort.conf.example /etc/snort/snort.conf || \
    echo -e 'include /etc/snort/rules/local.rules\nipvar HOME_NET 172.19.0.2\nipvar EXTERNAL_NET any\nconfig daq: nfq\nconfig daq_mode: inline' > /etc/snort/snort.conf

# Teraz wykonaj sed na /etc/snort/snort.conf (jeśli jest potrzeba, lub pomiń jeśli stworzyłeś ręcznie)
RUN sed -i 's/include \$RULE_PATH\/local.rules/include \/etc\/snort\/rules\/local.rules/' /etc/snort/snort.conf && \
    sed -i 's/ipvar HOME_NET any/ipvar HOME_NET 172.19.0.2/' /etc/snort/snort.conf && \
    sed -i 's/ipvar EXTERNAL_NET any/ipvar EXTERNAL_NET any/' /etc/snort/snort.conf && \
    sed -i 's/# config daq: nfq/config daq: nfq/' /etc/snort/snort.conf && \
    sed -i 's/# config daq_mode: inline/config daq_mode: inline/' /etc/snort/snort.conf || true

RUN echo 'alert tcp any any -> $HOME_NET any (msg:"SYN Port Scan Detected"; flags:S; threshold:type threshold, track by_src, count 20, seconds 3; sid:1000001; rev:1;)' >> /etc/snort/rules/local.rules

RUN echo '#!/bin/bash\n\
iptables -F\n\
iptables -A INPUT -j NFQUEUE --queue-num 0\n\
iptables -A OUTPUT -j NFQUEUE --queue-num 0\n\
snort -Q --daq nfq --daq-var queue=0 -c /etc/snort/snort.conf -i eth0' > /start-snort-ips.sh && \
    chmod +x /start-snort-ips.sh
