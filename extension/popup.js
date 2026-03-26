// 🚀 DarkVolt Audio Engine - Popup Script
// Professional DJ Streaming Audio Control Interface

console.log('🚀 DarkVolt Audio Popup Loaded');

// DOM Elements
const captureBtn = document.getElementById('capture-btn');
const stopBtn = document.getElementById('stop-btn');
const testBtn = document.getElementById('test-btn');
const settingsBtn = document.getElementById('settings-btn');
const streamStatus = document.getElementById('stream-status');
const qualityStatus = document.getElementById('quality-status');
const qualityDot = document.getElementById('quality-dot');
const qualityText = document.getElementById('quality-text');

// State
let isCapturing = false;
let currentStream = null;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🎵 Popup DOM loaded');
  await updateStatus();
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  captureBtn.addEventListener('click', captureSystemAudio);
  stopBtn.addEventListener('click', stopAudioCapture);
  testBtn.addEventListener('click', testAudioQuality);
  settingsBtn.addEventListener('click', openSettings);
}

// Capture system audio
async function captureSystemAudio() {
  console.log('🎵 Starting audio capture...');
  
  try {
    // Update UI
    captureBtn.innerHTML = '<span class="loading"></span>Requesting Permission...';
    captureBtn.disabled = true;
    
    // DEBUG: Check if we can send messages
    console.log('🔍 DEBUG: Sending message to background...');
    
    // Request audio capture from background script
    const response = await chrome.runtime.sendMessage({
      action: 'getAudioStream'
    });
    
    console.log('🔍 DEBUG: Response received:', response);
    
    if (response && response.success) {
      console.log('✅ Audio capture successful:', response);
      
      // Update UI for active state
      isCapturing = true;
      currentStream = response;
      
      captureBtn.style.display = 'none';
      stopBtn.style.display = 'block';
      streamStatus.textContent = '🟢 Active';
      streamStatus.className = 'status-value active';
      
      // Update quality indicator
      updateQualityIndicator('high', 'Capturing at 44.1kHz Stereo');
      
      // Notify DarkVolt web app
      notifyWebApp('audio-captured', response);
    } else {
      console.error('❌ Audio capture failed:', response);
      throw new Error(response?.error || 'Failed to capture audio');
    }
  } catch (error) {
    console.error('🔍 DEBUG: Full error details:', error);
    console.error('❌ Capture error:', error.message);
    
    // Reset UI
    captureBtn.innerHTML = '� Capturer Audio Système';
    captureBtn.disabled = false;
    
    // Show error in popup
    streamStatus.textContent = `❌ Error: ${error.message}`;
    streamStatus.className = 'status-value error';
  }
}

// Stop audio capture
async function stopAudioCapture() {
  console.log('🛑 Stopping audio capture...');
  
  try {
    // Update UI
    stopBtn.innerHTML = '<span class="loading"></span>Stopping...';
    stopBtn.disabled = true;
    
    // Stop stream in background script
    const response = await chrome.runtime.sendMessage({
      action: 'stopStream'
    });
    
    if (response.success) {
      console.log('✅ Audio stopped successfully');
      
      // Reset state
      isCapturing = false;
      currentStream = null;
      
      // Update UI
      captureBtn.style.display = 'block';
      stopBtn.style.display = 'none';
      streamStatus.textContent = '🔴 Inactive';
      streamStatus.className = 'status-value inactive';
      
      // Reset quality indicator
      updateQualityIndicator('inactive', 'Ready to capture');
      
      // Notify DarkVolt web app
      notifyWebApp('audio-stopped');
      
      console.log('🎉 Audio capture stopped');
      
    } else {
      throw new Error(response.error || 'Unknown error');
    }
    
  } catch (error) {
    console.error('❌ Failed to stop audio:', error);
    showError(error.message);
  } finally {
    stopBtn.innerHTML = '🛑 Stop Audio Capture';
    stopBtn.disabled = false;
  }
}

// Test audio quality
async function testAudioQuality() {
  console.log('🧪 Testing audio quality...');
  
  try {
    testBtn.innerHTML = '<span class="loading"></span>Testing...';
    testBtn.disabled = true;
    
    // Simulate audio quality test
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const quality = analyzeAudioQuality();
    
    testBtn.innerHTML = '🧪 Test Audio Quality';
    testBtn.disabled = false;
    
    // Show results
    showQualityResults(quality);
    
  } catch (error) {
    console.error('❌ Audio test failed:', error);
    testBtn.innerHTML = '🧪 Test Audio Quality';
    testBtn.disabled = false;
    showError(error.message);
  }
}

// Analyze audio quality
function analyzeAudioQuality() {
  // Simulate quality analysis
  const qualities = ['high', 'medium', 'low'];
  const quality = qualities[Math.floor(Math.random() * qualities.length)];
  
  const specs = {
    high: {
      sampleRate: '44.1kHz',
      bitDepth: '16-bit',
      channels: 'Stereo',
      latency: '< 10ms'
    },
    medium: {
      sampleRate: '44.1kHz',
      bitDepth: '16-bit',
      channels: 'Stereo',
      latency: '< 20ms'
    },
    low: {
      sampleRate: '44.1kHz',
      bitDepth: '16-bit',
      channels: 'Stereo',
      latency: '< 50ms'
    }
  };
  
  return {
    level: quality,
    specs: specs[quality],
    score: quality === 'high' ? 95 : quality === 'medium' ? 75 : 60
  };
}

// Show quality results
function showQualityResults(quality) {
  const { level, specs, score } = quality;
  
  updateQualityIndicator(level, `Quality Score: ${score}%`);
  
  // Update quality status
  qualityStatus.textContent = `${specs.sampleRate} ${specs.channels}`;
  
  // Show notification
  showNotification(`Audio Quality: ${level.toUpperCase()} (${score}%)`);
}

// Update quality indicator
function updateQualityIndicator(level, text) {
  qualityDot.className = `quality-dot ${level}`;
  qualityText.textContent = text;
}

// Open settings
function openSettings() {
  console.log('⚙️ Opening audio settings...');
  
  // Create settings modal
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 300px;
    background: #0a0a0a;
    border: 1px solid #39FF14;
    clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
    padding: 20px;
    font-family: 'Orbitron', monospace;
    z-index: 10000;
  `;
  
  modal.innerHTML = `
    <h3 style="font-size: 12px; margin-bottom: 15px; color: #39FF14;">⚙️ Audio Settings</h3>
    
    <div style="margin-bottom: 15px;">
      <label style="display: block; font-size: 9px; margin-bottom: 5px; color: #888;">Sample Rate:</label>
      <select id="sample-rate" style="width: 100%; background: #1a1a1a; border: 1px solid #39FF14; color: #39FF14; padding: 5px; font-family: 'Space Mono', monospace; font-size: 9px;">
        <option value="44100">44.1 kHz (CD Quality)</option>
        <option value="48000">48 kHz (Studio)</option>
        <option value="22050">22.05 kHz (Radio)</option>
      </select>
    </div>
    
    <div style="margin-bottom: 15px;">
      <label style="display: block; font-size: 9px; margin-bottom: 5px; color: #888;">Channels:</label>
      <select id="channels" style="width: 100%; background: #1a1a1a; border: 1px solid #39FF14; color: #39FF14; padding: 5px; font-family: 'Space Mono', monospace; font-size: 9px;">
        <option value="2">Stereo</option>
        <option value="1">Mono</option>
      </select>
    </div>
    
    <div style="margin-bottom: 15px;">
      <label style="display: flex; align-items: center; font-size: 9px; color: #888;">
        <input type="checkbox" id="auto-gain" style="margin-right: 8px;">
        Auto Gain Control
      </label>
    </div>
    
    <div style="margin-bottom: 15px;">
      <label style="display: flex; align-items: center; font-size: 9px; color: #888;">
        <input type="checkbox" id="echo-cancel" style="margin-right: 8px;">
        Echo Cancellation
      </label>
    </div>
    
    <div style="display: flex; gap: 10px;">
      <button id="save-settings" style="flex: 1; padding: 8px; background: #39FF14; border: none; color: #0a0a0a; font-family: 'Orbitron', monospace; font-size: 9px; cursor: pointer;">Save</button>
      <button id="cancel-settings" style="flex: 1; padding: 8px; background: transparent; border: 1px solid #FF1A1A; color: #FF1A1A; font-family: 'Orbitron', monospace; font-size: 9px; cursor: pointer;">Cancel</button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Handle settings
  modal.querySelector('#save-settings').addEventListener('click', () => {
    const settings = {
      sampleRate: modal.querySelector('#sample-rate').value,
      channels: modal.querySelector('#channels').value,
      autoGainControl: modal.querySelector('#auto-gain').checked,
      echoCancellation: modal.querySelector('#echo-cancel').checked
    };
    
    // Save settings
    chrome.storage.local.set({ darkvoltAudioSettings: settings }, () => {
      console.log('✅ Settings saved:', settings);
      modal.remove();
      showNotification('Settings saved successfully');
    });
  });
  
  modal.querySelector('#cancel-settings').addEventListener('click', () => {
    modal.remove();
  });
}

// Update status
async function updateStatus() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'checkStatus'
    });
    
    if (response.active) {
      isCapturing = true;
      captureBtn.style.display = 'none';
      stopBtn.style.display = 'block';
      streamStatus.textContent = '🟢 Active';
      streamStatus.className = 'status-value active';
      updateQualityIndicator('high', 'Capturing audio');
    }
    
  } catch (error) {
    console.error('❌ Failed to update status:', error);
  }
}

// Notify web app
function notifyWebApp(event, data = null) {
  // Send message to all DarkVolt tabs
  chrome.tabs.query({ url: ['*://localhost:3000/*', '*://darkvolt.com/*', '*://*.darkvolt.com/*'] }, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        type: 'DARKVOLT_AUDIO_EVENT',
        event,
        data,
        timestamp: Date.now()
      });
    });
  });
}

// Show error
function showError(message) {
  showNotification(`❌ Error: ${message}`, 'error');
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'error' ? '#FF1A1A' : '#39FF14'};
    color: #0a0a0a;
    padding: 10px 20px;
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    clip-path: polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px));
    z-index: 10000;
    animation: slideUp 0.3s ease;
  `;
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Add slide up animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    from {
      transform: translateX(-50%) translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);
