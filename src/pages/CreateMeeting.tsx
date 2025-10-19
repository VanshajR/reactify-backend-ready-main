import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, ArrowLeft, Video, Lock, Mic, VideoIcon, Mail, X, Clock, Zap, CalendarDays, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { addHours, addDays, addMinutes, format, setHours, setMinutes } from 'date-fns';


const storeUserName = (name: string) => {
 localStorage.setItem('userName', name);
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CreateMeeting = () => {
 const navigate = useNavigate();
 const { toast } = useToast();
 const [loading, setLoading] = useState(false);
 const [meetingMode, setMeetingMode] = useState<'instant' | 'scheduled'>('instant');
 const [emailInput, setEmailInput] = useState('');
 const [participantEmails, setParticipantEmails] = useState<string[]>([]);
 const [formData, setFormData] = useState({
 title: '',
 userName: '',
 scheduledAt: '',
 password: '',
 startWithAudio: true,
 startWithVideo: true,
 duration: '60', // in minutes
 });

 const handleEmailAdd = (e: React.KeyboardEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>) => {
 if (e.type === 'keydown' && (e as React.KeyboardEvent).key !== 'Enter') return;
 
 const email = emailInput.trim().toLowerCase();
 const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 
 if (!email) return;
 
 if (!emailRegex.test(email)) {
 toast({
 title: 'Invalid email',
 description: 'Please enter a valid email address',
 variant: 'destructive',
 });
 return;
 }
 
 if (participantEmails.includes(email)) {
 toast({
 title: 'Duplicate email',
 description: 'This email is already added',
 variant: 'destructive',
 });
 return;
 }
 
 setParticipantEmails([...participantEmails, email]);
 setEmailInput('');
 };

 const handleEmailRemove = (emailToRemove: string) => {
 setParticipantEmails(participantEmails.filter(email => email !== emailToRemove));
 };

 const setQuickTime = (type: 'in1hr' | 'in2hrs' | 'tomorrow9am' | 'nextweek') => {
 const now = new Date();
 let targetDate: Date;
 
 switch(type) {
 case 'in1hr':
 targetDate = addHours(now, 1);
 break;
 case 'in2hrs':
 targetDate = addHours(now, 2);
 break;
 case 'tomorrow9am':
 targetDate = addDays(now, 1);
 targetDate = setHours(setMinutes(targetDate, 0), 9);
 break;
 case 'nextweek':
 targetDate = addDays(now, 7);
 targetDate = setHours(setMinutes(targetDate, 9), 9);
 break;
 }
 
 setFormData({ ...formData, scheduledAt: format(targetDate, "yyyy-MM-dd'T'HH:mm") });
 };

 const handleInstantMeeting = async () => {
 if (!formData.userName.trim()) {
 toast({
 title: 'Name required',
 description: 'Please enter your name to start a meeting',
 variant: 'destructive',
 });
 return;
 }

 setLoading(true);
 try {
 storeUserName(formData.userName);
 const meetingId = uuidv4();
 
 // Get or create user identifier
 let userId = localStorage.getItem('reactify_user_id');
 if (!userId) {
 userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
 localStorage.setItem('reactify_user_id', userId);
 }
 
 const response = await axios.post(`${API_URL}/api/meetings`, {
 meetingId,
 title: formData.title || 'Instant Meeting',
 createdBy: userId, // Use unique ID instead of name
 password: formData.password || undefined,
 });

 toast({
 title: 'Meeting created!',
 description: 'Starting your video call...',
 });

 // Admin status will be verified by backend based on userId matching createdBy
 navigate(`/meeting/${response.data.meetingId}?name=${encodeURIComponent(formData.userName)}&audio=${formData.startWithAudio}&video=${formData.startWithVideo}`);
 } catch (error) {
 toast({
 title: 'Error',
 description: 'Failed to create meeting',
 variant: 'destructive',
 });
 } finally {
 setLoading(false);
 }
 };

 const handleScheduleMeeting = async () => {
 if (!formData.userName.trim() || !formData.title.trim() || !formData.scheduledAt) {
 toast({
 title: 'Missing information',
 description: 'Please fill in all required fields',
 variant: 'destructive',
 });
 return;
 }

 setLoading(true);
 try {
 storeUserName(formData.userName);
 const meetingId = uuidv4();
 
 // Get or create user identifier
 let userId = localStorage.getItem('reactify_user_id');
 if (!userId) {
 userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
 localStorage.setItem('reactify_user_id', userId);
 }
 
 await axios.post(`${API_URL}/api/meetings`, {
 meetingId,
 title: formData.title,
 createdBy: userId, // Use unique ID instead of name
 scheduledAt: new Date(formData.scheduledAt),
 password: formData.password || undefined,
 participantEmails: participantEmails,
 duration: parseInt(formData.duration),
 });

 toast({
 title: 'Meeting scheduled!',
 description: 'Your meeting has been saved',
 });

 navigate('/my-meetings');
 } catch (error) {
 toast({
 title: 'Error',
 description: 'Failed to schedule meeting',
 variant: 'destructive',
 });
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="h-screen bg-slate-950 p-3 md:p-4 overflow-hidden flex flex-col">
 <div className="max-w-3xl mx-auto w-full flex flex-col h-full">
 <Button
 variant="ghost"
 onClick={() => navigate('/')}
 className="mb-3 text-slate-300 hover:text-white hover:bg-slate-800 transition-all self-start"
 >
 <ArrowLeft className="mr-2 h-4 w-4" />
 Back to Home
 </Button>

 <div className="relative group flex-1 overflow-hidden">
 <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition"></div>
 <Card className="relative border-slate-800 backdrop-blur-sm bg-slate-900 shadow-2xl overflow-hidden h-full flex flex-col">
 <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl"></div>
 <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl"></div>
 
 <CardHeader className="relative space-y-2 pb-4 flex-shrink-0">
 <div className="flex items-center gap-3">
 <div className="relative group/icon">
 <div className="absolute -inset-1 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl blur-md opacity-75"></div>
 <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
 <Video className="w-6 h-6 text-white" />
 </div>
 </div>
 <div>
 <CardTitle className="text-2xl text-white">
 Create a Meeting
 </CardTitle>
 <CardDescription className="text-sm mt-1 text-slate-400">
 Start an instant meeting or schedule one for later
 </CardDescription>
 </div>
 </div>
 </CardHeader>
 
 <CardContent className="relative space-y-3.5 pb-4 overflow-y-auto flex-1">
 {/* Meeting Mode Tabs */}
 <div className="flex gap-2 p-1 bg-slate-800/60 rounded-lg border border-slate-700">
 <button
 type="button"
 onClick={() => setMeetingMode('instant')}
 className={`flex-1 py-2.5 px-4 rounded-md text-sm font-semibold transition-all ${
 meetingMode === 'instant'
 ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
 : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
 }`}
 >
 <Zap className="w-4 h-4 inline mr-2" />
 Instant Meeting
 </button>
 <button
 type="button"
 onClick={() => setMeetingMode('scheduled')}
 className={`flex-1 py-2.5 px-4 rounded-md text-sm font-semibold transition-all ${
 meetingMode === 'scheduled'
 ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
 : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
 }`}
 >
 <CalendarIcon className="w-4 h-4 inline mr-2" />
 Schedule for Later
 </button>
 </div>

 <div className="space-y-1.5">
 <Label htmlFor="userName" className="text-xs font-semibold text-slate-200">
 Your Name <span className="text-red-400">*</span>
 </Label>
 <Input
 id="userName"
 placeholder="Enter your name"
 value={formData.userName}
 onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
 className="bg-slate-800/80 border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder:text-slate-500 h-10 text-sm transition-all"
 />
 </div>

 <div className="space-y-1.5">
 <Label htmlFor="title" className="text-xs font-semibold text-slate-200">
 Meeting Title <span className="text-slate-500 font-normal">(Optional)</span>
 </Label>
 <Input
 id="title"
 placeholder="Give your meeting a title"
 value={formData.title}
 onChange={(e) => setFormData({ ...formData, title: e.target.value })}
 className="bg-slate-800/80 border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder:text-slate-500 h-10 text-sm transition-all"
 />
 </div>

 <div className="space-y-1.5">
 <Label htmlFor="password" className="text-xs font-semibold flex items-center gap-1.5 text-slate-200">
 <Lock className="w-3.5 h-3.5 text-purple-400" />
 Password <span className="text-slate-500 font-normal">(Optional)</span>
 </Label>
 <Input
 id="password"
 type="password"
 placeholder="Add a password for security"
 value={formData.password}
 onChange={(e) => setFormData({ ...formData, password: e.target.value })}
 className="bg-slate-800/80 border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder:text-slate-500 h-10 text-sm transition-all"
 />
 </div>

 {/* Audio and Video Preferences */}
 <div className="space-y-2.5 p-3.5 bg-slate-800/40 rounded-lg border border-slate-700/60">
 <p className="text-xs font-semibold text-slate-200 mb-1">Join Settings</p>
 <div className="flex items-center justify-between py-1">
 <div className="flex items-center gap-2">
 <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
 <Mic className="w-3.5 h-3.5 text-blue-400" />
 </div>
 <Label htmlFor="startWithAudio" className="text-sm font-medium text-slate-300 cursor-pointer">
 Microphone
 </Label>
 </div>
 <Switch
 id="startWithAudio"
 checked={formData.startWithAudio}
 onCheckedChange={(checked) => setFormData({ ...formData, startWithAudio: checked })}
 />
 </div>
 <div className="flex items-center justify-between py-1">
 <div className="flex items-center gap-2">
 <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
 <VideoIcon className="w-3.5 h-3.5 text-purple-400" />
 </div>
 <Label htmlFor="startWithVideo" className="text-sm font-medium text-slate-300 cursor-pointer">
 Camera
 </Label>
 </div>
 <Switch
 id="startWithVideo"
 checked={formData.startWithVideo}
 onCheckedChange={(checked) => setFormData({ ...formData, startWithVideo: checked })}
 />
 </div>
 </div>

 {/* Show scheduling options only in scheduled mode */}
 {meetingMode === 'scheduled' && (
 <>
 {/* Email Participants */}
 <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
 <Label htmlFor="emailInput" className="text-xs font-semibold flex items-center gap-1.5 text-slate-200">
 <Mail className="w-3.5 h-3.5 text-blue-400" />
 Invite Participants <span className="text-slate-500 font-normal">(Optional)</span>
 </Label>
 <Input
 id="emailInput"
 type="email"
 placeholder="Enter email and press Enter"
 value={emailInput}
 onChange={(e) => setEmailInput(e.target.value)}
 onKeyDown={handleEmailAdd}
 onBlur={handleEmailAdd}
 className="bg-slate-800/80 border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder:text-slate-500 h-10 text-sm transition-all"
 />
 {participantEmails.length > 0 && (
 <div className="flex flex-wrap gap-2 p-2 bg-slate-800/40 rounded-lg border border-slate-700/60">
 {participantEmails.map((email) => (
 <Badge
 key={email}
 variant="secondary"
 className="bg-blue-500/10 text-blue-300 border-blue-500/30 hover:bg-blue-500/20 text-xs px-2 py-1 flex items-center gap-1.5"
 >
 <Users className="w-3 h-3" />
 {email}
 <button
 onClick={() => handleEmailRemove(email)}
 className="ml-1 hover:text-blue-100 transition-colors"
 >
 <X className="w-3 h-3" />
 </button>
 </Badge>
 ))}
 </div>
 )}
 </div>

 {/* Duration Selector */}
 <div className="space-y-2">
 <Label htmlFor="duration" className="text-xs font-semibold flex items-center gap-1.5 text-slate-200">
 <Clock className="w-3.5 h-3.5 text-purple-400" />
 Duration
 </Label>
 <Select value={formData.duration} onValueChange={(value) => setFormData({ ...formData, duration: value })}>
 <SelectTrigger className="bg-slate-800/80 border-slate-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-white h-10 text-sm">
 <SelectValue />
 </SelectTrigger>
 <SelectContent className="bg-slate-800 border-slate-700">
 <SelectItem value="15" className="text-white hover:bg-slate-700">15 minutes</SelectItem>
 <SelectItem value="30" className="text-white hover:bg-slate-700">30 minutes</SelectItem>
 <SelectItem value="60" className="text-white hover:bg-slate-700">1 hour</SelectItem>
 <SelectItem value="90" className="text-white hover:bg-slate-700">1.5 hours</SelectItem>
 <SelectItem value="120" className="text-white hover:bg-slate-700">2 hours</SelectItem>
 <SelectItem value="180" className="text-white hover:bg-slate-700">3 hours</SelectItem>
 </SelectContent>
 </Select>
 </div>

 {/* Quick Time Selection */}
 <div className="space-y-2">
 <Label className="text-xs font-semibold flex items-center gap-1.5 text-slate-200">
 <Zap className="w-3.5 h-3.5 text-yellow-400" />
 Quick Select
 </Label>
 <div className="grid grid-cols-2 gap-2">
 <Button
 type="button"
 variant="outline"
 onClick={() => setQuickTime('in1hr')}
 className="bg-slate-800/60 border-slate-700 hover:bg-slate-700 hover:border-blue-500/50 text-slate-300 h-9 text-xs"
 >
 In 1 Hour
 </Button>
 <Button
 type="button"
 variant="outline"
 onClick={() => setQuickTime('in2hrs')}
 className="bg-slate-800/60 border-slate-700 hover:bg-slate-700 hover:border-blue-500/50 text-slate-300 h-9 text-xs"
 >
 In 2 Hours
 </Button>
 <Button
 type="button"
 variant="outline"
 onClick={() => setQuickTime('tomorrow9am')}
 className="bg-slate-800/60 border-slate-700 hover:bg-slate-700 hover:border-blue-500/50 text-slate-300 h-9 text-xs"
 >
 Tomorrow 9 AM
 </Button>
 <Button
 type="button"
 variant="outline"
 onClick={() => setQuickTime('nextweek')}
 className="bg-slate-800/60 border-slate-700 hover:bg-slate-700 hover:border-blue-500/50 text-slate-300 h-9 text-xs"
 >
 Next Week
 </Button>
 </div>
 </div>

 {/* Schedule DateTime Input */}
 <div className="space-y-2">
 <Label htmlFor="scheduledAt" className="text-xs font-semibold flex items-center gap-1.5 text-slate-200">
 <CalendarDays className="w-3.5 h-3.5 text-green-400" />
 Date & Time
 </Label>
 <Input
 id="scheduledAt"
 type="datetime-local"
 value={formData.scheduledAt}
 onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
 className="bg-slate-800/80 border-slate-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 text-white h-10 text-sm transition-all"
 />
 
 {/* Preview Selected Time - Only show when date is selected */}
 {formData.scheduledAt && formData.scheduledAt.length > 0 && (
 <div className="mt-3 p-4 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-blue-500/5 rounded-xl border border-blue-500/20 backdrop-blur-sm">
 <div className="flex items-center gap-2 mb-2">
 <CalendarDays className="w-4 h-4 text-blue-400" />
 <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Meeting Preview</p>
 </div>
 <p className="text-base font-bold text-white mb-1">
 {format(new Date(formData.scheduledAt), 'EEEE, MMMM d, yyyy')}
 </p>
 <p className="text-sm text-blue-300 mb-2 flex items-center gap-2">
 <Clock className="w-3.5 h-3.5" />
 {format(new Date(formData.scheduledAt), 'h:mm a')} - {format(addMinutes(new Date(formData.scheduledAt), parseInt(formData.duration)), 'h:mm a')}
 </p>
 <p className="text-xs text-slate-400 flex items-center gap-2">
 <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400"></span>
 Duration: {parseInt(formData.duration) >= 60 ? `${Math.floor(parseInt(formData.duration) / 60)}h ${parseInt(formData.duration) % 60 > 0 ? `${parseInt(formData.duration) % 60}m` : ''}`.trim() : `${formData.duration} minutes`}
 </p>
 </div>
 )}
 </div>
 </>
 )}

 <div className="flex flex-col sm:flex-row gap-3 pt-4">
 {meetingMode === 'instant' ? (
 <Button
 onClick={handleInstantMeeting}
 disabled={loading}
 className="flex-1 h-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/50 hover:shadow-blue-500/75 transition-all text-sm"
 >
 {loading ? 'Creating...' : '🚀 Start Meeting Now'}
 </Button>
 ) : (
 <Button
 onClick={handleScheduleMeeting}
 disabled={loading}
 className="flex-1 h-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/50 hover:shadow-blue-500/75 transition-all text-sm"
 >
 {loading ? 'Scheduling...' : '📅 Schedule Meeting'}
 </Button>
 )}
 <Button
 variant="outline"
 onClick={() => navigate('/')}
 className="flex-1 h-10 border-2 border-slate-700 hover:border-blue-500 bg-slate-800/50 hover:bg-slate-800 text-white rounded-xl transition-all text-sm"
 >
 Cancel
 </Button>
 </div>
 </CardContent>
 </Card>
 </div>
 </div>
 </div>
 );
};

export default CreateMeeting;