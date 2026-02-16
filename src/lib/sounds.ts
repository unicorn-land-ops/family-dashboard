let alertAudio: HTMLAudioElement | null = null;

function getAlertAudio(): HTMLAudioElement {
  if (!alertAudio) {
    alertAudio = new Audio('/sounds/timer-complete.mp3');
    alertAudio.preload = 'auto';
  }
  return alertAudio;
}

export async function playTimerAlert(): Promise<void> {
  try {
    const audio = getAlertAudio();
    audio.currentTime = 0;
    await audio.play();
  } catch (err) {
    console.warn('[sounds] Timer alert playback blocked or failed:', err);
  }
}
