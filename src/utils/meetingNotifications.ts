// Browser notification utility for meeting reminders

export class MeetingNotifications {
  private permissionGranted: boolean = false;

  constructor() {
    this.requestPermission();
  }

  // Request notification permission from browser
  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.permissionGranted = true;
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.permissionGranted = permission === 'granted';
      return this.permissionGranted;
    }

    return false;
  }

  // Show notification for upcoming meeting
  showMeetingReminder(meetingTitle: string, meetingId: string, minutesUntil: number) {
    if (!this.permissionGranted) return;

    const notification = new Notification(`Meeting Starting in ${minutesUntil} minutes`, {
      body: `"${meetingTitle}" is about to start. Click to join now.`,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: meetingId,
      requireInteraction: true,
      data: {
        meetingId,
        url: `${window.location.origin}/meeting/${meetingId}`
      }
    });

    notification.onclick = (event) => {
      event.preventDefault();
      const data = (event.target as Notification).data;
      window.open(data.url, '_blank');
      notification.close();
    };

    return notification;
  }

  // Show notification when meeting is starting now
  showMeetingStarting(meetingTitle: string, meetingId: string) {
    if (!this.permissionGranted) return;

    const notification = new Notification(`Meeting Starting NOW!`, {
      body: `"${meetingTitle}" is starting. Click to join immediately.`,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: meetingId,
      requireInteraction: true,
      data: {
        meetingId,
        url: `${window.location.origin}/meeting/${meetingId}`
      }
    });

    notification.onclick = (event) => {
      event.preventDefault();
      const data = (event.target as Notification).data;
      window.open(data.url, '_blank');
      notification.close();
    };

    return notification;
  }

  // Check if notifications are supported and enabled
  isSupported() {
    return 'Notification' in window;
  }

  hasPermission() {
    return this.permissionGranted;
  }
}

// Export singleton instance
export const meetingNotifications = new MeetingNotifications();
