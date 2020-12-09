import React, { useState, useEffect } from 'react';
import PopUp from './components/PopUp';
import StreamPublisher from './components/StreamPublisher';
import { useMediaQuery } from './hooks';
import { roles, callTypes } from './enums';
import StreamViewer from './components/StreamViewer';
import PublicPlayer from './components/PublicOneToOneCallPlayer';

export const ExampleComponent = ({
  isOpened,
  setOpen,
  currentCallId,
  url,
  role,
  callType,
  turnServerCredentials,
  apiUri,
}) => {
  const [isMobile, setIsMobile] = useState(document.documentElement.clientWidth <= 768);

  const handleResize = () => {
    const { clientWidth } = document.documentElement;
    setIsMobile(clientWidth <= 768);
  };

  useEffect(() => {
    window.addEventListener('resize', handleResize);
  }, []);

  const modalContainerStylesLarge = {
    container: (isLandscape) => ({
      marginTop: isLandscape ? '0' : '70px',
    }),
  };

  const isLandscapeMobileLarge = useMediaQuery(
    `(max-device-width: 812px) and (orientation: landscape)`
  );

  const scheduleCallContentPopUpProps = {
    isOpened,
    setOpen,
    modalContainerStyles: {
      width: 'auto',
      marginTop: isMobile ? 70 : 0,
      ...modalContainerStylesLarge.container(isLandscapeMobileLarge),
    },
    formContentStyles: { padding: 0 },
  };

  const scheduleCallContentProps = {
    currentCallId,
    isOpened,
    setOpen,
    currentCall: {
      videoActive: true,
    },
    webSocketUrl: `wss://${url}/WebRTCApp/websocket`,
  };

  const oneToOneCallContentProps = {
    callId: currentCallId,
    turnServerCredentials,
    apiUri,
  };

  const streamUrl = `https://${url}/WebRTCApp/streams/${currentCallId}.m3u8`;

  return (
    <div>
      {isOpened && (
        <PopUp {...scheduleCallContentPopUpProps}>
          {callType === callTypes.oneToOne ? (
            <PublicPlayer {...oneToOneCallContentProps} />
          ) : (
            <React.Fragment>
              {role === roles.streamer ? (
                <StreamPublisher {...scheduleCallContentProps} />
              ) : (
                <StreamViewer streamUrl={streamUrl} />
              )}
            </React.Fragment>
          )}
        </PopUp>
      )}
    </div>
  );
};
