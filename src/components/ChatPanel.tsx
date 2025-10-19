import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Send, MessageCircle } from 'lucide-react';
import { useMeeting } from '@/context/MeetingContext';
import { useSocket } from '@/context/SocketContext';
import { useParams, useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { notificationSounds } from '@/utils/notifications';

const ChatPanel = () => {
 const { setIsChatOpen, messages, setMessages } = useMeeting();
 const { socket } = useSocket();
 const { meetingId } = useParams();
 const [searchParams] = useSearchParams();
 const userName = searchParams.get('name') || 'Guest';
 
 const [messageText, setMessageText] = useState('');
 const messagesEndRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 if (!socket) return;

 socket.on('chat-message', (message) => {
 setMessages((prev) => [...prev, message]);
 // Play notification sound only for messages from others
 if (message.senderId !== socket.id) {
 notificationSounds.playChatMessage();
 }
 });

 return () => {
 socket.off('chat-message');
 };
 }, [socket, setMessages]);

 useEffect(() => {
 messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
 }, [messages]);

 const sendMessage = () => {
 if (!messageText.trim() || !socket || !meetingId) return;

 const message = {
 id: uuidv4(),
 senderId: socket.id || '',
 senderName: userName,
 text: messageText,
 timestamp: new Date(),
 };

 socket.emit('chat-message', { roomId: meetingId, message });
 setMessageText('');
 };

 const handleKeyPress = (e: React.KeyboardEvent) => {
 if (e.key === 'Enter' && !e.shiftKey) {
 e.preventDefault();
 sendMessage();
 }
 };

 const isOwnMessage = (senderId: string) => senderId === socket?.id;

 return (
 <div className="h-full flex flex-col bg-card/50 backdrop-blur-sm">
 {/* Header */}
 <div className="p-5 border-b border-border/50 flex items-center justify-between bg-gradient-to-r from-card/80 to-card/50">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
 <MessageCircle className="h-5 w-5 text-white" />
 </div>
 <div>
 <h3 className="font-semibold text-lg">Chat</h3>
 <p className="text-xs text-muted-foreground">{messages.length} messages</p>
 </div>
 </div>
 <Button
 variant="ghost"
 size="icon"
 onClick={() => setIsChatOpen(false)}
 className="hover:bg-secondary/50 rounded-xl"
 >
 <X className="h-5 w-5" />
 </Button>
 </div>

 {/* Messages */}
 <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
 {messages.length === 0 ? (
 <div className="h-full flex flex-col items-center justify-center text-center py-12">
 <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
 <MessageCircle className="w-8 h-8 text-primary" />
 </div>
 <p className="text-muted-foreground font-medium mb-1">No messages yet</p>
 <p className="text-sm text-muted-foreground/70">Start the conversation!</p>
 </div>
 ) : (
 messages.map((message) => {
 const isMine = isOwnMessage(message.senderId);
 return (
 <div key={message.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} space-y-1 animate-in slide-in-from-bottom-2 fade-in duration-300`}>
 {!isMine && (
 <div className="flex items-center gap-2 px-1">
 <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent to-accent/50 flex items-center justify-center text-xs font-bold text-white">
 {message.senderName[0].toUpperCase()}
 </div>
 <span className="font-semibold text-sm">{message.senderName}</span>
 <span className="text-xs text-muted-foreground">
 {new Date(message.timestamp).toLocaleTimeString([], { 
 hour: '2-digit', 
 minute: '2-digit' 
 })}
 </span>
 </div>
 )}
 <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
 isMine 
 ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/20' 
 : 'bg-secondary/80 backdrop-blur-sm border border-border/50'
 }`}>
 <p className="text-sm leading-relaxed break-words">{message.text}</p>
 {isMine && (
 <span className="text-xs opacity-70 mt-1 block text-right">
 {new Date(message.timestamp).toLocaleTimeString([], { 
 hour: '2-digit', 
 minute: '2-digit' 
 })}
 </span>
 )}
 </div>
 </div>
 );
 })
 )}
 <div ref={messagesEndRef} />
 </div>

 {/* Input */}
 <div className="p-5 border-t border-border/50 bg-card/30">
 <div className="flex gap-3">
 <Input
 value={messageText}
 onChange={(e) => setMessageText(e.target.value)}
 onKeyPress={handleKeyPress}
 placeholder="Type your message..."
 className="flex-1 bg-input/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 h-11 rounded-xl"
 />
 <Button
 onClick={sendMessage}
 disabled={!messageText.trim()}
 className="bg-gradient-to-r from-primary to-accent hover:shadow-glow transition-all h-11 px-6 rounded-xl disabled:opacity-50"
 >
 <Send className="h-4 w-4" />
 </Button>
 </div>
 <p className="text-xs text-muted-foreground mt-2 ml-1">Press Enter to send</p>
 </div>
 </div>
 );
};

export default ChatPanel;