import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Users, Lock, Mic, Video as VideoIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const JoinMeeting = () => {
 const navigate = useNavigate();
 const { toast } = useToast();
 const [loading, setLoading] = useState(false);
 const [formData, setFormData] = useState({
 meetingId: '',
 userName: '',
 password: '',
 startWithAudio: true,
 startWithVideo: true,
 });

 const handleJoinMeeting = async () => {
 if (!formData.meetingId.trim() || !formData.userName.trim()) {
 toast({
 title: 'Missing information',
 description: 'Please enter meeting ID and your name',
 variant: 'destructive',
 });
 return;
 }

 setLoading(true);
 try {
 // Trim whitespace from meeting ID
 const cleanMeetingId = formData.meetingId.trim();
 
 const meetingResponse = await axios.get(`${API_URL}/api/meetings/${cleanMeetingId}`);
 
 
 if (meetingResponse.data.password) {
 if (!formData.password) {
 toast({
 title: 'Password required',
 description: 'This meeting is password protected',
 variant: 'destructive',
 });
 setLoading(false);
 return;
 }

 await axios.post(`${API_URL}/api/meetings/${cleanMeetingId}/verify`, {
 password: formData.password,
 });
 }

 toast({
 title: 'Joining meeting...',
 description: 'Connecting to the video call',
 });

 navigate(`/meeting/${cleanMeetingId}?name=${encodeURIComponent(formData.userName)}&audio=${formData.startWithAudio}&video=${formData.startWithVideo}`);
 } catch (error: any) {
 const message = error.response?.data?.error || 'Failed to join meeting';
 toast({
 title: 'Error',
 description: message,
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
 className="mb-3 text-slate-300 hover:text-white hover:bg-slate-800 transition-all self-start">
 <ArrowLeft className="mr-2 h-4 w-4" />
 Back to Home
 </Button>

 <div className="relative group flex-1 overflow-hidden">
 <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition"></div>
 <Card className="relative border-slate-800 backdrop-blur-sm bg-slate-900 shadow-2xl overflow-hidden h-full flex flex-col">
 <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl"></div>
 <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl"></div>
 
 <CardHeader className="relative space-y-2 pb-4 flex-shrink-0">
 <div className="flex items-center gap-3">
 <div className="relative group/icon">
 <div className="absolute -inset-1 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl blur-md opacity-75"></div>
 <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
 <Users className="w-6 h-6 text-white" />
 </div>
 </div>
 <div>
 <CardTitle className="text-2xl text-white">
 Join a Meeting
 </CardTitle>
 <CardDescription className="text-sm mt-1 text-slate-400">
 Enter the meeting ID to join an existing call
 </CardDescription>
 </div>
 </div>
 </CardHeader>
 
 <CardContent className="relative space-y-3.5 pb-4 overflow-y-auto flex-1">
 <div className="space-y-1.5">
 <Label htmlFor="meetingId" className="text-xs font-semibold text-slate-200">
 Meeting ID <span className="text-red-400">*</span>
 </Label>
 <Input
 id="meetingId"
 placeholder="e.g., abc123-def456-ghi789"
 value={formData.meetingId}
 onChange={(e) => setFormData({ ...formData, meetingId: e.target.value })}
 className="bg-slate-800/80 border-slate-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-white placeholder:text-slate-500 h-10 text-sm font-mono tracking-wide transition-all"
 />
 <p className="text-xs text-slate-500">
 Enter the meeting ID shared with you
 </p>
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
 className="bg-slate-800/80 border-slate-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-white placeholder:text-slate-500 h-10 text-sm transition-all"
 />
 </div>

 <div className="space-y-1.5">
 <Label htmlFor="password" className="text-xs font-semibold flex items-center gap-1.5 text-slate-200">
 <Lock className="w-3.5 h-3.5 text-purple-400" />
 Password <span className="text-slate-500 font-normal">(If required)</span>
 </Label>
 <Input
 id="password"
 type="password"
 placeholder="Enter meeting password"
 value={formData.password}
 onChange={(e) => setFormData({ ...formData, password: e.target.value })}
 className="bg-slate-800/80 border-slate-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-white placeholder:text-slate-500 h-10 text-sm transition-all"
 />
 <p className="text-xs text-slate-500">
 Only if the meeting is password protected
 </p>
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

 <div className="flex flex-col sm:flex-row gap-3 pt-4">
 <Button
 onClick={handleJoinMeeting}
 disabled={loading}
 className="flex-1 h-10 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/50 hover:shadow-purple-500/75 transition-all text-sm"
 >
 {loading ? 'Joining...' : '🎥 Join Meeting'}
 </Button>
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

export default JoinMeeting;