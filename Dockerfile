# Copyright 2016, EMC, Inc.

FROM nodesource/wheezy:4.4.6

COPY . /RackHD/on-core/

RUN echo "deb http://ftp.us.debian.org/debian wheezy main"                  >  /etc/apt/sources.list \
 && echo "deb http://ftp.us.debian.org/debian wheezy-updates main"          >> /etc/apt/sources.list \
 && echo "deb http://security.debian.org wheezy/updates main"               >> /etc/apt/sources.list \
 && echo "deb http://ftp.us.debian.org/debian wheezy main non-free"         >> /etc/apt/sources.list \
 && echo "deb http://ftp.us.debian.org/debian wheezy-updates main non-free" >> /etc/apt/sources.list \
 && echo "deb http://security.debian.org wheezy/updates main non-free"      >> /etc/apt/sources.list

RUN cd /RackHD/on-core \
  && npm install --ignore-scripts --production

VOLUME /opt/monorail
