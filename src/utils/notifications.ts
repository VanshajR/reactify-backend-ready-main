// Notification sounds utility for meeting events

class NotificationSounds {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private enabled: boolean = true;

  constructor() {
    // Initialize sound effects
    this.loadSound('join', this.generateTone(800, 0.1, 'sine'));
    this.loadSound('leave', this.generateTone(400, 0.1, 'sine'));
    this.loadSound('message', this.generateTone(600, 0.05, 'square'));
  }

  private generateTone(frequency: number, duration: number, type: OscillatorType = 'sine'): string {
    // Create a simple tone using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    // We'll play this programmatically, so return a placeholder
    return `tone-${frequency}`;
  }

  private loadSound(name: string, source: string) {
    // For custom tones, we'll play them programmatically
    this.sounds.set(name, new Audio());
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
    if (!this.enabled) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }

  playUserJoined() {
    this.playTone(800, 0.15, 'sine');
  }

  playUserLeft() {
    this.playTone(400, 0.15, 'sine');
  }

  playChatMessage() {
    this.playTone(600, 0.08, 'square');
  }

  playToggleOn() {
    // Quick ascending beep for turning something on
    this.playTone(700, 0.05, 'sine');
  }

  playToggleOff() {
    // Quick descending beep for turning something off
    this.playTone(500, 0.05, 'sine');
  }

  playRecordingStart() {
    // Distinctive recording start sound
    setTimeout(() => this.playTone(600, 0.1, 'sine'), 0);
    setTimeout(() => this.playTone(800, 0.1, 'sine'), 100);
    setTimeout(() => this.playTone(1000, 0.15, 'sine'), 200);
  }

  playRecordingStop() {
    // Distinctive recording stop sound
    setTimeout(() => this.playTone(1000, 0.1, 'sine'), 0);
    setTimeout(() => this.playTone(800, 0.1, 'sine'), 100);
    setTimeout(() => this.playTone(600, 0.15, 'sine'), 200);
  }

  playMeetingStart() {
    // Ascending tone
    setTimeout(() => this.playTone(600, 0.1, 'sine'), 0);
    setTimeout(() => this.playTone(800, 0.1, 'sine'), 100);
  }

  playMeetingEnd() {
    // Descending tone
    setTimeout(() => this.playTone(800, 0.1, 'sine'), 0);
    setTimeout(() => this.playTone(600, 0.1, 'sine'), 100);
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  isEnabled() {
    return this.enabled;
  }
}

// Export singleton instance
export const notificationSounds = new NotificationSounds();
