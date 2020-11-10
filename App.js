import React, {useRef, useState, useEffect} from 'react';
import {View, Dimensions, Text} from 'react-native';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  MediaStream,
  MediaStreamTrack,
  mediaDevices,
  registerGlobals,
} from 'react-native-webrtc';

import io from 'socket.io-client';

const {width, height} = Dimensions.get('window');
const App = () => {
  const [localStream] = useState(null);
  const [remoteStream] = useState(null);
  const [candidates] = useState([]);
  const [success, setSuccess] = useState('');
  const socket = useRef();
  let sdp;

  const serverIP = 'https://b2098b9637a3.ngrok.io';

  useEffect(() => {
    socket.current = io.connect(`${serverIP}/webrtcPeer`, {
      path: '/io/webrtc',
    });

    socket.current.on('connection-success', (success) => {
      setSuccess(success);
      console.log('success', success);
    });
  }, []);
  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Text style={{fontSize: 50}}>App:{success}</Text>
    </View>
  );
};

export default App;
