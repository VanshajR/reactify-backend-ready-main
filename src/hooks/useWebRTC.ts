import { useEffect, useRef, useState } from 'react';
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
  console.log('🎬 useWebRTC HOOK CALLED', { hasSocket: !!socket, hasLocalStream: !!localStream, roomId });
  
  const peersRef = useRef<Map<string, Peer>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());

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
    console.log(`🔗 Creating peer connection for ${userId}`);
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local stream tracks to peer connection
    if (localStream) {
      console.log(`🎥 Adding ${localStream.getTracks().length} tracks to peer connection for ${userId}`);
      localStream.getTracks().forEach((track) => {
        console.log(`  ➕ Adding ${track.kind} track (enabled: ${track.enabled})`);
        pc.addTrack(track, localStream);
      });
    } else {
      console.warn(`⚠️ No local stream available when creating peer connection for ${userId}`);
    }

    // Handle incoming remote tracks
    pc.ontrack = (event) => {
      console.log(`📡 Received ${event.track.kind} track from ${userId}`);
      const [remoteStream] = event.streams;
      if (remoteStream) {
        console.log(`✅ Remote stream received from ${userId} (id: ${remoteStream.id})`);
        remoteStreamsRef.current.set(userId, remoteStream);
        setRemoteStreams(new Map(remoteStreamsRef.current)); // Trigger React re-render
        
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
      console.log(`🔌 Peer connection with ${userId}: ${pc.connectionState}`);
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        console.log(`❌ Connection with ${userId} ${pc.connectionState}, attempting to restart ICE`);
        pc.restartIce();
      } else if (pc.connectionState === 'connected') {
        console.log(`✅ Successfully connected to ${userId}`);
      }
    };

    return pc;
  };

  // Replace a specific track (video or audio) in all peer connections
  const replaceTrack = async (kind: 'video' | 'audio', newTrack: MediaStreamTrack | null, renegotiate: boolean = false) => {
    console.log(`🔄 Replacing ${kind} track for all ${peersRef.current.size} peers`);
    console.log(`   New track:`, newTrack ? `${newTrack.kind} (enabled: ${newTrack.enabled})` : 'null');
    console.log(`   Renegotiate: ${renegotiate}`);
    
    for (const [peerId, peer] of peersRef.current.entries()) {
      const senders = peer.connection.getSenders();
      const sender = senders.find(s => s.track?.kind === kind);
      
      if (sender) {
        try {
          await sender.replaceTrack(newTrack);
          console.log(`✅ Successfully replaced ${kind} track for peer ${peerId}`);
          
          // If renegotiation is needed (e.g., for screen share), create new offer
          if (renegotiate && socket && roomId) {
            console.log(`🔄 Creating new offer for peer ${peerId} after track replacement`);
            const offer = await peer.connection.createOffer();
            await peer.connection.setLocalDescription(offer);
            socket.emit('offer', {
              to: peerId,
              offer,
              roomId,
            });
          }
        } catch (err) {
          console.error(`❌ Failed to replace ${kind} track for peer ${peerId}:`, err);
        }
      } else {
        console.warn(`⚠️ No ${kind} sender found for peer ${peerId}`);
      }
    }
  };

  // Add local tracks to all existing peer connections
  const addLocalTracksToPeers = (stream: MediaStream) => {
    console.log(`🎬 Adding local tracks to all ${peersRef.current.size} existing peers`);
    
    peersRef.current.forEach((peer, peerId) => {
      const existingSenders = peer.connection.getSenders();
      
      stream.getTracks().forEach(track => {
        const existingSender = existingSenders.find(s => s.track?.kind === track.kind);
        
        if (!existingSender) {
          console.log(`  ➕ Adding ${track.kind} track to peer ${peerId}`);
          peer.connection.addTrack(track, stream);
        } else {
          console.log(`  🔄 Replacing ${track.kind} track for peer ${peerId}`);
          existingSender.replaceTrack(track);
        }
      });
    });
  };

  const createOffer = async (userId: string) => {
    console.log(`📞 Attempting to create offer for user ${userId}`);
    console.log(`   Local stream available: ${!!localStream}`);
    
    if (!localStream) {
      console.warn('⚠️ No local stream yet - WebRTC will create connection without sending tracks initially');
      // Still create the peer connection even without local stream
      // Tracks can be added later when stream becomes available
    } else {
      console.log(`   Stream ID: ${localStream.id}`);
      console.log(`   Audio tracks: ${localStream.getAudioTracks().length}, Video tracks: ${localStream.getVideoTracks().length}`);
    }
    
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
    console.log(`📥 Received offer from ${from}, handling...`);
    console.log(`   Local stream available: ${!!localStream}`);
    
    if (!localStream) {
      console.warn('⚠️ No local stream yet - WebRTC will create connection and add tracks later');
    } else {
      console.log(`   Stream ID: ${localStream.id}`);
      console.log(`   Audio tracks: ${localStream.getAudioTracks().length}, Video tracks: ${localStream.getVideoTracks().length}`);
    }
    
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
    console.log(`👋 Removing peer ${userId}`);
    const peer = peersRef.current.get(userId);
    if (peer) {
      peer.connection.close();
      peersRef.current.delete(userId);
    }
    remoteStreamsRef.current.delete(userId);
    setRemoteStreams(new Map(remoteStreamsRef.current)); // Trigger React re-render
  };

  useEffect(() => {
    console.log('🎯 useWebRTC useEffect TRIGGERED', { hasSocket: !!socket, roomId });
    
    if (!socket || !roomId) {
      console.log('❌ useWebRTC: Cannot set up listeners - missing socket or roomId');
      return;
    }

    console.log('🔌 Setting up WebRTC socket listeners for room:', roomId);

    // Listen for WebRTC signaling events
    socket.on('offer', ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
      console.log(`📨 RECEIVED OFFER from ${from}`);
      handleOffer(from, offer);
    });

    socket.on('answer', ({ from, answer }: { from: string; answer: RTCSessionDescriptionInit }) => {
      console.log(`📨 RECEIVED ANSWER from ${from}`);
      handleAnswer(from, answer);
    });

    socket.on('ice-candidate', ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
      console.log(`📨 RECEIVED ICE CANDIDATE from ${from}`);
      handleIceCandidate(from, candidate);
    });

    socket.on('user-joined', ({ id }: { id: string }) => {
      console.log(`👤 ===== USER-JOINED EVENT RECEIVED for ${id} =====`);
      console.log(`   Already connected to this user: ${peersRef.current.has(id)}`);
      console.log(`   Local stream available: ${!!localStream}`);
      
      // Create offer for new user only if we don't already have a connection
      if (!peersRef.current.has(id)) {
        // IMMEDIATELY create offer - don't wait
        console.log(`🚀 Creating offer for ${id} IMMEDIATELY`);
        createOffer(id);
      } else {
        console.log(`⚠️ Skipping offer - already connected to ${id}`);
      }
    });

    socket.on('existing-participants', (participants: Array<{ id: string }>) => {
      console.log(`👥 ===== EXISTING-PARTICIPANTS EVENT RECEIVED =====`);
      console.log(`   ${participants.length} participant(s)`);
      console.log(`   Participants:`, participants.map(p => p.id));
      console.log(`   Local stream available: ${!!localStream}`);
      
      // Create offers for all existing participants IMMEDIATELY
      participants.forEach((participant) => {
        console.log(`   Checking participant ${participant.id}...`);
        if (!peersRef.current.has(participant.id)) {
          console.log(`   🚀 Creating offer for ${participant.id} IMMEDIATELY`);
          createOffer(participant.id);
        } else {
          console.log(`   ⚠️ Already connected to ${participant.id}, skipping`);
        }
      });
    });

    socket.on('user-left', ({ id }: { id: string }) => {
      console.log(`👋 User left event received for ${id}`);
      removePeer(id);
    });

    return () => {
      console.log('🔌 Cleaning up WebRTC socket listeners');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('user-joined');
      socket.off('existing-participants');
      socket.off('user-left');
    };
  }, [socket, roomId]); // REMOVED localStream from dependencies to prevent re-registration

  // When localStream becomes available, add tracks to existing peer connections
  useEffect(() => {
    if (localStream && peersRef.current.size > 0) {
      console.log(`🎬 Local stream NOW available! Adding tracks to ${peersRef.current.size} existing peer(s)`);
      addLocalTracksToPeers(localStream);
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
    remoteStreams,
    replaceTrack,
    addLocalTracksToPeers,
    createOffer,
  };
};
