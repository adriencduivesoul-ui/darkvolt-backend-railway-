// 🚀 DarkVolt Audio Engine - Content Script
// Bridge between DarkVolt web app and extension

console.log('🚀 DarkVolt Audio - Content Script Loaded');

// Communication bridge
const DarkVoltAudioBridge = {
  // Send message to background script
  sendToBackground(action, data = {}) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action,
        ...data,
        source: 'darkvolt-web-app',
        timestamp: Date.now()
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  },
  
  // Capture system audio
  async captureSystemAudio() {
    try {
      console.log('🎵 Requesting system audio capture...');
      const response = await this.sendToBackground('getAudioStream');
      
      if (response.success) {
        console.log('✅ Audio capture successful:', response);
        return response;
      } else {
        throw new Error(response.error || 'Unknown error');
      }
    } catch (error) {
      console.error('❌ Audio capture failed:', error);
      throw error;
    }
  },
  
  // Stop audio stream
  async stopStream() {
    try {
      const response = await this.sendToBackground('stopStream');
      console.log('🛑 Stream stopped:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to stop stream:', error);
      throw error;
    }
  },
  
  // Check extension status
  async getStatus() {
    try {
      const response = await this.sendToBackground('checkStatus');
      return response;
    } catch (error) {
      console.error('❌ Status check failed:', error);
      return { active: false, connectedTab: null };
    }
  }
};

// Inject DarkVolt Audio API into the page
const script = document.createElement('script');
script.textContent = `
// 🚀 DarkVolt Audio API - Injected into page
window.DarkVoltAudio = {
  async captureSystemAudio() {
    return new Promise((resolve, reject) => {
      window.postMessage({
        type: 'DARKVOLT_AUDIO_CAPTURE',
        id: Math.random().toString(36).substr(2, 9)
      }, '*');
      
      const handler = (event) => {
        if (event.data.type === 'DARKVOLT_AUDIO_RESPONSE') {
          window.removeEventListener('message', handler);
          if (event.data.success) {
            resolve(event.data.data);
          } else {
            reject(new Error(event.data.error));
          }
        }
      };
      
      window.addEventListener('message', handler);
    });
  },
  
  async stopStream() {
    return new Promise((resolve, reject) => {
      window.postMessage({
        type: 'DARKVOLT_AUDIO_STOP',
        id: Math.random().toString(36).substr(2, 9)
      }, '*');
      
      const handler = (event) => {
        if (event.data.type === 'DARKVOLT_AUDIO_STOP_RESPONSE') {
          window.removeEventListener('message', handler);
          if (event.data.success) {
            resolve(event.data.data);
          } else {
            reject(new Error(event.data.error));
          }
        }
      };
      
      window.addEventListener('message', handler);
    });
  },
  
  async getStatus() {
    return new Promise((resolve) => {
      window.postMessage({
        type: 'DARKVOLT_AUDIO_STATUS',
        id: Math.random().toString(36).substr(2, 9)
      }, '*');
      
      const handler = (event) => {
        if (event.data.type === 'DARKVOLT_AUDIO_STATUS_RESPONSE') {
          window.removeEventListener('message', handler);
          resolve(event.data.data);
        }
      };
      
      window.addEventListener('message', handler);
    });
  }
};

console.log('🚀 DarkVolt Audio API injected into page');
`;
(document.head || document.documentElement).appendChild(script);

// Handle messages from injected script
window.addEventListener('message', async (event) => {
  if (event.data.type?.startsWith('DARKVOLT_AUDIO_')) {
    console.log('🎵 Bridge message received:', event.data);
    
    try {
      let response;
      
      switch (event.data.type) {
        case 'DARKVOLT_AUDIO_CAPTURE':
          response = await DarkVoltAudioBridge.captureSystemAudio();
          window.postMessage({
            type: 'DARKVOLT_AUDIO_RESPONSE',
            success: true,
            data: response,
            id: event.data.id
          }, '*');
          break;
          
        case 'DARKVOLT_AUDIO_STOP':
          response = await DarkVoltAudioBridge.stopStream();
          window.postMessage({
            type: 'DARKVOLT_AUDIO_STOP_RESPONSE',
            success: true,
            data: response,
            id: event.data.id
          }, '*');
          break;
          
        case 'DARKVOLT_AUDIO_STATUS':
          response = await DarkVoltAudioBridge.getStatus();
          window.postMessage({
            type: 'DARKVOLT_AUDIO_STATUS_RESPONSE',
            success: true,
            data: response,
            id: event.data.id
          }, '*');
          break;
      }
    } catch (error) {
      console.error('❌ Bridge error:', error);
      
      // Send error response
      window.postMessage({
        type: event.data.type.replace('DARKVOLT_AUDIO_', 'DARKVOLT_AUDIO_') + '_RESPONSE',
        success: false,
        error: error.message,
        id: event.data.id
      }, '*');
    }
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleAudioPanel') {
    // Toggle audio panel visibility
    const panel = document.querySelector('.darkvolt-audio-panel');
    if (panel) {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    } else {
      // Create audio panel
      createAudioPanel();
    }
    sendResponse({ success: true });
  }
});

// Create floating audio panel
function createAudioPanel() {
  const panel = document.createElement('div');
  panel.className = 'darkvolt-audio-panel';
  panel.innerHTML = \`
    <style>
      .darkvolt-audio-panel {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 320px;
        background: #0a0a0a;
        border: 1px solid #39FF14;
        clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px));
        padding: 20px;
        font-family: 'Orbitron', monospace;
        color: #39FF14;
        z-index: 10000;
        box-shadow: 0 0 20px rgba(57, 255, 20, 0.3);
      }
      
      .darkvolt-audio-panel h3 {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        margin: 0 0 15px 0;
        color: #39FF14;
      }
      
      .darkvolt-audio-panel button {
        width: 100%;
        padding: 10px;
        background: transparent;
        border: 1px solid #39FF14;
        color: #39FF14;
        font-family: 'Orbitron', monospace;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        cursor: pointer;
        clip-path: polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px));
        transition: all 0.3s ease;
      }
      
      .darkvolt-audio-panel button:hover {
        background: #39FF14;
        color: #0a0a0a;
        box-shadow: 0 0 15px rgba(57, 255, 20, 0.5);
      }
      
      .darkvolt-audio-panel .status {
        font-size: 9px;
        margin: 10px 0;
        color: #888;
      }
      
      .darkvolt-audio-panel .close {
        position: absolute;
        top: 10px;
        right: 10px;
        background: none;
        border: none;
        color: #FF1A1A;
        cursor: pointer;
        font-size: 16px;
        width: auto;
        padding: 0;
      }
    </style>
    
    <button class="close">×</button>
    <h3>🚀 DarkVolt Audio</h3>
    <button id="capture-audio">🎵 Capture System Audio</button>
    <button id="stop-audio" style="display:none; margin-top:10px;">🛑 Stop Audio</button>
    <div class="status" id="audio-status">Ready to capture audio...</div>
  \`;
  
  document.body.appendChild(panel);
  
  // Handle panel interactions
  panel.querySelector('.close').addEventListener('click', () => {
    panel.remove();
  });
  
  panel.querySelector('#capture-audio').addEventListener('click', async () => {
    const statusEl = panel.querySelector('#audio-status');
    const captureBtn = panel.querySelector('#capture-audio');
    const stopBtn = panel.querySelector('#stop-audio');
    
    statusEl.textContent = '🎵 Capturing audio...';
    captureBtn.style.display = 'none';
    
    try {
      const response = await window.DarkVoltAudio.captureSystemAudio();
      statusEl.textContent = '✅ Audio captured successfully!';
      stopBtn.style.display = 'block';
      
      // Notify DarkVolt web app
      window.postMessage({
        type: 'DARKVOLT_AUDIO_CAPTURED',
        data: response
      }, '*');
      
    } catch (error) {
      statusEl.textContent = '❌ Error: ' + error.message;
      captureBtn.style.display = 'block';
    }
  });
  
  panel.querySelector('#stop-audio').addEventListener('click', async () => {
    const statusEl = panel.querySelector('#audio-status');
    const captureBtn = panel.querySelector('#capture-audio');
    const stopBtn = panel.querySelector('#stop-audio');
    
    try {
      await window.DarkVoltAudio.stopStream();
      statusEl.textContent = '🛑 Audio stopped';
      captureBtn.style.display = 'block';
      stopBtn.style.display = 'none';
      
      // Notify DarkVolt web app
      window.postMessage({
        type: 'DARKVOLT_AUDIO_STOPPED'
      }, '*');
      
    } catch (error) {
      statusEl.textContent = '❌ Error stopping audio: ' + error.message;
    }
  });
}

console.log('🚀 DarkVolt Audio Bridge ready');
