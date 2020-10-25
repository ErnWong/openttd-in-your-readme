FROM bateau/openttd:latest

USER root

RUN apt-get update && apt-get install -y \
  tigervnc-standalone-server \
&& rm -rf /var/lib/apt/lists/*

EXPOSE 5901/tcp

RUN mkdir /.vnc && chown openttd /.vnc
VOLUME /.vnc

USER openttd
CMD \
  ln \
    --symbolic \
    --force \
    --no-target-directory \
    /.vnc /home/openttd/.vnc \
  && vncserver \
    -geometry 640x480 \
    -SecurityTypes None \
    -fg \
    -localhost no \
    --I-KNOW-THIS-IS-INSECURE
