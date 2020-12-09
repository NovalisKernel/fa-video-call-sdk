/* eslint-disable no-alert */
import set from "lodash/set";
import log from "loglevel";
import isFunction from "lodash/isFunction";
import mediaDeviceKindTypes from "../../enums/mediaDeviceKind";
import Emitter from "./Emitter";

const CONSTRAINTS = {
  video: {
    facingMode: "user",
    height: { min: 360, ideal: 720, max: 1080 },
  },
  audio: true,
};

const CONSTRAINTS_WITHOUT_VIDEO = {
  video: false,
  audio: true,
};

const CONSTRAINTS_WITHOUT_AUDIO = {
  video: {
    facingMode: "user",
    height: { min: 360, ideal: 720, max: 1080 },
  },
  audio: false,
};

const STUN_SERVER_URL = ["stun:global.stun.twilio.com:3478?transport=udp"];
const TURN_SERVER_URLS = [
  "turn:global.turn.twilio.com:3478?transport=udp",
  "turn:global.turn.twilio.com:3478?transport=tcp",
  "turn:global.turn.twilio.com:443?transport=tcp",
];

class PeerConnection extends Emitter {
  constructor(username, credential, videoActiveByDefault) {
    super();
    try {
      this.pc = new RTCPeerConnection(
        {
          iceServers: [
            { urls: STUN_SERVER_URL },
            {
              urls: TURN_SERVER_URLS,
              username,
              credential,
            },
          ],
        },
        { optional: [{ DtlsSrtpKeyAgreement: "true" }] }
      );
    } catch (e) {
      log.error({ e });
    }
    this.stream = {};
    this.peerStream = {};
    this.videoActive = videoActiveByDefault;
    this.audioActive = true;
    this.audioInputConnected = false;
    this.videoInputConnected = false;

    this.pc.oniceconnectionstatechange = () => {
      try {
        if (this.pc.iceConnectionState === "disconnected")
          this.emit("peerDisconnected");
      } catch (e) {
        log.error("oniceconnectionstatechange error", e);
      }
    };
    this.pc.onicecandidate = (event) => {
      try {
        this.emit("iceCandidate", { candidate: event.candidate });
      } catch (e) {
        log.error("iceCandidateFailed", e);
      }
    };
    this.pc.ontrack = (event) => {
      this.emit("peerStream", event.streams[0]);
    };
  }

  addIceCandidate({ candidate }) {
    try {
      if (candidate) {
        const iceCandidate = new RTCIceCandidate(candidate);
        this.pc.addIceCandidate(iceCandidate);
      }
      return this;
    } catch (e) {
      log.error(`add ice candidate error ${e}`);
      return this;
    }
  }

  async toggleInputs(type) {
    if (!this.stream) return;

    if (type === "audio") {
      this.stream.getAudioTracks().forEach((track) => {
        set(track, "enabled", !track.enabled);
      });
      this.audioActive = !this.audioActive;
    }

    if (type === "video") {
      const videoTracks = this.stream.getVideoTracks();

      if (videoTracks.length) {
        // video active
        // if videoInput is disconnected ->return this
        if (!this.videoInputConnected) {
          alert("Please connect camera and try again");
          return;
        }

        // stop existed tracks
        this.stream.getTracks().forEach((track) => track.stop());

        // toggle state
        this.videoActive = false;

        if (!this.audioInputConnected) {
          // get video and disable tracks
          this.stream = await navigator.mediaDevices.getUserMedia(
            CONSTRAINTS_WITHOUT_AUDIO
          );
          this.stream.getVideoTracks().forEach((track) => {
            set(track, "enabled", false);
          });
          this.stream.getTracks().forEach((track) => {
            this.pc.addTrack(track, this.stream);
          });
          this.emit("localStream", this.stream);
          await this.createOffer();
        } else {
          this.stream = await navigator.mediaDevices.getUserMedia(
            CONSTRAINTS_WITHOUT_VIDEO
          );
          this.stream.getAudioTracks().forEach((track) => {
            set(track, "enabled", this.audioActive);
          });
          this.stream.getTracks().forEach((track) => {
            this.pc.addTrack(track, this.stream);
          });
          this.emit("localStream", this.stream);
          await this.createOffer();
        }
        // if videoInputConnected toggle videoActive
        // !!!!!!! if audio input disconnected then videoActive false will trigger error
      } else {
        // video disabled
        // if videoInput is disconnected ->return
        if (!this.videoInputConnected) {
          alert("Please connect camera and try again");
          return;
        }

        // stop existed tracks
        this.stream.getTracks().forEach((track) => track.stop());

        // toggle state
        this.videoActive = true;

        // take with video and then disabled audio tracks if needed
        this.stream = await navigator.mediaDevices.getUserMedia(CONSTRAINTS);

        if (!this.audioActive)
          this.stream.getAudioTracks().forEach((track) => {
            set(track, "enabled", false);
          });

        this.stream.getTracks().forEach((track) => {
          this.pc.addTrack(track, this.stream);
        });
        this.emit("localStream", this.stream);
        await this.createOffer();
      }
    }
  }

  async start(isCaller) {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      if (!devices.length) {
        alert("There are no connected devices");
        return this;
      }

      this.videoInputConnected = !!devices.filter(
        (device) => device.kind === mediaDeviceKindTypes.video
      );
      this.audioInputConnected = !!devices.filter(
        (device) => device.kind === mediaDeviceKindTypes.audio
      );

      if (!this.videoInputConnected && !this.audioInputConnected) {
        alert("Start call error. Please connect microphone and/or camera.");
        return this;
      }
      if (!this.videoInputConnected) {
        // audioInput connected
        this.stream = await navigator.mediaDevices.getUserMedia(
          CONSTRAINTS_WITHOUT_VIDEO
        );
        this.stream.getTracks().forEach((track) => {
          this.pc.addTrack(track, this.stream);
        });
        this.emit("localStream", this.stream);
      } else if (!this.audioInputConnected) {
        // videoInput connected
        this.stream = await navigator.mediaDevices.getUserMedia(
          CONSTRAINTS_WITHOUT_AUDIO
        );
        // if audio and video are not active - the only way is to
        // getUserMedia with video and then disable video tracks

        // if video disabled by default
        if (!this.videoActive)
          this.stream.getVideoTracks().forEach((track) => {
            set(track, "enabled", false);
          });

        this.stream.getTracks().forEach((track) => {
          this.pc.addTrack(track, this.stream);
        });
        this.emit("localStream", this.stream);
        return this;
      } else {
        // if all devices is available
        this.audioInputConnected = true;
        this.videoInputConnected = true;

        if (this.videoActive)
          this.stream = await navigator.mediaDevices.getUserMedia(CONSTRAINTS);
        else
          this.stream = await navigator.mediaDevices.getUserMedia(
            CONSTRAINTS_WITHOUT_VIDEO
          );

        this.stream.getTracks().forEach((track) => {
          this.pc.addTrack(track, this.stream);
        });
        this.emit("localStream", this.stream);
      }
      if (isCaller) this.emit("startCall");
      else {
        await this.createOffer();
      }
      return this;
    } catch (e) {
      log.error(`Start call error${e}`);
      alert("Start call error. Check audio/video inputs and try again.");
      return this;
    }
  }

  stop(isStarter) {
    if (isStarter) this.emit("stopCall");
    if (isFunction(this.stream.getTracks)) {
      this.stream.getTracks().forEach((track) => track.stop());
    }
    this.pc.close();
    this.pc = {};
    this.stream = {};
    this.off();
    this.audioInputConnected = true;
    this.videoInputConnected = true;
    return this;
  }

  async handleOffer({ offer }) {
    try {
      await this.setRemoteDescription(offer);
      await this.createAnswer();

      return this;
    } catch (e) {
      log.error(` handle offer error ${e}`);
      return this;
    }
  }

  async handleAnswer({ answer }) {
    try {
      await this.pc.setRemoteDescription(answer);
      return this;
    } catch (e) {
      log.error(` handle answer error ${e}`);
      return this;
    }
  }

  async createOffer() {
    if (isFunction(this.pc.createOffer)) {
      try {
        const offer = await this.pc.createOffer();
        await this.setLocalDescription(offer);
        this.emit("offerCreated", {
          offer: this.pc.localDescription,
        });
        return this;
      } catch (e) {
        log.error(e);
        return this;
      }
    }
    return this;
  }

  async createAnswer() {
    if (isFunction(this.pc.createAnswer)) {
      try {
        const answer = await this.pc.createAnswer();
        await this.setLocalDescription(answer);
        this.emit("answerCreated", {
          answer: this.pc.localDescription,
        });
        return this;
      } catch (e) {
        log.error({ e });
        return this;
      }
    }
    return this;
  }

  async setLocalDescription(value) {
    try {
      if (isFunction(this.pc.setLocalDescription))
        await this.pc.setLocalDescription(value);
      return this;
    } catch (e) {
      log.error(` setLocalDescription error ${e}`);
      return this;
    }
  }

  async setRemoteDescription(value) {
    try {
      if (isFunction(this.pc.setRemoteDescription)) {
        if (value === null) throw Error("remote description is null");
        await this.pc.setRemoteDescription(value);
      }
      return this;
    } catch (e) {
      log.error(` setRemoteDescription error ${e}`);
      return this;
    }
  }

  toggle(type, on) {
    try {
      const len = arguments.length;
      if (this.stream) {
        this.stream[`get${type}Tracks`]().forEach((track) => {
          const state = len === 2 ? on : !track.enabled;

          set(track, "enabled", state);
        });
      }
      return this;
    } catch (e) {
      log.error(` toggle device error ${e}`);
      return this;
    }
  }
}

export default PeerConnection;
