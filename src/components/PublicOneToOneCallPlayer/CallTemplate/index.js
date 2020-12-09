import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import styles from './styles.module.css';

const checkTrack = (stream, type) => {
  let enabled = false;
  if (stream) {
    if (type === 'audio') {
      stream.getAudioTracks().forEach((track) => {
        enabled = track.enabled;
      });
    }
    if (type === 'video') {
      stream.getVideoTracks().forEach((track) => {
        enabled = track.enabled;
      });
    }
  }
  return enabled;
};

const handleFullScreen = () => {
  const isInFullScreen =
    (document.fullscreenElement && document.fullscreenElement !== null) ||
    (document.webkitFullscreenElement && document.webkitFullscreenElement !== null) ||
    (document.mozFullScreenElement && document.mozFullScreenElement !== null) ||
    (document.msFullscreenElement && document.msFullscreenElement !== null);
  const docElm = document.getElementById('video-call');
  if (!isInFullScreen) {
    if (docElm.requestFullscreen) {
      docElm.requestFullscreen();
    } else if (docElm.mozRequestFullScreen) {
      docElm.mozRequestFullScreen();
    } else if (docElm.webkitRequestFullScreen) {
      docElm.webkitRequestFullScreen();
    } else if (docElm.msRequestFullscreen) {
      docElm.msRequestFullscreen();
    }
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
};

const CallTemplate = ({ localSrc, peerSrc, stopCall, toggle, error }) => {
  const peerVideo = useRef(null);
  const localVideo = useRef(null);
  const [isInFullScreen, setIsInFullScreen] = useState(false);

  useEffect(() => {
    if (peerVideo.current) {
      peerVideo.current.srcObject = peerSrc;
      peerVideo.current.muted = false;
    }
  }, [peerSrc]);

  useEffect(() => {
    if (localVideo.current) {
      localVideo.current.srcObject = localSrc;
    }
  }, [localSrc]);
  return (
    <div className={styles.wrapper} id="video-call">
      {error ? (
        <h3>{error}</h3>
      ) : (
        <div>
          <div className={styles.header}>
            <span className={styles.duration}>duration</span>
            <span className={styles.name}>name</span>
            <div
              onClick={() => {
                setIsInFullScreen(!isInFullScreen);
                handleFullScreen();
              }}
              className={styles.fullScreen}
            >
              resize
            </div>
          </div>
          <div className={styles.main}>
            <video
              id="local"
              autoPlay
              muted
              playsInline
              ref={localVideo}
              className={styles.localVideo}
            />
            <video
              id="remote"
              autoPlay
              muted
              playsInline
              ref={peerVideo}
              className={styles.peerVideo}
              style={{
                height: !isInFullScreen ? '520px' : '100%',
                width: !isInFullScreen ? '800px' : '100%',
              }}
            />
          </div>
          <div className={styles.footer}>
            <Control
              action={() => {
                toggle('video');
              }}
              name={checkTrack(localSrc, 'video') ? 'Stop camera' : 'Start camera'}
            />
            <div className={styles.stopCallWrapper} onClick={stopCall}>
              S
            </div>
            <Control
              action={() => {
                toggle('audio');
              }}
              name={checkTrack(localSrc, 'audio') ? 'Mute' : 'Unmute'}
            />
          </div>
        </div>
      )}
    </div>
  );
};

CallTemplate.propTypes = {
  localSrc: PropTypes.object,
  peerSrc: PropTypes.object,
  stopCall: PropTypes.func.isRequired,
  toggle: PropTypes.func.isRequired,
  error: PropTypes.string.isRequired,
};

CallTemplate.defaultProps = { localSrc: null, peerSrc: null };

export default CallTemplate;

const Control = ({ action, name, icon }) => (
  <div className={styles.controlWrapper} onClick={action}>
    <span className={styles.controlName}>{name}</span>
  </div>
);
Control.propTypes = {
  action: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
};
