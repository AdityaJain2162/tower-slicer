// Generates 4 short WAV SFX with distinct pitches/envelopes for Tower Slicer.
// Run: node scripts/gen-sounds.js
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'src', 'assets', 'sounds');
fs.mkdirSync(outDir, { recursive: true });

function writeWav(name, { freq, durationMs, decay = 6, type = 'sine', sweepTo = null }) {
  const sampleRate = 44100;
  const numSamples = Math.floor((durationMs / 1000) * sampleRate);
  const bytesPerSample = 2;
  const blockAlign = 1 * bytesPerSample; // mono
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);        // PCM
  buffer.writeUInt16LE(1, 20);          // audio format
  buffer.writeUInt16LE(1, 22);          // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34);         // bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const progress = i / numSamples;
    const f = sweepTo ? freq + (sweepTo - freq) * progress : freq;
    let sample;
    if (type === 'sine') sample = Math.sin(2 * Math.PI * f * t);
    else if (type === 'square') sample = Math.sign(Math.sin(2 * Math.PI * f * t));
    else sample = Math.sin(2 * Math.PI * f * t);
    const env = Math.exp(-decay * progress);
    const amp = Math.max(-1, Math.min(1, sample * env)) * 0.6;
    buffer.writeInt16LE(Math.round(amp * 32767), 44 + i * bytesPerSample);
  }

  fs.writeFileSync(path.join(outDir, name), buffer);
  console.log('wrote', name, (buffer.length / 1024).toFixed(1) + 'KB');
}

writeWav('snap.wav', { freq: 880, durationMs: 90, decay: 8 });
writeWav('combo.wav', { freq: 660, sweepTo: 1320, durationMs: 220, decay: 4 });
writeWav('gameOver.wav', { freq: 140, durationMs: 420, decay: 3 });
writeWav('revive.wav', { freq: 1046, sweepTo: 1568, durationMs: 320, decay: 3 });
