# 🚀 DarkVolt Audio Extension

**Professional DJ Streaming Audio Capture System**

## 🎯 Overview

DarkVolt Audio Extension is the revolutionary browser extension that enables professional DJ streaming directly from your browser. Capture system audio from YouTube, SoundCloud, Spotify, or any audio source with zero software installation.

## ✨ Features

- 🎵 **System Audio Capture** - Capture any audio playing on your computer
- 🎧 **Professional Quality** - 44.1kHz stereo with no processing
- 🚀 **Zero Installation** - Works directly in your browser
- 🌐 **Cross-Platform** - Chrome, Firefox, Edge support
- ⚡ **Real-Time** - Ultra-low latency streaming
- 🎛️ **Advanced Processing** - Compressor, gain control, monitoring

## 📦 Installation

### Chrome Web Store
1. Visit [Chrome Web Store](https://chrome.google.com/webstore)
2. Search "DarkVolt Audio"
3. Click "Add to Chrome"
4. Grant permissions when prompted

### Firefox Add-ons
1. Visit [Firefox Add-ons](https://addons.mozilla.org)
2. Search "DarkVolt Audio"
3. Click "Add to Firefox"
4. Grant permissions when prompted

## 🎵 Usage

### For YouTube/SoundCloud Mixes
1. Open your mix on YouTube or SoundCloud
2. Open DarkVolt in another tab
3. Click "📦 Activate Audio Pro"
4. Start streaming immediately

### For DJ with Audio Interface
1. Connect your Focusrite Scarlett/Behringer to PC
2. DarkVolt detects it automatically
3. Stream with zero configuration

### For Professional DJs
1. Install DarkVolt Audio Extension
2. Connect your DJ controller/audio interface
3. DarkVolt captures audio natively
4. Professional streaming in 30 seconds

## 🔧 Technical Specifications

- **Sample Rate**: 44.1kHz (CD Quality)
- **Channels**: Stereo
- **Bit Depth**: 16-bit
- **Latency**: < 10ms
- **Codec**: PCM (uncompressed)
- **Processing**: No auto-gain, no echo cancellation

## 🛠️ Development

### Building the Extension
```bash
# Clone the repository
git clone https://github.com/darkvolt/audio-extension
cd audio-extension

# Build for production
npm run build

# Load in Chrome
# 1. Go to chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked"
# 4. Select the dist folder
```

### File Structure
```
extension/
├── manifest.json          # Extension manifest
├── background.js           # Service worker
├── content.js             # Content script bridge
├── popup.html             # Extension popup UI
├── popup.js               # Popup logic
├── inject.js              # Injected API
├── icons/                 # Extension icons
└── README.md              # This file
```

## 🔒 Privacy & Security

- **No data collection** - All processing happens locally
- **Permission minimal** - Only desktop capture access
- **Open source** - Fully auditable code
- **No telemetry** - No usage tracking

## 🎯 Use Cases

### 🎧 Radio Stations
- Stream pre-recorded shows
- Capture from any audio software
- Professional quality broadcasting

### 🎵 DJs & Producers
- Stream live DJ sets
- Capture from DAW software
- Studio-quality monitoring

### 🎮 Gamers
- Stream game audio with music
- Capture from multiple sources
- Low-latency performance

### 📺 Content Creators
- Add high-quality audio to streams
- Mix multiple audio sources
- Professional production

## 🚀 API Reference

### DarkVoltAudio API
```javascript
// Capture system audio
const stream = await window.DarkVoltAudio.captureSystemAudio();

// Stop capture
await window.DarkVoltAudio.stopStream();

// Check status
const status = await window.DarkVoltAudio.getStatus();
```

### DarkVoltAudioPro API
```javascript
// Capture with professional settings
const result = await window.DarkVoltAudioPro.captureSystemAudio({
  sampleRate: 44100,
  channelCount: 2,
  autoGainControl: false,
  echoCancellation: false,
  noiseSuppression: false
});

// Apply effects
window.DarkVoltAudioPro.applyEffect('volume', { volume: 0.8 });

// Monitor audio levels
window.DarkVoltAudioPro.startMonitoring((data) => {
  console.log('Volume:', data.volume);
  console.log('Peaks:', data.peaks);
});
```

## 🐛 Troubleshooting

### Extension Not Working
1. Check if extension is enabled
2. Grant desktop capture permissions
3. Restart browser
4. Check DarkVolt console logs

### Audio Quality Issues
1. Disable audio processing in browser
2. Check system audio settings
3. Ensure 44.1kHz sample rate
4. Close other audio applications

### Permission Errors
1. Click extension icon in toolbar
2. Grant desktop capture permission
3. Restart DarkVolt
4. Try again

## 🆘 Support

- **Documentation**: [docs.darkvolt.com](https://docs.darkvolt.com)
- **Issues**: [GitHub Issues](https://github.com/darkvolt/audio-extension/issues)
- **Community**: [Discord](https://discord.gg/darkvolt)
- **Email**: support@darkvolt.com

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🎉 Credits

- **DarkVolt Team** - Development & Design
- **VB-Audio** - Virtual Audio Technology
- **WebRTC Community** - Audio Streaming Standards

---

**🚀 DarkVolt Audio - Revolutionizing DJ Streaming Since 2024**
