import log from 'loglevel';
import { WebRTCAdaptor } from '../../scripts/webrtc_adaptor';

const pc_config = {
  iceServers: [
    {
      urls: 'stun:global.stun.twilio.com:3478?transport=udp',
    },
  ],
};

const sdpConstraints = {
  OfferToReceiveAudio: false,
  OfferToReceiveVideo: false,
};
const mediaConstraints = {
  video: true,
  audio: true,
};

const WebRTCAdaptorInit = (videoId, startStreaming, setIsBroadcasting, url) =>
  new WebRTCAdaptor({
    websocket_url: url,
    mediaConstraints,
    peerconnection_config: pc_config,
    sdp_constraints: sdpConstraints,
    localVideoId: videoId,
    debug: true,
    callback(info) {
      if (info === 'initialized') {
        startStreaming();
      } else if (info === 'publish_started') {
        setIsBroadcasting(true);
        log.info('publish started');
      } else if (info === 'publish_finished') {
        log.info('publish finished');
      } else if (info === 'screen_share_extension_available') {
        log.info('screen share extension available');
      } else if (info === 'screen_share_stopped') {
        log.info('screen share stopped');
      }
    },
    callbackError(error) {
      log.error(` error callback: ${error}`);
    },
  });

export default WebRTCAdaptorInit;
