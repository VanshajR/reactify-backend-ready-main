import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { UserCheck, UserX, Mic, Video, MonitorUp, Shield } from 'lucide-react';

interface WaitingUser {
  socketId: string;
  name: string;
  joinedAt: Date;
}

interface Participant {
  id: string;
  name: string;
  isAdmin?: boolean;
}

interface Permissions {
  allowAudio: boolean;
  allowVideo: boolean;
  allowScreenShare: boolean;
}

interface AdminPanelProps {
  waitingUsers: WaitingUser[];
  participants: Participant[];
  participantPermissions: Map<string, Permissions>;
  onAdmit: (socketId: string) => void;
  onDeny: (socketId: string) => void;
  onSetPermission: (socketId: string, permission: keyof Permissions, value: boolean) => void;
}

const AdminPanel = ({ 
  waitingUsers, 
  participants,
  participantPermissions,
  onAdmit, 
  onDeny,
  onSetPermission
}: AdminPanelProps) => {
  return (
    <div className="space-y-4">
      {/* Waiting Room Section */}
      {waitingUsers.length > 0 && (
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-yellow-400" />
              </div>
              <div>
                <CardTitle className="text-lg text-white">Waiting Room</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  {waitingUsers.length} {waitingUsers.length === 1 ? 'person' : 'people'} waiting to join
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {waitingUsers.map((user) => (
              <div
                key={user.socketId}
                className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700"
              >
                <div>
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-slate-400">
                    Waiting since {new Date(user.joinedAt).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => onAdmit(user.socketId)}
                    className="bg-green-600 hover:bg-green-700 text-white h-8"
                  >
                    <UserCheck className="w-4 h-4 mr-1" />
                    Admit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDeny(user.socketId)}
                    className="h-8"
                  >
                    <UserX className="w-4 h-4 mr-1" />
                    Deny
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Participant Permissions Section */}
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-white">Participant Permissions</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Manage what participants can do
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {participants
            .filter((p) => !p.isAdmin)
            .map((participant) => {
              const perms = participantPermissions.get(participant.id) || {
                allowAudio: true,
                allowVideo: true,
                allowScreenShare: false,
              };

              return (
                <div
                  key={participant.id}
                  className="p-3 bg-slate-900/50 rounded-lg border border-slate-700"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-white">{participant.name}</p>
                      <Badge variant="secondary" className="text-xs mt-1">
                        Participant
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Mic className="w-3.5 h-3.5 text-blue-400" />
                        <span>Allow Microphone</span>
                      </div>
                      <Switch
                        checked={perms.allowAudio}
                        onCheckedChange={(value) =>
                          onSetPermission(participant.id, 'allowAudio', value)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Video className="w-3.5 h-3.5 text-purple-400" />
                        <span>Allow Camera</span>
                      </div>
                      <Switch
                        checked={perms.allowVideo}
                        onCheckedChange={(value) =>
                          onSetPermission(participant.id, 'allowVideo', value)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <MonitorUp className="w-3.5 h-3.5 text-green-400" />
                        <span>Allow Screen Share</span>
                      </div>
                      <Switch
                        checked={perms.allowScreenShare}
                        onCheckedChange={(value) =>
                          onSetPermission(participant.id, 'allowScreenShare', value)
                        }
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          {participants.filter((p) => !p.isAdmin).length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm">
              No participants yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPanel;
