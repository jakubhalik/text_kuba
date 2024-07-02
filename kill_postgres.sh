#!/bin/bash
sudo systemctl stop postgresql
sudo systemctl disable postgresql
sudo pacman -Rns postgresql
sudo rm -rf /var/lib/postgres
sudo rm -rf /etc/postgresql
sudo userdel -r postgres
sudo find / -name '*postgresql*' -exec rm -rf {} \;
sudo pacman -Rns $(pacman -Qtdq)
