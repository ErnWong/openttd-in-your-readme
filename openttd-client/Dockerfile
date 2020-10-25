FROM bateau/openttd:latest AS build

USER root

RUN apt-get update && apt-get install -y \
  tigervnc-standalone-server \
&& rm -rf /var/lib/apt/lists/*

FROM ubuntu:latest

EXPOSE 5901/tcp

COPY --from=build / /
COPY ./.vnc /home/openttd/.vnc
COPY ./.openttd /home/openttd/.openttd
RUN chown openttd /home/openttd/.vnc
RUN chown openttd /home/openttd/.openttd

USER openttd
CMD vncserver \
  -geometry 640x480 \
  -SecurityTypes None \
  -fg \
  -localhost no \
  --I-KNOW-THIS-IS-INSECURE
