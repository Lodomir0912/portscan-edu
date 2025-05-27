FROM kalilinux/kali-rolling

RUN apt update && apt install -y \
    nmap net-tools openssh-server vsftpd metasploit-framework hydra ftp telnet python3 python3-pip curl vim sudo snort apache2 postfix telnetd samba bind9

# Włącz SSH daemon
RUN echo 'root:rootpassword' | chpasswd

EXPOSE 22
CMD ["/usr/sbin/sshd", "-D"]