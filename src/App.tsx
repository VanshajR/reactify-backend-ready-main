import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MeetingProvider } from "@/context/MeetingContext";
import { SocketProvider } from "@/context/SocketContext";
import Index from "./pages/Index";
import CreateMeeting from "./pages/CreateMeeting";
import JoinMeeting from "./pages/JoinMeeting";
import VideoCall from "./pages/VideoCall";
import MyMeetings from "./pages/MyMeetings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
 <QueryClientProvider client={queryClient}>
 <TooltipProvider>
 <SocketProvider>
 <MeetingProvider>
 <Toaster />
 <Sonner />
 <BrowserRouter>
 <Routes>
 <Route path="/" element={<Index />} />
 <Route path="/create" element={<CreateMeeting />} />
 <Route path="/join" element={<JoinMeeting />} />
 <Route path="/meeting/:meetingId" element={<VideoCall />} />
 <Route path="/my-meetings" element={<MyMeetings />} />
 <Route path="*" element={<NotFound />} />
 </Routes>
 </BrowserRouter>
 </MeetingProvider>
 </SocketProvider>
 </TooltipProvider>
 </QueryClientProvider>
);

export default App;
