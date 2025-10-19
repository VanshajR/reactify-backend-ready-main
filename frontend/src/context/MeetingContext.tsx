import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Participant {
 id: string;
 name: string;
 stream?: MediaStream;
 isMuted: boolean;
 isVideoOff: boolean;
 isAdmin?: boolean;
}

export interface Message {
 id: string;
 senderId: string;
 senderName: string;
 text: string;
 timestamp: Date;
}

export interface Meeting {
 id: string;
 title: string;
 createdBy: string;
 scheduledAt?: Date;
 password?: string;
}

interface MeetingContextType {
 currentMeeting: Meeting | null;
 setCurrentMeeting: (meeting: Meeting | null) => void;
 participants: Participant[];
 setParticipants: (participants: Participant[]) => void;
 messages: Message[];
 setMessages: (messages: Message[]) => void;
 localStream: MediaStream | null;
 setLocalStream: (stream: MediaStream | null) => void;
 isAudioMuted: boolean;
 setIsAudioMuted: (muted: boolean) => void;
 isVideoOff: boolean;
 setIsVideoOff: (off: boolean) => void;
 isScreenSharing: boolean;
 setIsScreenSharing: (sharing: boolean) => void;
 isChatOpen: boolean;
 setIsChatOpen: (open: boolean) => void;
 isParticipantsOpen: boolean;
 setIsParticipantsOpen: (open: boolean) => void;
}

const MeetingContext = createContext<MeetingContextType | undefined>(undefined);

export const MeetingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
 const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(null);
 const [participants, setParticipants] = useState<Participant[]>([]);
 const [messages, setMessages] = useState<Message[]>([]);
 const [localStream, setLocalStream] = useState<MediaStream | null>(null);
 const [isAudioMuted, setIsAudioMuted] = useState(false);
 const [isVideoOff, setIsVideoOff] = useState(false);
 const [isScreenSharing, setIsScreenSharing] = useState(false);
 const [isChatOpen, setIsChatOpen] = useState(false);
 const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);

 return (
 <MeetingContext.Provider
 value={{
 currentMeeting,
 setCurrentMeeting,
 participants,
 setParticipants,
 messages,
 setMessages,
 localStream,
 setLocalStream,
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
 }}
 >
 {children}
 </MeetingContext.Provider>
 );
};

export const useMeeting = () => {
 const context = useContext(MeetingContext);
 if (context === undefined) {
 throw new Error('useMeeting must be used within a MeetingProvider');
 }
 return context;
};