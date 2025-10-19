import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Video, Calendar, Users, Sparkles, Shield, Zap } from 'lucide-react';

const Index = () => {
 const navigate = useNavigate();

 return (
 <div className="min-h-screen bg-slate-950">
 {/* Hero Section with Enhanced Gradients */}
 <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
 {/* Animated Background Blobs */}
 <div className="absolute inset-0 opacity-20">
 <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse"></div>
 <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
 </div>
 
 <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
 <div className="text-center space-y-8">
 {/* Logo with Animation */}
 <div className="inline-block">
 <div className="relative group">
 <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-lg opacity-75 group-hover:opacity-100 transition"></div>
 <div className="relative flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-2xl">
 <Video className="w-12 h-12 text-white" />
 </div>
 </div>
 </div>
 
 {/* Main Heading with Gradient Text */}
 <div className="space-y-4">
 <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white">
 Connect
 <span className="block mt-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
 Anywhere, Anytime
 </span>
 </h1>
 <div className="flex items-center justify-center gap-2 text-blue-400">
 <Sparkles className="w-5 h-5 animate-pulse" />
 <span className="text-sm font-medium tracking-wide uppercase">Powered by WebRTC</span>
 <Sparkles className="w-5 h-5 animate-pulse" />
 </div>
 </div>
 
 <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
 Experience professional video conferencing with crystal-clear audio, 
 HD video, and seamless real-time collaboration.
 </p>

 {/* CTA Buttons with Enhanced Styling */}
 <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
 <Button 
 size="lg"
 onClick={() => navigate('/create')}
 className="group text-lg px-10 py-7 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/75 transition-all duration-300 hover:scale-105"
 >
 <Video className="mr-2 h-6 w-6 group-hover:scale-110 transition-transform" />
 Start Meeting Now
 </Button>
 
 <Button 
 size="lg"
 variant="outline"
 onClick={() => navigate('/join')}
 className="text-lg px-10 py-7 border-2 border-slate-700 hover:border-blue-500 bg-slate-900/50 hover:bg-slate-800 text-white rounded-xl transition-all duration-300 hover:scale-105"
 >
 <Users className="mr-2 h-6 w-6" />
 Join Meeting
 </Button>
 </div>
 </div>
 </div>
 </div>

 {/* Features Section with Glass Effect */}
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
 <div className="text-center mb-16">
 <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
 Why Choose <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">Reactify</span>?
 </h2>
 <p className="text-slate-400 text-lg">
 Everything you need for seamless virtual collaboration
 </p>
 </div>
 
 <div className="grid md:grid-cols-3 gap-8">
 {/* Feature 1 */}
 <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-1">
 <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition"></div>
 <div className="relative">
 <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/50">
 <Zap className="w-8 h-8 text-white" />
 </div>
 <h3 className="text-2xl font-semibold mb-3 text-white group-hover:text-blue-400 transition-colors">
 Lightning Fast
 </h3>
 <p className="text-slate-400 leading-relaxed">
 Experience ultra-low latency video calls with our optimized WebRTC infrastructure.
 </p>
 </div>
 </div>

 {/* Feature 2 */}
 <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-1">
 <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition"></div>
 <div className="relative">
 <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/50">
 <Shield className="w-8 h-8 text-white" />
 </div>
 <h3 className="text-2xl font-semibold mb-3 text-white group-hover:text-purple-400 transition-colors">
 Secure & Private
 </h3>
 <p className="text-slate-400 leading-relaxed">
 End-to-end encrypted meetings with password protection and secure data transmission.
 </p>
 </div>
 </div>

 {/* Feature 3 */}
 <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 hover:border-green-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/20 hover:-translate-y-1">
 <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition"></div>
 <div className="relative">
 <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-600 to-green-400 flex items-center justify-center mb-6 shadow-lg shadow-green-500/50">
 <Users className="w-8 h-8 text-white" />
 </div>
 <h3 className="text-2xl font-semibold mb-3 text-white group-hover:text-green-400 transition-colors">
 Team Collaboration
 </h3>
 <p className="text-slate-400 leading-relaxed">
 Real-time chat, screen sharing, and multi-participant support for effective teamwork.
 </p>
 </div>
 </div>
 </div>
 </div>

 {/* CTA Section with Enhanced Design */}
 <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
 <div className="relative group">
 <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition"></div>
 <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-12 md:p-16 text-center overflow-hidden">
 <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl"></div>
 <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl"></div>
 
 <div className="relative">
 <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
 Ready to Get Started?
 </h2>
 <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
 Create your first meeting now or explore your scheduled meetings.
 </p>
 <div className="flex flex-col sm:flex-row gap-6 justify-center">
 <Button 
 size="lg"
 onClick={() => navigate('/create')}
 className="group text-lg px-10 py-7 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/75 transition-all duration-300 hover:scale-105"
 >
 <Video className="mr-2 h-6 w-6 group-hover:rotate-12 transition-transform" />
 Create Meeting
 </Button>
 <Button 
 size="lg"
 variant="outline"
 onClick={() => navigate('/my-meetings')}
 className="text-lg px-10 py-7 border-2 border-slate-700 hover:border-blue-500 bg-slate-900/50 hover:bg-slate-800 text-white rounded-xl transition-all duration-300"
 >
 <Calendar className="mr-2 h-6 w-6" />
 My Meetings
 </Button>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
};

export default Index;