import { useEffect, useRef, MutableRefObject } from 'react';
import { Socket } from 'socket.io-client';

interface Peer {
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

export const useWebRTC = (
  socket: Socket | null,
  localStream: MediaStream | null,
  roomId: string | undefined
) => {
  const peersRef = useRef<Map<string, Peer>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());

  const ICE_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ],
  };

  const createPeerConnection = (userId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local stream tracks to peer connection
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    // Handle incoming remote tracks
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        remoteStreamsRef.current.set(userId, remoteStream);
        
        // Store stream in peer object
        const peer = peersRef.current.get(userId);
        if (peer) {
          peer.stream = remoteStream;
        }
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket && roomId) {
        socket.emit('ice-candidate', {
          to: userId,
          candidate: event.candidate,
          roomId,
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`Peer connection with ${userId}: ${pc.connectionState}`);
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        console.log(`Connection with ${userId} ${pc.connectionState}, attempting to restart ICE`);
        pc.restartIce();
      }
    };

    return pc;
  };

  const createOffer = async (userId: string) => {
    if (!localStream) {
      console.error('❌ Cannot create offer - No local stream available yet for user:', userId);
      console.log('Retrying in 2 seconds...');
      setTimeout(() => createOffer(userId), 2000);
      return;
    }

    console.log(`📞 Creating offer for user ${userId} (My stream ID: ${localStream.id})`);
    console.log(`   Stream has ${localStream.getAudioTracks().length} audio tracks, ${localStream.getVideoTracks().length} video tracks`);
    
    try {
      const pc = createPeerConnection(userId);
      peersRef.current.set(userId, { connection: pc });

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);

      if (socket && roomId) {
        socket.emit('offer', {
          to: userId,
          offer,
          roomId,
        });
        console.log(`✅ Offer sent successfully to ${userId}`);
      }
    } catch (error) {
      console.error('❌ Error creating offer:', error);
    }
  };

  const handleOffer = async (from: string, offer: RTCSessionDescriptionInit) => {
    if (!localStream) {
      console.error('❌ Cannot handle offer - No local stream available yet from user:', from);
      console.log('Retrying in 2 seconds...');
      setTimeout(() => handleOffer(from, offer), 2000);
      return;
    }

    console.log(`📥 Received offer from ${from}, handling... (My stream ID: ${localStream.id})`);
    console.log(`   Stream has ${localStream.getAudioTracks().length} audio tracks, ${localStream.getVideoTracks().length} video tracks`);
    
    try {
      const pc = createPeerConnection(from);
      peersRef.current.set(from, { connection: pc });

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (socket && roomId) {
        socket.emit('answer', {
          to: from,
          answer,
          roomId,
        });
        console.log(`✅ Answer sent successfully to ${from}`);
      }
    } catch (error) {
      console.error('❌ Error handling offer:', error);
    }
  };

  const handleAnswer = async (from: string, answer: RTCSessionDescriptionInit) => {
    try {
      const peer = peersRef.current.get(from);
      if (peer) {
        await peer.connection.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const handleIceCandidate = async (from: string, candidate: RTCIceCandidateInit) => {
    try {
      const peer = peersRef.current.get(from);
      if (peer && peer.connection.remoteDescription) {
        await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };

  const removePeer = (userId: string) => {
    const peer = peersRef.current.get(userId);
    if (peer) {
      peer.connection.close();
      peersRef.current.delete(userId);
    }
    remoteStreamsRef.current.delete(userId);
  };

  const updateLocalStream = (newStream: MediaStream | null) => {
    // Update tracks for all existing peer connections
    peersRef.current.forEach((peer) => {
      const senders = peer.connection.getSenders();
      
      if (newStream) {
        const audioTrack = newStream.getAudioTracks()[0];
        const videoTrack = newStream.getVideoTracks()[0];

        senders.forEach((sender) => {
          if (sender.track?.kind === 'audio' && audioTrack) {
            sender.replaceTrack(audioTrack);
          }
          if (sender.track?.kind === 'video' && videoTrack) {
            sender.replaceTrack(videoTrack);
          }
        });
      } else {
        // Remove tracks if stream is null
        senders.forEach((sender) => {
          if (sender.track) {
            peer.connection.removeTrack(sender);
          }
        });
      }
    });
  };

  useEffect(() => {
    if (!socket) return;

    // Listen for WebRTC signaling events
    socket.on('offer', ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
      handleOffer(from, offer);
    });

    socket.on('answer', ({ from, answer }: { from: string; answer: RTCSessionDescriptionInit }) => {
      handleAnswer(from, answer);
    });

    socket.on('ice-candidate', ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
      handleIceCandidate(from, candidate);
    });

    socket.on('user-joined', ({ id }: { id: string }) => {
      console.log(`👤 User joined event received for ${id}`);
      console.log(`   My local stream: ${localStream?.id || '⚠️ NO STREAM YET'}`);
      console.log(`   Already connected to this user: ${peersRef.current.has(id)}`);
      
      // Create offer for new user only if we don't already have a connection
      if (!peersRef.current.has(id)) {
        // Increased delay to ensure both parties have streams ready
        setTimeout(() => {
          console.log(`⏰ Now attempting to create offer for ${id}...`);
          createOffer(id);
        }, 2000);
      }
    });

    socket.on('existing-participants', (participants: Array<{ id: string }>) => {
      console.log(`👥 Existing participants received: ${participants.length} participant(s)`);
      console.log(`   Participants:`, participants.map(p => p.id));
      console.log(`   My local stream: ${localStream?.id || '⚠️ NO STREAM YET'}`);
      
      // Create offers for all existing participants
      participants.forEach((participant) => {
        console.log(`   Checking participant ${participant.id}...`);
        if (!peersRef.current.has(participant.id)) {
          console.log(`   Will create offer for ${participant.id}`);
          // Increased delay to ensure both parties have streams ready
          setTimeout(() => {
            console.log(`⏰ Now attempting to create offer for existing participant ${participant.id}...`);
            createOffer(participant.id);
          }, 2000);
        } else {
          console.log(`   Already connected to ${participant.id}, skipping`);
        }
      });
    });

    socket.on('user-left', ({ id }: { id: string }) => {
      removePeer(id);
    });

    return () => {
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('user-joined');
      socket.off('existing-participants');
      socket.off('user-left');
    };
  }, [socket, localStream, roomId]);

  // Update streams when local stream changes
  useEffect(() => {
    if (localStream) {
      updateLocalStream(localStream);
    }
  }, [localStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      peersRef.current.forEach((peer) => {
        peer.connection.close();
      });
      peersRef.current.clear();
      remoteStreamsRef.current.clear();
    };
  }, []);

  return {
    remoteStreams: remoteStreamsRef.current,
    createOffer,
  };
};
