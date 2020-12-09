import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import log from 'loglevel';
import moment from 'moment';
import WebRTCAdaptor from '../../utils/streaming';
import { cameraIcon, muteIcon, resizeIcon, uncallIcon } from '../../assets/icons/call';
import styles from './styles.module.css';

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

const StreamPublisherComponent = ({ currentCallId, currentCall, setOpen, webSocketUrl }) => {
  const videoActiveByDefault = currentCall.videoActive;
  const webRTCAdapter = useRef();
  const startDate = Date.now();
  const [isInFullScreen, setIsInFullScreen] = useState(false);
  const [videoStatus, setVideoStatus] = useState(videoActiveByDefault);
  const [micStatus, setMicStatus] = useState(true);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [duration, setDuration] = useState(null);

  const startStreaming = () => {
    try {
      webRTCAdapter.current.publish(currentCallId);
      if (!videoActiveByDefault) {
        webRTCAdapter.current.turnOffLocalCamera();
      }
    } catch (e) {
      log.error(` startStreaming error ${e}`);
    }
  };

  const stopStreaming = () => {
    try {
      webRTCAdapter.current.stop(currentCallId);
      webRTCAdapter.current.closeStream(currentCallId);
      setOpen(false);
    } catch (e) {
      log.error(` stopStreaming error ${e}`);
    }
    setIsBroadcasting(false);
  };

  const toggle = (type) => {
    try {
      if (type === 'video') {
        setVideoStatus(!videoStatus);
      } else {
        setMicStatus(!micStatus);
      }
    } catch (e) {
      log.error(` toggle device error ${e}`);
    }
  };

  useEffect(() => {
    if (webRTCAdapter.current) {
      if (videoStatus) {
        webRTCAdapter.current.turnOnLocalCamera();
      } else {
        webRTCAdapter.current.turnOffLocalCamera();
      }
    }
  }, [videoStatus]);

  useEffect(() => {
    if (webRTCAdapter.current) {
      if (micStatus) {
        webRTCAdapter.current.unmuteLocalMic();
      } else {
        webRTCAdapter.current.muteLocalMic();
      }
    }
  }, [micStatus]);

  useEffect(() => {
    webRTCAdapter.current = WebRTCAdaptor('local', startStreaming, setIsBroadcasting, webSocketUrl);
    const interval = setInterval(() => {
      const now = moment(Date.now());
      const start = moment(startDate);
      const diff = now.diff(start, 'seconds');
      const formatted = moment.utc(diff * 1000).format('mm:ss');
      setDuration(formatted);
    }, 1000);
    return () => {
      stopStreaming();
      clearInterval(interval);
    };
    // eslint-disable-next-line
  }, []);

  return (
    <div className={styles.wrapper} id="video-call">
      <div className={styles.header}>
        <span className={styles.duration}>{duration}</span>
        <span className={styles.name}>You</span>
        <div
          onClick={() => {
            setIsInFullScreen(!isInFullScreen);
            handleFullScreen();
          }}
          className={styles.fullScreen}
        >
          <img alt="resize" src={resizeIcon} />
        </div>
      </div>
      <div className={styles.main}>
        <video
          id="local"
          autoPlay
          muted
          playsInline
          className={styles.peerVideo}
          style={{
            height: !isInFullScreen ? '520px' : '100%',
            width: !isInFullScreen ? '800px' : '100%',
            display: !isBroadcasting ? 'none' : 'block',
          }}
        />
        <video
          autoPlay
          muted
          playsInline
          className={styles.peerVideo}
          style={{
            height: !isInFullScreen ? '520px' : '100%',
            width: !isInFullScreen ? '800px' : '100%',
            display: isBroadcasting ? 'none' : 'block',
          }}
        />
      </div>
      <div className={styles.footer}>
        <Control
          action={() => {
            toggle('video');
          }}
          name={videoStatus ? 'Stop camera' : 'Start camera'}
          icon={cameraIcon}
        />
        <div className={styles.stopCallWrapper} onClick={() => stopStreaming()}>
          <img alt="stop call" src={uncallIcon} className={styles.stopCallButton} />
        </div>
        <Control
          action={() => {
            toggle('audio');
          }}
          name={micStatus ? 'Mute' : 'Unmute'}
          icon={muteIcon}
        />
      </div>
    </div>
  );
};

StreamPublisherComponent.propTypes = {
  currentCallId: PropTypes.string.isRequired,
  currentCall: PropTypes.object.isRequired,
  setOpen: PropTypes.func.isRequired,
};

const Control = ({ action, name, icon }) => (
  <div className={styles.controlWrapper} onClick={action}>
    <img alt="control" src={icon} className={styles.controlIcon} />
    <span className={styles.controlName}>{name}</span>
  </div>
);

Control.propTypes = {
  action: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  icon: PropTypes.object.isRequired,
};

export default StreamPublisherComponent;
