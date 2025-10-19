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
 } = useMeeting();

 const userName = searchParams.get('name') || 'Guest';
 const isAdmin = searchParams.get('admin') === 'true';
 const startWithAudio = searchParams.get('audio') !== 'false'; // default true
 const startWithVideo = searchParams.get('video') !== 'false'; // default true
 const [isConnecting, setIsConnecting] = useState(true);
 const [meetingValid, setMeetingValid] = useState(false);
 const [soundsEnabled, setSoundsEnabled] = useState(true);
 const [isRecording, setIsRecording] = useState(false);
 const screenStreamRef = useRef<MediaStream | null>(null);
 const mediaRecorderRef = useRef<MediaRecorder | null>(null);
 const recordedChunksRef = useRef<Blob[]>([]);

 // Initialize WebRTC with remote streams
 const { remoteStreams } = useWebRTC(socket, localStream, meetingId || '');

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

 
 if (socket && meetingId) {
 if (isAdmin) {
 socket.emit('create-room', { roomId: meetingId, userName, isAdmin: true });
 } else {
 socket.emit('join-room', { roomId: meetingId, userName });
 }
 }
 } catch (error) {
 console.error('Error accessing media devices:', error);
 toast({
 title: 'Media Error',
 description: 'Could not access camera or microphone',
 variant: 'destructive',
 });
 setIsConnecting(false);
 }
 };

 initMedia();

 return () => {
 if (localStream) {
 localStream.getTracks().forEach(track => track.stop());
 }
 if (screenStreamRef.current) {
 screenStreamRef.current.getTracks().forEach(track => track.stop());
 }
 };
 }, [meetingValid, socket, meetingId, userName, isAdmin, toast, navigate]);

 useEffect(() => {
 if (!socket || !meetingId) return;

 socket.on('user-joined', (participant: any) => {
 setParticipants((prev) => [...prev, participant]);
 notificationSounds.playUserJoined();
 toast({
 title: 'User Joined',
 description: `${participant.name} joined the meeting`,
 });
 });

 socket.on('user-left', ({ id }: { id: string }) => {
 setParticipants((prev) => prev.filter(p => p.id !== id));
 notificationSounds.playUserLeft();
 });

 socket.on('existing-participants', (existingParticipants: any[]) => {
 setParticipants(existingParticipants);
 });

 socket.on('kicked-from-meeting', ({ message }: { message: string }) => {
 // Save recording if currently recording
 if (mediaRecorderRef.current && isRecording) {
 mediaRecorderRef.current.stop();
 }
 
 toast({
 title: 'Kicked from Meeting',
 description: message,
 variant: 'destructive',
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
 title: 'Screen Share Stopped',
 description: message,
 variant: 'destructive',
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
 title: 'Recording Started',
 description: 'This meeting is now being recorded',
 });
 });

 socket.on('recording-stopped', () => {
 notificationSounds.playRecordingStop();
 toast({
 title: 'Recording Stopped',
 description: 'Meeting recording has ended',
 });
 });

 socket.on('user-kicked', ({ userId }: { userId: string }) => {
 // Remove kicked user from participants list immediately
 setParticipants((prev) => prev.filter(p => p.id !== userId));
 });

 return () => {
 socket.off('user-joined');
 socket.off('user-left');
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
 }, [socket, meetingId, setParticipants, toast, navigate, isScreenSharing]);

 const toggleAudio = () => {
 if (localStream) {
 const audioTrack = localStream.getAudioTracks()[0];
 if (audioTrack) {
 audioTrack.enabled = !audioTrack.enabled;
 setIsAudioMuted(!audioTrack.enabled);
 
 // Play notification sound
 if (!audioTrack.enabled) {
 notificationSounds.playToggleOff();
 } else {
 notificationSounds.playToggleOn();
 }
 
 if (socket && meetingId) {
 socket.emit('toggle-audio', { roomId: meetingId, isMuted: !audioTrack.enabled });
 }
 }
 }
 };

 const toggleVideo = async () => {
 if (!localStream) return;

 try {
 if (isVideoOff) {
 // Turn video ON - get new video track
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

 // Replace the old video track with the new one
 if (oldVideoTrack) {
 localStream.removeTrack(oldVideoTrack);
 oldVideoTrack.stop();
 }
 localStream.addTrack(newVideoTrack);

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
 title: 'Camera On',
 description: 'Your camera is now on',
 });
 } else {
 // Turn video OFF - stop the track
 const videoTrack = localStream.getVideoTracks()[0];
 if (videoTrack) {
 videoTrack.stop();
 localStream.removeTrack(videoTrack);
 
 setIsVideoOff(true);
 
 // Play notification sound for turning off
 notificationSounds.playToggleOff();
 
 if (socket && meetingId) {
 socket.emit('toggle-video', { roomId: meetingId, isVideoOff: true });
 }

 toast({
 title: 'Camera Off',
 description: 'Your camera is now off',
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
 // Stop screen sharing
 if (screenStreamRef.current) {
 screenStreamRef.current.getTracks().forEach(track => track.stop());
 screenStreamRef.current = null;
 }
 setIsScreenSharing(false);
 
 if (socket && meetingId) {
 socket.emit('screen-share-stopped', { roomId: meetingId });
 }

 toast({
 title: 'Screen Share Stopped',
 description: 'You stopped sharing your screen',
 });
 } else {
 // Start screen sharing
 try {
 const screenStream = await navigator.mediaDevices.getDisplayMedia({
 video: true,
 });
 
 screenStreamRef.current = screenStream;
 setIsScreenSharing(true);
 
 if (socket && meetingId) {
 socket.emit('screen-share-started', { roomId: meetingId });
 }

 toast({
 title: 'Screen Sharing',
 description: 'You are now sharing your screen',
 });

 screenStream.getVideoTracks()[0].onended = () => {
 setIsScreenSharing(false);
 screenStreamRef.current = null;
 if (socket && meetingId) {
 socket.emit('screen-share-stopped', { roomId: meetingId });
 }
 toast({
 title: 'Screen Share Stopped',
 description: 'Screen sharing has ended',
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
 title: 'Screen Share Error',
 description: 'Could not start screen sharing',
 variant: 'destructive',
 });
 }
 }
 };

 const leaveMeeting = () => {
 if (localStream) {
 localStream.getTracks().forEach(track => track.stop());
 }
 if (screenStreamRef.current) {
 screenStreamRef.current.getTracks().forEach(track => track.stop());
 }
 if (mediaRecorderRef.current && isRecording) {
 mediaRecorderRef.current.stop();
 }
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

 return (
 <div className="h-screen bg-slate-950 flex flex-col overflow-hidden">
 {/* Video Grid - Fixed height to fit screen */}
 <div className="flex-1 relative overflow-hidden">
 <VideoGrid localStream={localStream} screenStream={screenStreamRef.current} remoteStreams={remoteStreams} />
 
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
 <Button
 variant={isChatOpen ? 'default' : 'secondary'}
 size="icon"
 onClick={() => {
 setIsChatOpen(!isChatOpen);
 setIsParticipantsOpen(false);
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