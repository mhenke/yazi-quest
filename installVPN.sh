wget https://github.com/UNO-IST-Support/installPrismaVPNLinux-UNO/raw/main/GlobalProtect_UI_deb-5.2.6.0-18.deb
sudo apt-get install -y libqt5webkit5
sudo dpkg -i GlobalProtect_UI_deb-5.2.6.0-18.deb
echo "*******************************************************************"

echo -e "\e[1;32m If you would to disconnect/reconnect to vpn, use the following command in terminal: \e[0m"
echo -e " \e[1;33m globalprotect launch-ui \e[0m"
