import React, {useRef, useState, useEffect} from 'react';
import {
  View,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  mediaDevices,
} from 'react-native-webrtc';

import io from 'socket.io-client';

const {width, height} = Dimensions.get('window');
const App = () => {
  const pc = useRef(new RTCPeerConnection(null));

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const socket = useRef();

  const serverIP = 'https://73e106f3342b.ngrok.io';

  useEffect(() => {
    const pc_config = {
      iceServers: [
        // {
        //   urls: 'stun:[STUN_IP]:[PORT]',
        //   'credentials': '[YOR CREDENTIALS]',
        //   'username': '[USERNAME]'
        // },
        {
          urls: 'stun:stun.l.google.com:19302',
        },
      ],
    };
    const _pc = new RTCPeerConnection(pc_config);

    _pc.onicecandidate = (e) => {
      if (e.candidate) {
        sendToPeer('candidate', e.candidate);
        console.log(JSON.stringify(e.candidate));
      }
    };

    _pc.oniceconnectionstatechange = (e) => {
      console.log(e);
    };

    _pc.onaddstream = (e) => {
      // we got remote stream ...
      setRemoteStream(e.stream);
    };

    const success = (stream) => {
      setLocalStream(stream);
      _pc.addStream(stream);
    };
    const failure = (e) => {
      console.log('getUserMidea Error ...', e);
    };

    socket.current = io.connect(`${serverIP}/webrtcPeer`, {
      path: '/io/webrtc',
    });

    socket.current.on('connection-success', ({success}) => {
      console.log('success', success);
    });

    socket.current.on('offerOrAnswer', (sdps) => {
      _pc.setRemoteDescription(new RTCSessionDescription(sdps));
    });

    socket.current.on('candidate', (candidate) => {
      _pc.addIceCandidate(new RTCIceCandidate(candidate));
    });

    pc.current = _pc;

    // RN-webRTC Stuff

    let isFront = true;
    mediaDevices.enumerateDevices().then((sourceInfos) => {
      console.log(sourceInfos);
      let videoSourceId;
      for (let i = 0; i < sourceInfos.length; i++) {
        const sourceInfo = sourceInfos[i];
        if (
          sourceInfo.kind == 'videoinput' &&
          sourceInfo.facing == (isFront ? 'front' : 'environment')
        ) {
          videoSourceId = sourceInfo.deviceId;
        }
      }
      mediaDevices
        .getUserMedia({
          audio: true,
          video: {
            mandatory: {
              minWidth: 500, // Provide your own width, height and frame rate here
              minHeight: 300,
              minFrameRate: 30,
            },
            facingMode: isFront ? 'user' : 'environment',
            optional: videoSourceId ? [{sourceId: videoSourceId}] : [],
          },
        })
        .then(success)
        .catch(failure);
    });
  }, []);

  const sendToPeer = (messageType, payload) => {
    socket.current.emit(messageType, {
      socketID: socket.current.id,
      payload,
    });
  };

  const createOffer = () => {
    pc.current
      .createOffer({
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1,
      })
      .then((sdp) => {
        console.log(JSON.stringify(sdp));
        pc.current.setLocalDescription(sdp);
        sendToPeer('offerOrAnswer', sdp);
      })
      .catch((e) => console.log(e));
  };

  const createAnswer = () => {
    pc.current
      .createAnswer({
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1,
      })
      .then((sdp) => {
        console.log(JSON.stringify(sdp));
        pc.current.setLocalDescription(sdp);
        sendToPeer('offerOrAnswer', sdp);
      })
      .catch((e) => console.log(e));
  };

  const remoteVideo = remoteStream ? (
    <RTCView
      mirror={true}
      style={styles.remoteVideo}
      zOrder={15}
      objectFit="cover"
      streamURL={remoteStream?.toURL()}
    />
  ) : (
    <View
      style={{
        backgroundColor: 'teal',
        flex: 1,
        padding: 10,
      }}>
      <Text style={{fontSize: 22, textAlign: 'center', color: 'white'}}>
        Waiting for Peer connection ...
      </Text>
    </View>
  );
  return (
    <View style={{flex: 1}}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <TouchableOpacity
          onPress={createOffer}
          style={{
            backgroundColor: '#7f7f7f',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
            flex: 1,
            margin: 5,
            borderRadius: 5,
          }}>
          <Text style={{fontSize: 18, color: '#000'}}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={createAnswer}
          style={{
            backgroundColor: '#7f7f7f',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
            flex: 1,
            margin: 5,
            borderRadius: 5,
          }}>
          <Text style={{fontSize: 18, color: '#000'}}>Answer</Text>
        </TouchableOpacity>
      </View>
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'center',
        }}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'teal',
          }}>
          {remoteVideo}
        </View>

        <RTCView
          objectFit="cover"
          zOrder={1}
          style={styles.localVideo}
          streamURL={localStream?.toURL()}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  remoteVideo: {
    flex: 1,
    position: 'absolute',
    left: 0,
    top: 0,
    margin: 0,
    padding: 0,
    aspectRatio: 1,
    width,
    height,
  },
  localVideo: {
    width: 150,
    height: 250,
    position: 'absolute',
    right: 10,
    bottom: 10,
  },
});
export default App;
