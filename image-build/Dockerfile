FROM --platform=linux/386 docker.io/i386/alpine:3.17

RUN echo '@testing https://dl-cdn.alpinelinux.org/alpine/edge/testing' >> /etc/apk/repositories \
 && echo 'nameserver 8.8.8.8' > /etc/resolv.conf \
 && apk update \
 && apk add alpine-base udev-init-scripts udev-init-scripts-openrc eudev \
      xorg-server xf86-input-libinput lightdm i3wm font-dejavu xrandr xev bash \
      mesa-dri-gallium \
      vim nano xterm thunar pcmanfm feh polybar

RUN rc-update add bootmisc boot \
 && rc-update add udev sysinit \
 && rc-update add udev-trigger sysinit \
 && rc-update add udev-settle sysinit \
 && rc-update add udev-postmount default \
 && rc-update add dbus default \
 && rc-update add lightdm default

RUN adduser -D -s /bin/bash user \
 && echo 'user:password' | chpasswd \
 && echo 'root:password' | chpasswd \
 && sed -i 's/#autologin-user=/autologin-user=user/' /etc/lightdm/lightdm.conf \
 && sed -i 's/#autologin-user-timeout=0/autologin-user-timeout=0/' /etc/lightdm/lightdm.conf \
 && sed -i 's/#autologin-session=/autologin-session=i3/' /etc/lightdm/lightdm.conf

COPY config /home/user/.config
COPY xsession /home/user/.xsession
RUN chown -R user:user /home/user

CMD ["/bin/sh"]
