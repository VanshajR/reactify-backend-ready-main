import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, Trash2, Copy, ExternalLink, Trash, Clock, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { format, isAfter, isBefore, addMinutes, differenceInMinutes, differenceInHours } from 'date-fns';
import { meetingNotifications } from '@/utils/meetingNotifications';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Meeting {
 _id: string;
 meetingId: string;
 title: string;
 createdBy: string;
 scheduledAt?: string;
 createdAt: string;
}

const MyMeetings = () => {
 const navigate = useNavigate();
 const { toast } = useToast();
 const [meetings, setMeetings] = useState<Meeting[]>([]);
 const [loading, setLoading] = useState(true);
 const [userName, setUserName] = useState('');
 const [notifiedMeetings, setNotifiedMeetings] = useState<Set<string>>(new Set());

 useEffect(() => {
 const storedName = localStorage.getItem('userName');
 const userId = localStorage.getItem('reactify_user_id');
 if (!storedName || !userId) {
 navigate('/');
 return;
 }
 setUserName(storedName);
 fetchMeetings(userId);
 
 // Request notification permission
 meetingNotifications.requestPermission();
 }, []);

 // Check for upcoming meetings every minute
 useEffect(() => {
 if (meetings.length === 0) return;

 const checkUpcomingMeetings = () => {
 const now = new Date();
 
 meetings.forEach((meeting) => {
 if (!meeting.scheduledAt) return;
 
 const meetingTime = new Date(meeting.scheduledAt);
 const minutesUntil = differenceInMinutes(meetingTime, now);
 
 // Notify 15 minutes before
 if (minutesUntil === 15 && !notifiedMeetings.has(`${meeting.meetingId}-15`)) {
 meetingNotifications.showMeetingReminder(meeting.title, meeting.meetingId, 15);
 setNotifiedMeetings(prev => new Set(prev).add(`${meeting.meetingId}-15`));
 }
 
 // Notify 5 minutes before
 if (minutesUntil === 5 && !notifiedMeetings.has(`${meeting.meetingId}-5`)) {
 meetingNotifications.showMeetingReminder(meeting.title, meeting.meetingId, 5);
 setNotifiedMeetings(prev => new Set(prev).add(`${meeting.meetingId}-5`));
 }
 
 // Notify when starting
 if (minutesUntil === 0 && !notifiedMeetings.has(`${meeting.meetingId}-0`)) {
 meetingNotifications.showMeetingStarting(meeting.title, meeting.meetingId);
 setNotifiedMeetings(prev => new Set(prev).add(`${meeting.meetingId}-0`));
 }
 });
 };

 // Check immediately and then every minute
 checkUpcomingMeetings();
 const interval = setInterval(checkUpcomingMeetings, 60000);

 return () => clearInterval(interval);
 }, [meetings, notifiedMeetings]);

 const fetchMeetings = async (userId: string) => {
 try {
 const response = await axios.get(`${API_URL}/api/meetings/user/${userId}`);
 // Sort meetings by scheduledAt (upcoming first)
 const sorted = response.data.sort((a: Meeting, b: Meeting) => {
 if (!a.scheduledAt && !b.scheduledAt) return 0;
 if (!a.scheduledAt) return 1;
 if (!b.scheduledAt) return -1;
 return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
 });
 setMeetings(sorted);
 } catch (error) {
 toast({
 title: 'Error',
 description: 'Failed to fetch meetings',
 variant: 'destructive',
 });
 } finally {
 setLoading(false);
 }
 };

 const copyMeetingLink = (meetingId: string) => {
 const link = `${window.location.origin}/meeting/${meetingId}`;
 navigator.clipboard.writeText(link);
 toast({
 title: 'Link Copied',
 description: 'Meeting link copied to clipboard',
 });
 };

 const deleteMeeting = async (meetingId: string) => {
 try {
 await axios.delete(`${API_URL}/api/meetings/${meetingId}`);
 setMeetings(meetings.filter(m => m.meetingId !== meetingId));
 toast({
 title: 'Meeting Deleted',
 description: 'Meeting has been removed',
 });
 } catch (error) {
 toast({
 title: 'Error',
 description: 'Failed to delete meeting',
 variant: 'destructive',
 });
 }
 };

 const deleteAllMeetings = async () => {
 if (meetings.length === 0) {
 toast({
 title: 'No Meetings',
 description: 'You have no meetings to delete',
 variant: 'destructive',
 });
 return;
 }

 const confirmed = window.confirm(`Are you sure you want to delete all ${meetings.length} meeting(s)? This action cannot be undone.`);
 if (!confirmed) return;

 try {
 // Delete all meetings
 await Promise.all(
 meetings.map(meeting => axios.delete(`${API_URL}/api/meetings/${meeting.meetingId}`))
 );
 
 setMeetings([]);
 toast({
 title: 'All Meetings Deleted',
 description: `Successfully deleted ${meetings.length} meeting(s)`,
 });
 } catch (error) {
 toast({
 title: 'Error',
 description: 'Failed to delete all meetings',
 variant: 'destructive',
 });
 // Refresh the list in case some were deleted
 fetchMeetings(userName);
 }
 };

 // Helper function to get meeting status
 const getMeetingStatus = (meeting: Meeting) => {
 if (!meeting.scheduledAt) {
 return { type: 'instant', label: 'Instant Meeting', color: 'slate' };
 }

 const now = new Date();
 const scheduledTime = new Date(meeting.scheduledAt);
 const minutesUntil = differenceInMinutes(scheduledTime, now);
 const hoursUntil = differenceInHours(scheduledTime, now);

 if (minutesUntil < 0) {
 return { type: 'past', label: 'Past Meeting', color: 'gray' };
 } else if (minutesUntil <= 15) {
 return { type: 'starting-soon', label: 'Starting Soon!', color: 'red' };
 } else if (hoursUntil < 24) {
 return { type: 'today', label: 'Today', color: 'yellow' };
 } else if (hoursUntil < 48) {
 return { type: 'tomorrow', label: 'Tomorrow', color: 'blue' };
 } else {
 return { type: 'upcoming', label: 'Upcoming', color: 'green' };
 }
 };

 // Get time until meeting
 const getTimeUntil = (scheduledAt: string) => {
 const now = new Date();
 const meetingTime = new Date(scheduledAt);
 const minutes = differenceInMinutes(meetingTime, now);
 const hours = differenceInHours(meetingTime, now);

 if (minutes < 0) return null;
 if (minutes < 60) return `in ${minutes} min`;
 if (hours < 24) return `in ${hours} hrs`;
 return null;
 };

 if (loading) {
 return (
 <div className="min-h-screen bg-slate-950 flex items-center justify-center">
 <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-slate-950 p-4 md:p-8">
 <div className="max-w-6xl mx-auto">
 <Button
 variant="ghost"
 onClick={() => navigate('/')}
 className="mb-6 text-slate-300 hover:text-white hover:bg-slate-800"
 >
 <ArrowLeft className="mr-2 h-4 w-4" />
 Back to Home
 </Button>

 <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
 <div>
 <h1 className="text-4xl font-bold mb-2 text-white">My Meetings</h1>
 <p className="text-slate-400">View and manage your scheduled meetings</p>
 </div>
 
 <div className="flex gap-3">
 {meetingNotifications.isSupported() && !meetingNotifications.hasPermission() && (
 <Button
 variant="outline"
 onClick={async () => {
 const granted = await meetingNotifications.requestPermission();
 if (granted) {
 toast({
 title: 'Notifications Enabled',
 description: 'You will receive reminders for upcoming meetings',
 });
 } else {
 toast({
 title: 'Notifications Blocked',
 description: 'Please enable notifications in your browser settings',
 variant: 'destructive',
 });
 }
 }}
 className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
 >
 <Bell className="mr-2 h-4 w-4" />
 Enable Reminders
 </Button>
 )}
 
 {meetings.length > 0 && (
 <Button
 variant="destructive"
 onClick={deleteAllMeetings}
 className="bg-red-600 hover:bg-red-700 text-white"
 >
 <Trash className="mr-2 h-4 w-4" />
 Delete All
 </Button>
 )}
 </div>
 </div>

 {meetings.length === 0 ? (
 <Card className="border-slate-800 bg-slate-900 text-center py-12">
 <CardContent>
 <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-4" />
 <h3 className="text-xl font-semibold mb-2 text-white">No meetings yet</h3>
 <p className="text-slate-400 mb-6">Create your first meeting to get started</p>
 <Button 
 onClick={() => navigate('/create')} 
 className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
 >
 Create Meeting
 </Button>
 </CardContent>
 </Card>
 ) : (
 <div className="grid gap-4">
 {meetings.map((meeting) => {
 const status = getMeetingStatus(meeting);
 const timeUntil = meeting.scheduledAt ? getTimeUntil(meeting.scheduledAt) : null;
 
 return (
 <Card 
 key={meeting._id} 
 className={`border-slate-800 bg-slate-900 hover:border-blue-500/50 transition-all hover:shadow-xl hover:shadow-blue-500/20 ${
 status.type === 'starting-soon' ? 'border-red-500/50 shadow-lg shadow-red-500/20' : ''
 }`}
 >
 <CardHeader>
 <div className="flex items-start justify-between">
 <div className="flex-1">
 <div className="flex items-center gap-2 mb-1">
 <CardTitle className="text-white">{meeting.title}</CardTitle>
 {status.type !== 'instant' && (
 <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
 status.type === 'starting-soon' ? 'bg-red-500/20 text-red-400 animate-pulse' :
 status.type === 'today' ? 'bg-yellow-500/20 text-yellow-400' :
 status.type === 'tomorrow' ? 'bg-blue-500/20 text-blue-400' :
 status.type === 'upcoming' ? 'bg-green-500/20 text-green-400' :
 'bg-gray-500/20 text-gray-400'
 }`}>
 {status.label}
 </span>
 )}
 {timeUntil && (
 <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 flex items-center gap-1">
 <Clock className="w-3 h-3" />
 {timeUntil}
 </span>
 )}
 </div>
 <CardDescription className="mt-2">
 <span className="font-mono text-xs text-slate-400">{meeting.meetingId}</span>
 </CardDescription>
 </div>
 <div className="flex gap-2">
 <Button
 variant="ghost"
 size="icon"
 onClick={() => copyMeetingLink(meeting.meetingId)}
 className="text-slate-400 hover:text-white hover:bg-slate-800"
 >
 <Copy className="h-4 w-4" />
 </Button>
 <Button
 variant="ghost"
 size="icon"
 onClick={() => deleteMeeting(meeting.meetingId)}
 className="text-slate-400 hover:text-red-400 hover:bg-slate-800"
 >
 <Trash2 className="h-4 w-4" />
 </Button>
 </div>
 </div>
 </CardHeader>
 <CardContent>
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div className="text-sm text-slate-400 space-y-1">
 {meeting.scheduledAt && (
 <div className="flex items-center gap-2">
 <Calendar className="h-4 w-4" />
 <span>
 Scheduled: {format(new Date(meeting.scheduledAt), 'PPp')}
 </span>
 </div>
 )}
 <div>Created: {format(new Date(meeting.createdAt), 'PP')}</div>
 </div>
 <Button
 onClick={() => navigate(`/meeting/${meeting.meetingId}?name=${encodeURIComponent(userName)}`)}
 className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/50"
 >
 <ExternalLink className="mr-2 h-4 w-4" />
 Start Meeting
 </Button>
 </div>
 </CardContent>
 </Card>
 );
 })}
 </div>
 )}
 </div>
 </div>
 );
};

export default MyMeetings;