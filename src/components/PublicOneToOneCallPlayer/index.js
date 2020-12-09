import React, { useEffect, useRef, useState } from 'react';
import { isFunction } from '../../utils';
import PropTypes from 'prop-types';
import socketMessageTypes from '../../enums/socketMessageTypes';
import {
  setCall,
  getCall,
  removeCall,
  setGuestToken,
  getGuestToken,
  removeGuestToken
} from '../../services/callMemorizer';
import PeerConnection from '../../services/webRtc/PeerConnection';
import CallTemplate from './CallTemplate';
import socketService from '../../services/socket';

const userIsGuest = true;
let socket = null;
let pc = {};

const PublicOneToOneCallPlayer = ({ callId, turnServerCredentials, apiUri }) => {
  const [isSocketLoaded, setSocketLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const componentIsMounted = useRef(true);
  const [localSrc, setLocalSrc] = useState(null);
  const [peerSrc, setPeerSrc] = useState(null);

  const startCall = async (isCaller, videoActiveByDefault) => {
    const pcInstance = new PeerConnection(
      turnServerCredentials.username,
      turnServerCredentials.credential,
      videoActiveByDefault
    )
      .on('localStream', (src) => {
        if (componentIsMounted.current) {
          setLocalSrc(src);
        }
      })
      .on('peerStream', (src) => {
        if (componentIsMounted.current) {
          setPeerSrc(src);
        }
      })
      .on('iceCandidate', ({ candidate }) => {
        const targetCall = getCall();
        socket.emit('scheduled-one-to-one-call', {
          type: socketMessageTypes.candidate,
          data: {
            agentId: targetCall.agentId,
            callId: targetCall.callId,
            candidate,
            isGuest: userIsGuest,
          },
        });
      })
      .on('startCall', () => {
        const targetCall = getCall();
        socket.emit('scheduled-one-to-one-call', {
          type: socketMessageTypes.requestCall,
          data: {
            agentSocketId: socket.id,
            callId: targetCall.callId,
          },
        });
      })
      .on('stopCall', () => {
        const targetCall = getCall();
        // check target call
        if (targetCall)
          socket.emit('scheduled-one-to-one-call', {
            type: socketMessageTypes.stop,
            data: {
              agentId: targetCall.agentId,
              callId: targetCall.callId,
              isGuest: userIsGuest,
            },
          });
      })
      .on('offerCreated', ({ offer }) => {
        const targetCall = getCall();
        socket.emit('scheduled-one-to-one-call', {
          type: socketMessageTypes.offer,
          data: {
            agentId: targetCall.agentId,
            callId: targetCall.callId,
            offer,
            isGuest: userIsGuest,
          },
        });
      })
      .on('answerCreated', ({ answer }) => {
        const targetCall = getCall();
        socket.emit('scheduled-one-to-one-call', {
          type: socketMessageTypes.answer,
          data: {
            agentId: targetCall.agentId,
            callId: targetCall.callId,
            answer,
            isGuest: userIsGuest,
          },
        });
      })
      .on('peerDisconnected', () => {});

    pc = pcInstance;
    await pc.start(isCaller, videoActiveByDefault);
  };

  const stopCallHard = () => {
    if (isFunction(pc.stop)) {
      pc.stop(false);
    }
    pc = {};
    removeCall();
  };

  const endCall = (isInitiator) => {
    if (isFunction(pc.stop)) {
      pc.stop(isInitiator);
    }
    pc = {};
    setLocalSrc(null);
    setPeerSrc(null);
    removeGuestToken();
    removeCall();
  };

  useEffect(() => {
    socket = socketService.handleOpenSocket(apiUri);
    socket.on('connect', () => {
      setSocketLoaded(true);
    });
  }, []);

  useEffect(() => {
    // guest logic to start or restore call
    if (userIsGuest && isSocketLoaded) {
      const activeCall = getCall();
      if (activeCall) {
        socket.emit('scheduled-one-to-one-call', {
          type: socketMessageTypes.restoreCall,
          data: {
            callId: activeCall.callId,
            guestSocketId: socket.id,
          },
        });
      } else {
        const guestToken = getGuestToken();
        if (guestToken) {
          socket.emit('scheduled-one-to-one-call', {
            type: socketMessageTypes.updateGuestSocket,
            data: {
              oldSocketId: guestToken.guestSocketId,
              newSocketId: socket.id,
              callId,
            },
          });
        } else {
          setGuestToken(socket.id);
          socket.emit('scheduled-one-to-one-call', {
            type: socketMessageTypes.requestAgent,
            data: { callId },
          });
        }
      }
    }
    // eslint-disable-next-line
  }, [isSocketLoaded]);

  useEffect(() => {
    // guest socket subscriptions
    if (userIsGuest && isSocketLoaded) {
      socket.on(
        'scheduled-one-to-one-call',
        async ({ type, data, error: socketErrorMessage }) => {
          switch (type) {
            case socketMessageTypes.agentUnavailable: {
              stopCallHard();
              setErrorMessage(socketErrorMessage);
              break;
            }
            case socketMessageTypes.requestCall: {
              const asyncStartCall = async (isCaller) => {
                // eslint-disable-next-line no-use-before-define
                await startCall(isCaller, data.videoActiveByDefault);
              };
              stopCallHard();
              setCall(data);
              asyncStartCall(false);
              break;
            }
            case socketMessageTypes.offer: {
              if (isFunction(pc.handleOffer)) await pc.handleOffer({ offer: data.offer });
              break;
            }
            case socketMessageTypes.answer: {
              if (isFunction(pc.handleAnswer))
                await pc.handleAnswer({ answer: data.answer });
              break;
            }
            case socketMessageTypes.candidate: {
              if (isFunction(pc.addIceCandidate))
                pc.addIceCandidate({ candidate: data.candidate });
              break;
            }
            case socketMessageTypes.stop: {
              endCall(false);
              break;
            }
            case socketMessageTypes.error: {
              stopCallHard();
              setErrorMessage(socketErrorMessage);
              break;
            }
            default:
              return false;
          }
          return true;
        }
      );
    }
    // eslint-disable-next-line
  }, [isSocketLoaded]);

  useEffect(() => {
    return () => {
      endCall(true);
      socket.off('scheduled-one-to-one-call');
    };
  }, []);

  const callTemplateProps = {
    localSrc,
    peerSrc,
    stopCall: () => {
      endCall(true);
    },
    toggle: (type) => {
      if (isFunction(pc.toggleInputs)) pc.toggleInputs(type);
    },
    error: errorMessage,
  };

  if (isSocketLoaded) return <CallTemplate {...callTemplateProps} />;
  return <div>Conecting socket...</div>;
};

PublicOneToOneCallPlayer.propTypes = {
  turnServerCredentials: PropTypes.object.isRequired,
  callId: PropTypes.string.isRequired,
  apiUri: PropTypes.string.isRequired,
};

PublicOneToOneCallPlayer.defaultProps = {
  turnServerCredentials: { username: '', credential: '' },
  callId: '',
  apiUri: '',
};

export default PublicOneToOneCallPlayer;
