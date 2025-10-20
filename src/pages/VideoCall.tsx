import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, MessageSquare, Users, MonitorUp, Volume2, VolumeX, Circle, StopCircle, Copy } from 'lucide-react';
import { useSocket } from '@/context/SocketContext';
import { useMeeting } from '@/context/MeetingContext';
import { useToast } from '@/hooks/use-toast';
import { useWebRTC } from '@/hooks/useWebRTC';
import VideoGrid from '@/components/VideoGrid';
import ChatPanel from '@/components/ChatPanel';
import ParticipantsList from '@/components/ParticipantsList';
import AdminPanel from '@/components/AdminPanel';
import WaitingRoom from '@/components/WaitingRoom';
import { notificationSounds } from '@/utils/notifications';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const VideoCall = () => {
 const { meetingId } = useParams();
 const [searchParams] = useSearchParams();
 const navigate = useNavigate();
 const { socket } = useSocket();
 const { toast } = useToast();
 
 const {
 isAudioMuted,
 setIsAudioMuted,
 isVideoOff,
 setIsVideoOff,
 isScreenSharing,
 setIsScreenSharing,
 isChatOpen,
 setIsChatOpen,
 isParticipantsOpen,
 setIsParticipantsOpen,
 localStream,
 setLocalStream,
 participants,
 setParticipants,
 messages,
 setMessages,
 } = useMeeting();

 const userName = searchParams.get('name') || 'Guest';
 const startWithAudio = searchParams.get('audio') !== 'false'; // default true
 const startWithVideo = searchParams.get('video') !== 'false'; // default true
 const [isAdmin, setIsAdmin] = useState(false); // Will be set by backend
 
 console.log('🔍 VideoCall initialized:', { 
   userName,
   meetingId
 });
 
 const [isConnecting, setIsConnecting] = useState(true);
 const [meetingValid, setMeetingValid] = useState(false);
 const [soundsEnabled, setSoundsEnabled] = useState(true);
 const [isRecording, setIsRecording] = useState(false);
 const [inWaitingRoom, setInWaitingRoom] = useState(true); // Start in waiting room, backend will determine admin status
 const [waitingUsers, setWaitingUsers] = useState<Array<{ socketId: string; name: string; joinedAt: Date }>>([]);
 const [participantPermissions, setParticipantPermissions] = useState<Map<string, { allowAudio: boolean; allowVideo: boolean; allowScreenShare: boolean }>>(new Map());
 const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
 const [myPermissions, setMyPermissions] = useState<{ allowAudio: boolean; allowVideo: boolean; allowScreenShare: boolean }>({ allowAudio: true, allowVideo: true, allowScreenShare: true });
 const screenStreamRef = useRef<MediaStream | null>(null);
 const mediaRecorderRef = useRef<MediaRecorder | null>(null);
 const recordedChunksRef = useRef<Blob[]>([]);
 
 // Refs to access latest values in cleanup handlers without causing re-renders
 const socketRef = useRef(socket);
 const localStreamRef = useRef(localStream);
 
 // Keep refs updated
 useEffect(() => {
 socketRef.current = socket;
 }, [socket]);
 
 useEffect(() => {
 localStreamRef.current = localStream;
 }, [localStream]);

 // Initialize WebRTC with remote streams
 const { remoteStreams, replaceTrack, addLocalTracksToPeers } = useWebRTC(socket, localStream, meetingId || '');

 // Toggle notification sounds
 const toggleSounds = () => {
 const newState = notificationSounds.toggle();
 setSoundsEnabled(newState);
 toast({
 title: newState ? 'Sounds Enabled' : 'Sounds Disabled',
 description: newState ? 'You will hear notification sounds' : 'Notification sounds are muted',
 });
 };

 // Copy meeting ID to clipboard
 const copyMeetingId = () => {
 if (meetingId) {
 navigator.clipboard.writeText(meetingId);
 toast({
 title: 'Copied!',
 description: 'Meeting ID copied to clipboard',
 });
 }
 };

 // Recording functions
 const startRecording = async () => {
 if (!localStream || !isAdmin) return;

 try {
 // Notify all participants that recording started
 if (socket && meetingId) {
 socket.emit('recording-started', { roomId: meetingId });
 }

 // For now, record just the local stream (local video + local audio)
 // Note: WebRTC peer connections would need to be exposed to record all participants
 // This is a limitation of the current architecture
 const combinedStream = new MediaStream([
 ...localStream.getTracks(),
 ]);

 // Configure MediaRecorder
 const options = { mimeType: 'video/webm;codecs=vp9,opus' };
 
 // Fallback to simpler codec if vp9 not supported
 if (!MediaRecorder.isTypeSupported(options.mimeType)) {
 options.mimeType = 'video/webm';
 }

 const mediaRecorder = new MediaRecorder(combinedStream, options);
 mediaRecorderRef.current = mediaRecorder;
 recordedChunksRef.current = [];

 mediaRecorder.ondataavailable = (event) => {
 if (event.data.size > 0) {
 recordedChunksRef.current.push(event.data);
 }
 };

 mediaRecorder.onstop = () => {
 const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = `meeting-${meetingId}-${Date.now()}.webm`;
 a.click();
 URL.revokeObjectURL(url);
 
 toast({
 title: 'Recording Saved',
 description: 'Your meeting recording has been downloaded',
 });
 };

 mediaRecorder.start(1000); // Collect data every second
 setIsRecording(true);
 
 notificationSounds.playRecordingStart();
 toast({
 title: 'Recording Started',
 description: 'Meeting is now being recorded',
 });
 } catch (error) {
 console.error('Recording error:', error);
 toast({
 title: 'Recording Failed',
 description: 'Could not start recording',
 variant: 'destructive',
 });
 }
 };

 const stopRecording = () => {
 if (mediaRecorderRef.current && isRecording) {
 mediaRecorderRef.current.stop();
 setIsRecording(false);
 
 notificationSounds.playRecordingStop();
 
 // Notify all participants that recording stopped
 if (socket && meetingId) {
 socket.emit('recording-stopped', { roomId: meetingId });
 }
 }
 };

 // Validate meeting exists before initializing media
 useEffect(() => {
 const validateMeeting = async () => {
 if (!meetingId) {
 toast({
 title: 'Invalid Meeting',
 description: 'No meeting ID provided',
 variant: 'destructive',
 });
 navigate('/');
 return;
 }

 try {
 // Check if meeting exists in database
 await axios.get(`${API_URL}/api/meetings/${meetingId}`);
 setMeetingValid(true);
 } catch (error: any) {
 console.error('Meeting validation error:', error);
 const errorMessage = error.response?.status === 404 
 ? 'This meeting does not exist or has been deleted'
 : 'Failed to validate meeting';
 
 toast({
 title: 'Meeting Not Found',
 description: errorMessage,
 variant: 'destructive',
 });
 
 // Redirect to home after 2 seconds
 setTimeout(() => {
 navigate('/');
 }, 2000);
 }
 };

 validateMeeting();
 }, [meetingId, navigate, toast]);

 useEffect(() => {
 if (!meetingValid) return; // Don't initialize media until meeting is validated
 if (!socket) {
 console.warn('⚠️ Socket not initialized yet, waiting...');
 return;
 }

 console.log('🔌 Socket status:', { 
 socketId: socket.id, 
 connected: socket.connected,
 meetingId,
 userName 
 });

 // Get/generate userIdentifier
 let userIdentifier = localStorage.getItem('reactify_user_id');
 
 // TESTING: Force new identity if ?newUser=true in URL (for testing with same browser)
 const forceNewUser = searchParams.get('newUser') === 'true';
 if (forceNewUser) {
 userIdentifier = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
 localStorage.setItem('reactify_user_id', userIdentifier);
 console.log('🆔 FORCED new userIdentifier for testing:', userIdentifier);
 }
 
 // If no userIdentifier exists, generate one (fallback for guests)
 if (!userIdentifier) {
 userIdentifier = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
 localStorage.setItem('reactify_user_id', userIdentifier);
 console.log('🆔 Generated new userIdentifier:', userIdentifier);
 }

 const initMedia = async () => {
 try {
 const stream = await navigator.mediaDevices.getUserMedia({
 video: startWithVideo ? {
 width: { ideal: 1280 },
 height: { ideal: 720 },
 aspectRatio: { ideal: 16 / 9 }
 } : false,
 audio: true,
 });
 
 // Apply initial audio preference
 const audioTrack = stream.getAudioTracks()[0];
 if (audioTrack) {
 audioTrack.enabled = startWithAudio;
 setIsAudioMuted(!startWithAudio);
 }

 // Apply initial video preference
 if (!startWithVideo) {
 setIsVideoOff(true);
 } else {
 setIsVideoOff(false);
 }
 
 setLocalStream(stream);
 setIsConnecting(false);

 console.log('✅ Local stream initialized with', stream.getTracks().length, 'tracks');
 
 // NOW join the room AFTER media is ready
 if (socket.connected && meetingId) {
 console.log('🚀 Media ready! Joining room with userIdentifier:', userIdentifier);
 socket.emit('join-room', { roomId: meetingId, userName, userIdentifier });
 } else {
 console.error('❌ Cannot join room - socket not connected or missing meetingId');
 }
 
 } catch (error) {
 console.error('❌ Error accessing media devices:', error);
 
 // Even if media fails, still join the room (without media)
 if (socket.connected && meetingId) {
 console.log('⚠️ Media failed, but joining room anyway (without media)');
 socket.emit('join-room', { roomId: meetingId, userName, userIdentifier });
 }
 
 toast({
 title: '⚠️ Media Error',
 description: 'Could not access camera or microphone. You can still join without media.',
 variant: 'destructive',
 duration: 3000,
 });
 setIsConnecting(false);
 setIsVideoOff(true);
 setIsAudioMuted(true);
 }
 };

 initMedia();

 return () => {
 // Cleanup media on unmount or when socket/meeting changes
 if (localStream) {
 console.log('Stopping local stream tracks from initMedia cleanup');
 localStream.getTracks().forEach(track => track.stop());
 }
 if (screenStreamRef.current) {
 screenStreamRef.current.getTracks().forEach(track => track.stop());
 }
 };
 }, [meetingValid, socket, meetingId, userName, toast, navigate]); // REMOVED isAdmin - it was causing re-initialization

 useEffect(() => {
 if (!socket || !meetingId) return;

 // Add socket error listeners
 socket.on('connect_error', (error) => {
 console.error('❌ Socket connection error:', error);
 toast({
 title: '❌ Connection Error',
 description: 'Failed to connect to server. Please refresh.',
 variant: 'destructive',
 duration: 3000,
 });
 });

 socket.on('error', (error) => {
 console.error('❌ Socket error:', error);
 });

 // Listen for admin status from backend
 socket.on('admin-status', ({ isAdmin: adminStatus }: { isAdmin: boolean }) => {
 console.log('🔐 Received admin-status event from backend:', adminStatus);
 console.log('   Current inWaitingRoom state:', inWaitingRoom);
 console.log('   Current isAdmin state:', isAdmin);
 
 setIsAdmin(adminStatus);
 
 if (adminStatus) {
 console.log('👑 Confirmed as ADMIN - bypassing waiting room');
 setInWaitingRoom(false);
 notificationSounds.playMeetingStart(); // Play sound when meeting starts for admin
 console.log('   Set inWaitingRoom to FALSE');
 } else {
 console.log('👤 Not admin - should be in waiting room');
 // Backend's join-room handler already put us in waiting room
 // and notified admins, so we just wait here
 setInWaitingRoom(true); // Explicitly set to true for non-admins
 console.log('   Set inWaitingRoom to TRUE');
 }
 });

 // Backend notifies us when we're in waiting room
 socket.on('waiting-room', ({ message }: { message: string }) => {
 console.log('🚪 In waiting room:', message);
 setInWaitingRoom(true);
 });

 // Waiting room and admission events
 socket.on('join-request', ({ socketId, name }: { socketId: string; name: string }) => {
 console.log(`🚪 JOIN-REQUEST received from ${name} (${socketId})`);
 console.log(`   Current isAdmin:`, isAdmin);
 console.log(`   Current waiting users count:`, waitingUsers.length);
 console.log(`   Current waiting users:`, waitingUsers.map(u => u.name));
 
 setWaitingUsers((prev) => {
 // Check if already in waiting list (prevent duplicates)
 const alreadyWaiting = prev.find(u => u.socketId === socketId);
 if (alreadyWaiting) {
 console.log(`   ⚠️ ${name} already in waiting list, skipping`);
 return prev;
 }
 
 const updated = [...prev, { socketId, name, joinedAt: new Date() }];
 console.log(`   ✅ Added ${name} to waiting list. New count:`, updated.length);
 console.log(`   Waiting users now:`, updated.map(u => u.name));
 return updated;
 });
 
 notificationSounds.playUserJoined();
 toast({
 title: '🚪 Join Request',
 description: `${name} wants to join the meeting`,
 duration: 4000,
 });
 });

 socket.on('admitted', ({ roomId }: { roomId: string }) => {
 console.log('✅ Admitted to meeting!');
 setInWaitingRoom(false);
 notificationSounds.playMeetingStart(); // Play sound when admitted participant enters meeting
 // Backend already added us to the room, no need to emit join-room again
 toast({
 title: '✅ Admitted',
 description: 'You have been admitted to the meeting',
 duration: 2000,
 });
 });

 socket.on('join-denied', ({ message }: { message: string }) => {
 console.log('❌ Join request denied');
 toast({
 title: '❌ Access Denied',
 description: message,
 variant: 'destructive',
 duration: 3000,
 });
 setTimeout(() => {
 navigate('/');
 }, 2000);
 });

 socket.on('permissions', (permissions: { allowAudio: boolean; allowVideo: boolean; allowScreenShare: boolean }) => {
 console.log('🔑 Received permissions:', permissions);
 
 // Store permissions
 setMyPermissions(permissions);
 
 // Force apply permissions
 if (!permissions.allowAudio && localStream) {
 const audioTrack = localStream.getAudioTracks()[0];
 if (audioTrack) {
 audioTrack.enabled = false;
 setIsAudioMuted(true);
 }
 toast({
 title: '🔇 Audio Disabled',
 description: 'The host has disabled your microphone',
 variant: 'destructive',
 duration: 3000,
 });
 }
 
 if (!permissions.allowVideo && localStream) {
 const videoTrack = localStream.getVideoTracks()[0];
 if (videoTrack) {
 videoTrack.enabled = false;
 setIsVideoOff(true);
 }
 toast({
 title: '📹 Video Disabled',
 description: 'The host has disabled your camera',
 variant: 'destructive',
 duration: 3000,
 });
 }
 
 if (!permissions.allowScreenShare && isScreenSharing && screenStreamRef.current) {
 // Stop screen sharing immediately
 const screenTrack = screenStreamRef.current.getVideoTracks()[0];
 if (screenTrack) screenTrack.stop();
 screenStreamRef.current = null;
 setIsScreenSharing(false);
 
 toast({
 title: '🖥️ Screen Share Disabled',
 description: 'The host has disabled screen sharing',
 variant: 'destructive',
 duration: 3000,
 });
 }
 });

 socket.on('user-joined', (participant: any) => {
 console.log(`👤 USER-JOINED event received`);
 console.log(`   Participant:`, participant);
 console.log(`   Current participants count:`, participants.length);
 console.log(`   Current waiting users count:`, waitingUsers.length);
 
 setParticipants((prev) => [...prev, participant]);
 
 // Remove from waiting list if they were there
 setWaitingUsers((prev) => {
 const filtered = prev.filter(u => u.socketId !== participant.id);
 console.log(`   Removed ${participant.name} from waiting list`);
 console.log(`   Waiting users count after removal:`, filtered.length);
 if (filtered.length > 0) {
 console.log(`   Remaining waiting users:`, filtered.map(u => u.name));
 }
 return filtered;
 });
 
 notificationSounds.playUserJoined();
 toast({
 title: '👤 User Joined',
 description: `${participant.name} joined the meeting`,
 duration: 2000,
 });
 });

 socket.on('user-left', ({ id }: { id: string }) => {
 console.log(`👋 User left: ${id}`);
 setParticipants((prev) => {
 const leavingUser = prev.find(p => p.id === id);
 if (leavingUser) {
 notificationSounds.playUserLeft();
 toast({
 title: '👋 User Left',
 description: `${leavingUser.name} left the meeting`,
 duration: 2000, // Reduced from 3000
 });
 }
 return prev.filter(p => p.id !== id);
 });
 });

 // Handle admin transfer when current admin leaves
 socket.on('admin-transferred', ({ message }: { message: string }) => {
 console.log('👑 ADMIN-TRANSFERRED: You are now the admin!');
 setIsAdmin(true);
 toast({
 title: '👑 Host Transfer',
 description: message,
 duration: 3000,
 });
 });

 // Notify about new admin (for other participants)
 socket.on('new-admin', ({ socketId, name }: { socketId: string; name: string }) => {
 console.log(`👑 NEW-ADMIN: ${name} is now the admin`);
 
 // Update the participant's admin status
 setParticipants((prev) => 
 prev.map(p => 
 p.id === socketId 
 ? { ...p, isAdmin: true }
 : { ...p, isAdmin: false } // Remove admin from others
 )
 );
 
 toast({
 title: '👑 New Host',
 description: `${name} is now the meeting host`,
 duration: 2000,
 });
 });

 // CRITICAL: Chat message listener must be in VideoCall, not ChatPanel
 // This ensures messages are received even when chat panel is closed
 socket.on('chat-message', (message) => {
 console.log('💬 Received chat message:', message);
 setMessages((prev) => [...prev, message]);
 // Play notification sound and show preview for messages from others
 if (message.senderId !== socket.id) {
 notificationSounds.playChatMessage();
 // Show chat preview popup if chat is closed
 if (!isChatOpen) {
 toast({
 title: `💬 ${message.senderName}`,
 description: message.text.length > 100 ? message.text.substring(0, 100) + '...' : message.text,
 duration: 3000,
 });
 }
 }
 });

 socket.on('existing-participants', (existingParticipants: any[]) => {
 console.log(`👥 Existing participants: ${existingParticipants.length}`);
 setParticipants(existingParticipants);
 });

 socket.on('kicked-from-meeting', ({ message }: { message: string }) => {
 // Save recording if currently recording
 if (mediaRecorderRef.current && isRecording) {
 mediaRecorderRef.current.stop();
 }
 
 toast({
 title: '⛔ Kicked from Meeting',
 description: message,
 variant: 'destructive',
 duration: 3000,
 });
 setTimeout(() => {
 navigate('/');
 }, 2000);
 });

 socket.on('admin-stop-screenshare', ({ message }: { message: string }) => {
 if (isScreenSharing && screenStreamRef.current) {
 screenStreamRef.current.getTracks().forEach(track => track.stop());
 screenStreamRef.current = null;
 setIsScreenSharing(false);
 
 toast({
 title: '🛑 Screen Share Stopped',
 description: message,
 variant: 'destructive',
 duration: 3000,
 });
 }
 });

 socket.on('participant-audio-toggle', ({ id, isMuted }: { id: string; isMuted: boolean }) => {
 setParticipants((prev) => 
 prev.map(p => p.id === id ? { ...p, isMuted } : p)
 );
 });

 socket.on('participant-video-toggle', ({ id, isVideoOff }: { id: string; isVideoOff: boolean }) => {
 setParticipants((prev) => 
 prev.map(p => p.id === id ? { ...p, isVideoOff } : p)
 );
 });

 socket.on('user-screen-sharing', ({ userId }: { userId: string }) => {
 setParticipants((prev) => 
 prev.map(p => p.id === userId ? { ...p, isScreenSharing: true } : p)
 );
 });

 socket.on('user-stopped-screen-sharing', ({ userId }: { userId: string }) => {
 setParticipants((prev) => 
 prev.map(p => p.id === userId ? { ...p, isScreenSharing: false } : p)
 );
 });

 socket.on('recording-started', () => {
 notificationSounds.playRecordingStart();
 toast({
 title: '🔴 Recording Started',
 description: 'This meeting is now being recorded',
 duration: 3000,
 });
 });

 socket.on('recording-stopped', () => {
 notificationSounds.playRecordingStop();
 toast({
 title: '⏹️ Recording Stopped',
 description: 'Meeting recording has ended',
 duration: 3000,
 });
 });

 socket.on('user-kicked', ({ userId }: { userId: string }) => {
 // Remove kicked user from participants list immediately
 setParticipants((prev) => prev.filter(p => p.id !== userId));
 });

 return () => {
 socket.off('admin-status');
 socket.off('waiting-room');
 socket.off('join-request');
 socket.off('admitted');
 socket.off('join-denied');
 socket.off('permissions');
 socket.off('user-joined');
 socket.off('user-left');
 socket.off('admin-transferred');
 socket.off('new-admin');
 socket.off('chat-message');
 socket.off('existing-participants');
 socket.off('kicked-from-meeting');
 socket.off('admin-stop-screenshare');
 socket.off('participant-audio-toggle');
 socket.off('participant-video-toggle');
 socket.off('user-screen-sharing');
 socket.off('user-stopped-screen-sharing');
 socket.off('recording-started');
 socket.off('recording-stopped');
 socket.off('user-kicked');
 };
 }, [socket, meetingId, setParticipants, setMessages, toast, navigate, isChatOpen]); // Added setMessages and isChatOpen

 // Cleanup on component unmount ONLY - stop all tracks and clear messages
 useEffect(() => {
 return () => {
 console.log('🧹 Cleaning up VideoCall component on UNMOUNT');
 
 // Use refs to get latest values without re-running effect
 const currentLocalStream = localStreamRef.current;
 const currentSocket = socketRef.current;
 const currentScreenStream = screenStreamRef.current;
 const currentMediaRecorder = mediaRecorderRef.current;
 
 // Stop all local stream tracks
 if (currentLocalStream) {
 currentLocalStream.getTracks().forEach(track => {
 console.log(`  Stopping ${track.kind} track`);
 track.stop();
 });
 }
 
 // Stop screen share tracks
 if (currentScreenStream) {
 currentScreenStream.getTracks().forEach(track => {
 console.log(`  Stopping screen share track`);
 track.stop();
 });
 }
 
 // Stop recording if active
 if (currentMediaRecorder && isRecording) {
 console.log('  Stopping recording');
 currentMediaRecorder.stop();
 }
 
 // Disconnect socket to trigger backend cleanup
 if (currentSocket && currentSocket.connected) {
 console.log('  Disconnecting socket on unmount:', currentSocket.id);
 currentSocket.disconnect();
 }
 
 // Clear chat messages for next meeting
 console.log('  Clearing chat messages');
 setMessages([]);
 
 // Clear participants list
 setParticipants([]);
 
 console.log('✅ VideoCall cleanup complete');
 };
 }, []); // EMPTY array - only run on mount/unmount, NOT when dependencies change!

 // Handle browser close/refresh - ensure socket disconnects
 useEffect(() => {
 const handleBeforeUnload = (e: BeforeUnloadEvent) => {
 console.log('⚠️ Browser closing/refreshing - disconnecting socket');
 
 // Use refs to get latest values
 const currentSocket = socketRef.current;
 const currentLocalStream = localStreamRef.current;
 const currentScreenStream = screenStreamRef.current;
 
 if (currentSocket && currentSocket.connected) {
 currentSocket.disconnect();
 }
 
 // Stop all tracks
 if (currentLocalStream) {
 currentLocalStream.getTracks().forEach(track => track.stop());
 }
 
 if (currentScreenStream) {
 currentScreenStream.getTracks().forEach(track => track.stop());
 }
 };
 
 window.addEventListener('beforeunload', handleBeforeUnload);
 
 return () => {
 window.removeEventListener('beforeunload', handleBeforeUnload);
 };
 }, []); // Empty array - handler uses refs to access current values
 
 const toggleAudio = () => {
 if (!localStream) return;

 // Check permissions before allowing unmute
 if (!myPermissions.allowAudio && isAudioMuted) {
 toast({
 title: '🔇 Audio Disabled',
 description: 'The host has disabled your microphone',
 variant: 'destructive',
 duration: 2000,
 });
 return;
 }

 const audioTrack = localStream.getAudioTracks()[0];
 if (audioTrack) {
 audioTrack.enabled = !audioTrack.enabled;
 setIsAudioMuted(!audioTrack.enabled);

 if (socket && meetingId) {
 socket.emit('toggle-audio', { roomId: meetingId, isMuted: !audioTrack.enabled });
 }
 }
 };

 const toggleVideo = async () => {
 if (!localStream) return;

 // Check permissions before allowing camera turn on
 if (!myPermissions.allowVideo && isVideoOff) {
 toast({
 title: '📹 Video Disabled',
 description: 'The host has disabled your camera',
 variant: 'destructive',
 duration: 2000,
 });
 return;
 }

 try {
 if (isVideoOff) {
 // Turn video ON - get new video track
 console.log('🎥 Turning camera ON');
 const newStream = await navigator.mediaDevices.getUserMedia({
 video: {
 width: { ideal: 1280 },
 height: { ideal: 720 },
 aspectRatio: { ideal: 16 / 9 }
 },
 audio: false
 });

 const newVideoTrack = newStream.getVideoTracks()[0];
 const oldVideoTrack = localStream.getVideoTracks()[0];

 // Stop and remove old video track if exists
 if (oldVideoTrack) {
 console.log('  Stopping old video track');
 oldVideoTrack.stop();
 localStream.removeTrack(oldVideoTrack);
 }
 
 // Add new video track to local stream
 localStream.addTrack(newVideoTrack);

 // Update the track in all peer connections WITH renegotiation
 await replaceTrack('video', newVideoTrack, true);

 // Force update by creating a new MediaStream reference
 const updatedStream = new MediaStream([
 ...localStream.getAudioTracks(),
 newVideoTrack
 ]);
 setLocalStream(updatedStream);

 setIsVideoOff(false);
 
 // Play notification sound for turning on
 notificationSounds.playToggleOn();
 
 if (socket && meetingId) {
 socket.emit('toggle-video', { roomId: meetingId, isVideoOff: false });
 }

 toast({
 title: '📹 Camera On',
 description: 'Your camera is now on',
 duration: 2000,
 });
 } else {
 // Turn video OFF - stop the track
 console.log('🎥 Turning camera OFF');
 const videoTrack = localStream.getVideoTracks()[0];
 if (videoTrack) {
 videoTrack.stop();
 localStream.removeTrack(videoTrack);
 
 // Update peer connections to remove video track WITH renegotiation
 await replaceTrack('video', null, true);
 
 setIsVideoOff(true);
 
 // Play notification sound for turning off
 notificationSounds.playToggleOff();
 
 if (socket && meetingId) {
 socket.emit('toggle-video', { roomId: meetingId, isVideoOff: true });
 }

 toast({
 title: '📹 Camera Off',
 description: 'Your camera is now off',
 duration: 2000,
 });
 }
 }
 } catch (error) {
 console.error('Error toggling video:', error);
 toast({
 title: 'Camera Error',
 description: 'Failed to toggle camera',
 variant: 'destructive',
 });
 }
 };

 const toggleScreenShare = async () => {
 if (isScreenSharing) {
 // Stop screen sharing and revert to camera
 console.log('🖥️ Stopping screen share');
 if (screenStreamRef.current) {
 const screenTrack = screenStreamRef.current.getVideoTracks()[0];
 screenTrack.stop();
 screenStreamRef.current = null;
 }
 
 // Revert to camera track if camera is on
 if (!isVideoOff && localStream) {
 const cameraTrack = localStream.getVideoTracks()[0];
 if (cameraTrack) {
 console.log('🎥 Reverting to camera track');
 await replaceTrack('video', cameraTrack, true); // Renegotiate to switch back
 }
 }
 
 setIsScreenSharing(false);
 
 if (socket && meetingId) {
 socket.emit('screen-share-stopped', { roomId: meetingId });
 }

 toast({
 title: '🖥️ Screen Share Stopped',
 description: 'You stopped sharing your screen',
 duration: 2000,
 });
 } else {
 // Check permissions before allowing screen share
 if (!myPermissions.allowScreenShare) {
 toast({
 title: '🖥️ Screen Share Disabled',
 description: 'The host has disabled screen sharing',
 variant: 'destructive',
 duration: 2000,
 });
 return;
 }
 
 // Start screen sharing
 try {
 console.log('🖥️ Starting screen share');
 const screenStream = await navigator.mediaDevices.getDisplayMedia({
 video: true,
 });
 
 screenStreamRef.current = screenStream;
 const screenTrack = screenStream.getVideoTracks()[0];
 
 // Replace video track with screen share track in all peer connections
 // Use renegotiate=true to ensure remote peers get the new track
 await replaceTrack('video', screenTrack, true);
 
 setIsScreenSharing(true);
 
 if (socket && meetingId) {
 socket.emit('screen-share-started', { roomId: meetingId });
 }

 toast({
 title: '🖥️ Screen Sharing',
 description: 'You are now sharing your screen',
 duration: 3000,
 });

 screenTrack.onended = async () => {
 console.log('🖥️ Screen share ended by user');
 setIsScreenSharing(false);
 screenStreamRef.current = null;
 
 // Revert to camera track
 if (!isVideoOff && localStream) {
 const cameraTrack = localStream.getVideoTracks()[0];
 if (cameraTrack) {
 await replaceTrack('video', cameraTrack, true); // Renegotiate when reverting
 }
 }
 
 if (socket && meetingId) {
 socket.emit('screen-share-stopped', { roomId: meetingId });
 }
 toast({
 title: '🖥️ Screen Share Stopped',
 description: 'Screen sharing has ended',
 duration: 2000,
 });
 };
 } catch (error: any) {
 console.error('Error sharing screen:', error);
 
 // Check if user cancelled the screen share dialog
 if (error.name === 'NotAllowedError' || error.name === 'AbortError') {
 // User cancelled - don't show error
 return;
 }
 
 toast({
 title: '❌ Screen Share Error',
 description: 'Could not start screen sharing',
 variant: 'destructive',
 duration: 4000,
 });
 }
 }
 };

 // Admin actions
 const handleAdmitUser = (socketId: string) => {
 if (!socket || !meetingId || !isAdmin) return;
 
 console.log(`✅ Admitting user ${socketId}`);
 const permissions = {
 allowAudio: true,
 allowVideo: true,
 allowScreenShare: true,
 };
 
 socket.emit('admit-user', { roomId: meetingId, socketId, permissions });
 
 // Remove from waiting list
 const user = waitingUsers.find(u => u.socketId === socketId);
 if (user) {
 toast({
 title: 'User Admitted',
 description: `${user.name} has been admitted to the meeting`,
 });
 }
 };

 const handleDenyUser = (socketId: string) => {
 if (!socket || !meetingId || !isAdmin) return;
 
 console.log(`❌ Denying user ${socketId}`);
 socket.emit('deny-user', { roomId: meetingId, socketId });
 
 // Remove from waiting list
 setWaitingUsers((prev) => prev.filter(u => u.socketId !== socketId));
 
 const user = waitingUsers.find(u => u.socketId === socketId);
 if (user) {
 toast({
 title: 'User Denied',
 description: `${user.name} was denied access`,
 variant: 'destructive',
 });
 }
 };

 const handleSetPermission = (socketId: string, permission: 'allowAudio' | 'allowVideo' | 'allowScreenShare', value: boolean) => {
 if (!socket || !meetingId || !isAdmin) return;
 
 console.log(`🔑 Setting ${permission} = ${value} for ${socketId}`);
 
 // Update local state
 setParticipantPermissions((prev) => {
 const updated = new Map(prev);
 const current = updated.get(socketId) || { allowAudio: true, allowVideo: true, allowScreenShare: true };
 updated.set(socketId, { ...current, [permission]: value });
 return updated;
 });
 
 // Emit to server - FIXED: Match backend event name and structure
 socket.emit('set-permission', { 
 roomId: meetingId, 
 targetSocketId: socketId,
 permission: permission,
 value: value
 });
 
 toast({
 title: 'Permissions Updated',
 description: `${permission.replace('allow', '')} ${value ? 'allowed' : 'denied'}`,
 });
 };

 const leaveMeeting = () => {
 console.log('👋 Leaving meeting - cleaning up resources');
 
 // Stop all local stream tracks (camera, microphone)
 if (localStream) {
 localStream.getTracks().forEach(track => {
 console.log(`  Stopping ${track.kind} track`);
 track.stop();
 });
 }
 
 // Stop screen share tracks
 if (screenStreamRef.current) {
 screenStreamRef.current.getTracks().forEach(track => {
 console.log('  Stopping screen share track');
 track.stop();
 });
 }
 
 // Stop recording if active
 if (mediaRecorderRef.current && isRecording) {
 console.log('  Stopping recording');
 mediaRecorderRef.current.stop();
 }
 
 // Clear chat messages and participants for next meeting
 console.log('  Clearing chat messages and participants');
 setMessages([]);
 setParticipants([]);
 
 // Explicitly disconnect socket to trigger backend cleanup
 if (socket) {
 console.log('  Disconnecting socket:', socket.id);
 socket.disconnect();
 }
 
 console.log('✅ Cleanup complete, navigating to home');
 navigate('/');
 };

 if (isConnecting) {
 return (
 <div className="min-h-screen bg-slate-950 flex items-center justify-center">
 <div className="text-center space-y-4">
 <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
 <p className="text-lg text-slate-400">Connecting to meeting...</p>
 </div>
 </div>
 );
 }

 // Show waiting room for non-admin users who haven't been admitted
 if (inWaitingRoom && !isAdmin) {
 return <WaitingRoom />;
 }

 return (
 <div className="h-screen bg-slate-950 flex flex-col overflow-hidden">
 {/* Video Grid - Fixed height to fit screen */}
 <div className="flex-1 relative overflow-hidden">
 <VideoGrid localStream={localStream} screenStream={screenStreamRef.current} remoteStreams={remoteStreams} />
 
 {/* Admin Panel */}
 {isAdmin && isAdminPanelOpen && (
 <div className="absolute right-0 top-0 h-full w-96 bg-slate-900 border-l border-slate-800 shadow-2xl overflow-y-auto">
 <AdminPanel
 waitingUsers={waitingUsers}
 participants={participants}
 participantPermissions={participantPermissions}
 onAdmit={handleAdmitUser}
 onDeny={handleDenyUser}
 onSetPermission={handleSetPermission}
 />
 </div>
 )}
 
 {/* Chat Panel */}
 {isChatOpen && (
 <div className="absolute right-0 top-0 h-full w-80 bg-slate-900 border-l border-slate-800 shadow-2xl">
 <ChatPanel />
 </div>
 )}
 
 {/* Participants Panel */}
 {isParticipantsOpen && (
 <div className="absolute right-0 top-0 h-full w-80 bg-slate-900 border-l border-slate-800 shadow-2xl">
 <ParticipantsList />
 </div>
 )}
 </div>

 {/* Controls Bar - Fixed at bottom */}
 <div className="bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 p-3 z-20 shadow-2xl flex-shrink-0">
 <div className="max-w-7xl mx-auto flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="text-sm text-slate-400">
 Meeting ID: <span className="font-mono text-white font-semibold">{meetingId}</span>
 </div>
 <Button
 variant="ghost"
 size="icon"
 onClick={copyMeetingId}
 className="h-7 w-7 hover:bg-slate-800 rounded-lg"
 title="Copy Meeting ID"
 >
 <Copy className="h-3.5 w-3.5" />
 </Button>
 </div>
 
 <div className="flex items-center gap-3">
 <Button
 variant={isAudioMuted ? 'destructive' : 'secondary'}
 size="icon"
 onClick={toggleAudio}
 className={`h-11 w-11 rounded-full transition-all ${
 isAudioMuted 
 ? 'bg-red-600 hover:bg-red-700 text-white' 
 : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
 }`}
 title={isAudioMuted ? 'Unmute' : 'Mute'}
 >
 {isAudioMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
 </Button>
 
 <Button
 variant={isVideoOff ? 'destructive' : 'secondary'}
 size="icon"
 onClick={toggleVideo}
 className={`h-11 w-11 rounded-full transition-all ${
 isVideoOff 
 ? 'bg-red-600 hover:bg-red-700 text-white' 
 : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
 }`}
 title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
 >
 {isVideoOff ? <VideoOff className="h-4 w-4" /> : <VideoIcon className="h-4 w-4" />}
 </Button>
 
 <Button
 variant={isScreenSharing ? 'default' : 'secondary'}
 size="icon"
 onClick={toggleScreenShare}
 className={`h-11 w-11 rounded-full transition-all ${
 isScreenSharing 
 ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
 : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
 }`}
 title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
 >
 <MonitorUp className="h-4 w-4" />
 </Button>
 
 {}
 {isAdmin && (
 <Button
 variant={isRecording ? 'destructive' : 'secondary'}
 size="icon"
 onClick={isRecording ? stopRecording : startRecording}
 className={`h-11 w-11 rounded-full transition-all ${
 isRecording 
 ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
 : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
 }`}
 title={isRecording ? 'Stop recording' : 'Start recording'}
 >
 {isRecording ? <StopCircle className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
 </Button>
 )}
 
 <Button
 onClick={leaveMeeting}
 className="h-11 px-5 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg shadow-red-500/50 transition-all"
 >
 <PhoneOff className="h-4 w-4 mr-2" />
 Leave
 </Button>
 </div>
 
 <div className="flex items-center gap-3">
 {/* Admin Panel Button - Only for admins */}
 {isAdmin && (
 <Button
 variant={isAdminPanelOpen ? 'default' : 'secondary'}
 size="icon"
 onClick={() => {
 setIsAdminPanelOpen(!isAdminPanelOpen);
 setIsChatOpen(false);
 setIsParticipantsOpen(false);
 }}
 className={`h-11 w-11 rounded-full transition-all relative ${
 isAdminPanelOpen 
 ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
 : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
 }`}
 title="Admin Panel"
 >
 <Users className="h-4 w-4" />
 {waitingUsers.length > 0 && (
 <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full text-xs flex items-center justify-center font-bold">
 {waitingUsers.length}
 </span>
 )}
 </Button>
 )}
 
 <Button
 variant={isChatOpen ? 'default' : 'secondary'}
 size="icon"
 onClick={() => {
 setIsChatOpen(!isChatOpen);
 setIsParticipantsOpen(false);
 setIsAdminPanelOpen(false);
 }}
 className={`h-11 w-11 rounded-full transition-all ${
 isChatOpen 
 ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
 : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
 }`}
 title="Chat"
 >
 <MessageSquare className="h-4 w-4" />
 </Button>
 
 <Button
 variant={isParticipantsOpen ? 'default' : 'secondary'}
 size="icon"
 onClick={() => {
 setIsParticipantsOpen(!isParticipantsOpen);
 setIsChatOpen(false);
 setIsAdminPanelOpen(false);
 }}
 className={`h-11 w-11 rounded-full transition-all ${
 isParticipantsOpen 
 ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
 : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
 }`}
 title="Participants"
 >
 <Users className="h-4 w-4" />
 </Button>
 
 <Button
 variant="secondary"
 size="icon"
 onClick={toggleSounds}
 className={`h-11 w-11 rounded-full transition-all ${
 soundsEnabled 
 ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700' 
 : 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 border border-slate-700/50'
 }`}
 title={soundsEnabled ? 'Mute notifications' : 'Unmute notifications'}
 >
 {soundsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
 </Button>
 </div>
 </div>
 </div>
 </div>
 );
};

export default VideoCall;