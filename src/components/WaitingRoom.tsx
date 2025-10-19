import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, UserCheck } from 'lucide-react';

const WaitingRoom = () => {
  return (
    <div className="h-screen bg-slate-950 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-slate-800 bg-slate-900">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-white animate-pulse" />
          </div>
          <CardTitle className="text-2xl text-white">Waiting for Host</CardTitle>
          <CardDescription className="text-slate-400">
            The meeting host will let you in soon
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
              <UserCheck className="w-5 h-5 text-blue-400" />
              <div className="text-sm text-slate-300">
                Please wait while the host admits you to the meeting
              </div>
            </div>
            <div className="flex justify-center">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WaitingRoom;
