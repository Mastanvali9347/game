import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from '../services/socket';


const useWebRTC = (roomId, userId) => {
  const socket = getSocket();
  const [micEnabled, setMicEnabled] = useState(false);
  const [streams, setStreams] = useState({});
  const pcs = useRef({});
  const localStream = useRef(null);

  const configuration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  };

  const createPeerConnection = useCallback((targetUserId) => {
    if (pcs.current[targetUserId]) return pcs.current[targetUserId];

    const pc = new RTCPeerConnection(configuration);

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('voice_ice_candidate', {
          room_id: roomId,
          target_id: targetUserId,
          candidate: event.candidate,
          sender_id: userId
        });
      }
    };

    pc.ontrack = (event) => {
      setStreams(prev => ({
        ...prev,
        [targetUserId]: event.streams[0]
      }));
    };

    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        pc.addTrack(track, localStream.current);
      });
    }

    pcs.current[targetUserId] = pc;
    return pc;
  }, [roomId, userId]);

  const sendOffer = useCallback(async (targetId) => {
    const pc = createPeerConnection(targetId);

    if (pc.signalingState !== "stable") return;

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    if (socket) {
      socket.emit('voice_offer', {
        room_id: roomId,
        target_id: targetId,
        offer,
        sender_id: userId
      });
    }
  }, [createPeerConnection, roomId, userId, socket]);

  const toggleMic = async () => {
    try {
      if (!micEnabled) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStream.current = stream;

        Object.keys(pcs.current).forEach(targetId => {
          const pc = pcs.current[targetId];
          stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
          });
          sendOffer(targetId);
        });

        setMicEnabled(true);
      } else {
        if (localStream.current) {
          localStream.current.getTracks().forEach(track => track.stop());
          localStream.current = null;
        }

        setMicEnabled(false);
      }
    } catch (err) {
      console.error('Mic error:', err);
    }
  };

  useEffect(() => {
    if (!socket || !userId) return;

    socket.on('voice_offer', async (data) => {
      if (data.target_id !== userId) return;

      const pc = createPeerConnection(data.sender_id);

      if (pc.signalingState !== "stable") return;

      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('voice_answer', {
        room_id: roomId,
        target_id: data.sender_id,
        answer,
        sender_id: userId
      });
    });

    socket.on('voice_answer', async (data) => {
      if (data.target_id !== userId) return;

      const pc = pcs.current[data.sender_id];
      if (!pc) return;

      if (pc.signalingState !== "have-local-offer") return;

      await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
    });

    socket.on('voice_ice_candidate', async (data) => {
      if (data.target_id !== userId) return;

      const pc = pcs.current[data.sender_id];
      if (pc && data.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch {}
      }
    });

    socket.on('player_joined', (data) => {
      if (data.id !== userId) {
        sendOffer(data.id);
      }
    });

    socket.on('player_left', (data) => {
      const pc = pcs.current[data.id];
      if (pc) {
        pc.close();
        delete pcs.current[data.id];

        setStreams(prev => {
          const copy = { ...prev };
          delete copy[data.id];
          return copy;
        });
      }
    });


    return () => {
      socket.off('voice_offer');
      socket.off('voice_answer');
      socket.off('voice_ice_candidate');
      socket.off('player_joined');
      socket.off('player_left');

      Object.values(pcs.current).forEach(pc => pc.close());

      if (localStream.current) {
        localStream.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [userId, roomId, createPeerConnection, sendOffer]);

  return { micEnabled, toggleMic, remoteStreams: streams };
};

export default useWebRTC;