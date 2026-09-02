#!/usr/bin/env bash
set -euo pipefail

# Development-only builder. The browser never runs Docker or QEMU.
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="$ROOT_DIR/public/assets/images"
ALPINE_BRANCH="v3.20"
IMAGE_SIZE="512M"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required to build the image on macOS; it is not used in production." >&2
  exit 2
fi

mkdir -p "$OUTPUT_DIR"
docker run --rm --privileged --platform linux/386 \
  -e ALPINE_BRANCH="$ALPINE_BRANCH" -e IMAGE_SIZE="$IMAGE_SIZE" \
  -v "$OUTPUT_DIR:/output" alpine:3.20 sh -euxc '
    apk add --no-cache bash curl e2fsprogs-extra e2fsprogs dosfstools rsync sfdisk syslinux util-linux apk-tools-static qemu-img
    curl -fsSL https://raw.githubusercontent.com/alpinelinux/alpine-make-vm-image/v0.13.4/alpine-make-vm-image -o /tmp/alpine-make-vm-image
    chmod +x /tmp/alpine-make-vm-image
    cat >/tmp/xfce.sh <<"SCRIPT"
#!/bin/sh
set -eux
apk add --no-cache linux-virt xorg-server xf86-video-vesa xf86-input-evdev eudev dbus \
  xfce4 xfce4-terminal xfce4-screensaver thunar mousepad galculator ristretto \
  lightdm lightdm-gtk-greeter font-dejavu adwaita-icon-theme sudo apk-tools
adduser -D -s /bin/ash user
echo "user:browser-ubuntu" | chpasswd
addgroup user wheel
echo "%wheel ALL=(ALL) ALL" >/etc/sudoers.d/wheel
chmod 440 /etc/sudoers.d/wheel
rc-update add dbus default
rc-update add lightdm default
mkdir -p /etc/lightdm /etc/X11/xorg.conf.d
printf "%s\n" "[Seat:*]" "autologin-user=user" "autologin-user-timeout=0" "user-session=xfce" >/etc/lightdm/lightdm.conf
printf "%s\n" "Section \"Device\"" "  Identifier \"VGA\"" "  Driver \"vesa\"" "EndSection" >/etc/X11/xorg.conf.d/10-v86.conf
echo "exec startxfce4" >/home/user/.xinitrc
chown user:user /home/user/.xinitrc
rc-update add udev sysinit || true
SCRIPT
    chmod +x /tmp/xfce.sh
    /tmp/alpine-make-vm-image -a x86 -b "$ALPINE_BRANCH" -s "$IMAGE_SIZE" -k virt \
      -p "linux-virt" /output/alpine-xfce-v86.img /tmp/xfce.sh
    sha256sum /output/alpine-xfce-v86.img >/output/alpine-xfce-v86.img.sha256
  '

echo "Created $OUTPUT_DIR/alpine-xfce-v86.img"
