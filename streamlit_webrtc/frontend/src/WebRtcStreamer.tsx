import React, { useState, useCallback } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import DeviceSelector from "./DeviceSelector";
import MediaStreamPlayer from "./MediaStreamPlayer";
import Placeholder from "./Placeholder";
import { useRenderData } from "streamlit-component-lib-react-hooks";
import {
  useWebRtc,
  WebRtcMode,
  isWebRtcMode,
  isReceivable,
  isTransmittable,
} from "./webrtc";
import { getMediaUsage } from "./media-constraint";
import { ComponentValue, setComponentValue } from "./component-value";
import "webrtc-adapter";

interface WebRtcStreamerInnerProps {
  disabled: boolean;
  mode: WebRtcMode;
  desiredPlayingState: boolean | undefined;
  sdpAnswerJson: string | undefined;
  rtcConfiguration: RTCConfiguration | undefined;
  mediaStreamConstraints: MediaStreamConstraints | undefined;
  videoHtmlAttrs: any;
  audioHtmlAttrs: any;
  onComponentValueChange: (newComponentValue: ComponentValue) => void;
}
const WebRtcStreamerInner: React.VFC<WebRtcStreamerInnerProps> = (props) => {
  const [devices, setDevices] = useState<{
    video: MediaDeviceInfo | null;
    audio: MediaDeviceInfo | null;
  }>({ video: null, audio: null });
  const { state, start, stop } = useWebRtc(
    props,
    devices.video,
    devices.audio,
    props.onComponentValueChange
  );

  const mode = props.mode;
  const buttonDisabled =
    props.disabled ||
    (state.webRtcState === "SIGNALLING" && !state.signallingTimedOut) || // Users can click the stop button after signalling timed out.
    state.webRtcState === "STOPPING" ||
    props.desiredPlayingState != null;
  const receivable = isWebRtcMode(mode) && isReceivable(mode);
  const transmittable = isWebRtcMode(mode) && isTransmittable(mode);
  const { videoEnabled, audioEnabled } = getMediaUsage(
    props.mediaStreamConstraints
  );

  const handleDeviceSelect = useCallback(
    (video: MediaDeviceInfo | null, audio: MediaDeviceInfo | null) => {
      setDevices({ video, audio });
    },
    []
  );

  return (
    <Box>
      {state.error && (
        <Alert severity="error">
          {state.error.name}: {state.error.message}
        </Alert>
      )}
      <Box py={1} display="flex">
        {state.stream ? (
          <MediaStreamPlayer
            stream={state.stream}
            userDefinedVideoAttrs={props.videoHtmlAttrs}
            userDefinedAudioAttrs={props.audioHtmlAttrs}
          />
        ) : (
          receivable && (
            <Placeholder loading={state.webRtcState === "SIGNALLING"} />
          )
        )}
      </Box>
      <Box display="flex" justifyContent="space-between">
        {state.webRtcState === "PLAYING" ||
        state.webRtcState === "SIGNALLING" ? (
          <Button variant="contained" onClick={stop} disabled={buttonDisabled}>
            Stop
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={start}
            disabled={buttonDisabled}
          >
            Start
          </Button>
        )}
        {transmittable && (
          <DeviceSelector
            videoEnabled={videoEnabled}
            audioEnabled={audioEnabled}
            onSelect={handleDeviceSelect}
            value={devices}
          />
        )}
      </Box>
    </Box>
  );
};

const WebRtcStreamer: React.VFC = () => {
  const renderData = useRenderData();

  const mode = renderData.args["mode"];
  const desiredPlayingState = renderData.args["desired_playing_state"];
  const sdpAnswerJson = renderData.args["sdp_answer_json"];
  const rtcConfiguration: RTCConfiguration = renderData.args.rtc_configuration;
  const mediaStreamConstraints: MediaStreamConstraints =
    renderData.args.media_stream_constraints;
  const videoHtmlAttrs = renderData.args.video_html_attrs;
  const audioHtmlAttrs = renderData.args.audio_html_attrs;

  if (!isWebRtcMode(mode)) {
    throw new Error(`Invalid mode ${mode}`);
  }

  return (
    <WebRtcStreamerInner
      disabled={renderData.disabled}
      mode={mode}
      desiredPlayingState={desiredPlayingState}
      sdpAnswerJson={sdpAnswerJson}
      rtcConfiguration={rtcConfiguration}
      mediaStreamConstraints={mediaStreamConstraints}
      videoHtmlAttrs={videoHtmlAttrs}
      audioHtmlAttrs={audioHtmlAttrs}
      onComponentValueChange={setComponentValue}
    />
  );
};

export default WebRtcStreamer;
