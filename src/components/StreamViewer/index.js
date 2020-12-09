import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import ReactPlayer from 'react-player';
import { resizeIcon } from '../../assets/icons/call';
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

const CallTemplate = ({ streamUrl }) => {
  const [isInFullScreen, setIsInFullScreen] = useState(false);
  const [url, setUrl] = useState('');
  const player = useRef();

  const tryToPlayHls = (hlsNoStreamCallback) => {
    fetch(streamUrl, {
      method: 'HEAD',
    }).then((response) => {
      if (response.status === 200) {
        setUrl(streamUrl);
      } else {
        console.log('No stream');
        hlsNoStreamCallback();
      }
    });
  };

  const hlsNoStreamCallback = () => {
    setTimeout(() => {
      tryToPlayHls(hlsNoStreamCallback);
    }, 3000);
  };

  useEffect(() => {
    tryToPlayHls(hlsNoStreamCallback);
    // eslint-disable-next-line
  }, []);

  return (
    <div className={styles.wrapper} id="video-call">
      <div className={styles.header}>
        <span className={styles.duration} />
        <span className={styles.name}>
          {/* {agentInfo ? `${agentInfo.firstName} ${agentInfo.lastName}` : ''} */}
        </span>
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
        {url ? (
          <ReactPlayer
            ref={player}
            url={url}
            muted
            playing
            controls
            width={960}
            height="100%"
            style={{ background: 'black' }}
            config={{
              file: {
                hlsOptions: {
                  maxMaxBufferLength: 5,
                  liveSyncDuration: 2,
                  liveMaxLatencyDuration: 3,
                  liveBackBufferLength: 2,
                  nudgeMaxRetry: 10,
                },
              },
            }}
          />
        ) : (
          <div className={styles.noStream}>
            <span className={styles.noStreamTitle}>
              Stream will start playing automatically when it is live
            </span>
          </div>
        )}
      </div>
      <div className={styles.footer} />
    </div>
  );
};

CallTemplate.propTypes = {
  match: PropTypes.object.isRequired,
};

export default CallTemplate;
