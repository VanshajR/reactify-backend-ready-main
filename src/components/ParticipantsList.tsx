import { Button } from '@/components/ui/button';
import { X, Mic, MicOff, Video, VideoOff, Crown, UserX, MonitorOff } from 'lucide-react';
import { useMeeting } from '@/context/MeetingContext';
import { useSearchParams, useParams } from 'react-router-dom';
import { useSocket } from '@/context/SocketContext';
import { useToast } from '@/hooks/use-toast';

const ParticipantsList = () => {
 const { setIsParticipantsOpen, participants } = useMeeting();
 const [searchParams] = useSearchParams();
 const { meetingId } = useParams();
 const { socket } = useSocket();
 const { toast } = useToast();
 const userName = searchParams.get('name') || 'Guest';
 const isAdmin = searchParams.get('admin') === 'true';

 const kickUser = (participantId: string, participantName: string) => {
 if (!socket || !meetingId || !isAdmin) return;
 
 socket.emit('kick-user', { roomId: meetingId, userId: participantId });
 toast({
 title: 'User Kicked',
 description: `${participantName} has been removed from the meeting`,
 });
 };

 const forceStopScreenShare = (participantId: string, participantName: string) => {
 if (!socket || !meetingId || !isAdmin) return;
 
 socket.emit('force-stop-screenshare', { roomId: meetingId, userId: participantId });
 toast({
 title: 'Screen Share Stopped',
 description: `Stopped ${participantName}'s screen share`,
 });
 };

 return (
 <div className="h-full flex flex-col">
 <div className="p-4 border-b border-border flex items-center justify-between">
 <h3 className="font-semibold">Participants ({participants.length + 1})</h3>
 <Button
 variant="ghost"
 size="icon"
 onClick={() => setIsParticipantsOpen(false)}
 >
 <X className="h-5 w-5" />
 </Button>
 </div>

 <div className="flex-1 overflow-y-auto p-4 space-y-2">
 {}
 <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-semibold">
 {userName.charAt(0).toUpperCase()}
 </div>
 <div>
 <div className="font-medium text-sm flex items-center gap-2">
 {userName} (You)
 {isAdmin && <Crown className="w-4 h-4 text-accent" />}
 </div>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 rounded-full bg-background flex items-center justify-center">
 <Mic className="w-3 h-3" />
 </div>
 <div className="w-6 h-6 rounded-full bg-background flex items-center justify-center">
 <Video className="w-3 h-3" />
 </div>
 </div>
 </div>

 {}
 {participants.map((participant) => (
 <div key={participant.id} className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
 {participant.name.charAt(0).toUpperCase()}
 </div>
 <div>
 <div className="font-medium text-sm flex items-center gap-2">
 {participant.name}
 {participant.isAdmin && <Crown className="w-4 h-4 text-accent" />}
 </div>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
 participant.isMuted ? 'bg-destructive/20' : 'bg-background'
 }`}>
 {participant.isMuted ? (
 <MicOff className="w-3 h-3 text-destructive" />
 ) : (
 <Mic className="w-3 h-3" />
 )}
 </div>
 <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
 participant.isVideoOff ? 'bg-destructive/20' : 'bg-background'
 }`}>
 {participant.isVideoOff ? (
 <VideoOff className="w-3 h-3 text-destructive" />
 ) : (
 <Video className="w-3 h-3" />
 )}
 </div>
 
 {}
 {isAdmin && (
 <div className="flex items-center gap-1 ml-2">
 {participant.isScreenSharing && (
 <Button
 variant="ghost"
 size="icon"
 onClick={() => forceStopScreenShare(participant.id, participant.name)}
 className="h-6 w-6 hover:bg-destructive/20 hover:text-destructive rounded"
 title="Stop their screen share"
 >
 <MonitorOff className="h-3 w-3" />
 </Button>
 )}
 <Button
 variant="ghost"
 size="icon"
 onClick={() => kickUser(participant.id, participant.name)}
 className="h-6 w-6 hover:bg-destructive/20 hover:text-destructive rounded"
 title="Kick user"
 >
 <UserX className="h-3 w-3" />
 </Button>
 </div>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 );
};

export default ParticipantsList;
