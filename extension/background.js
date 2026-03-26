// 🚀 DarkVolt Audio Engine - Background Service Worker
// Professional DJ Streaming Audio Capture System

console.log('🚀 DarkVolt Audio Engine - Background Service Started');

// Audio stream management
let activeStream = null;
let connectedTab = null;

// Listen for messages from popup and content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('🔍 DEBUG: Background message received:', request);
  console.log('🔍 DEBUG: Sender:', sender);
  
  switch (request.action) {
    case 'getAudioStream':
      console.log('🔍 DEBUG: Capturing system audio...');
      captureSystemAudio(sendResponse);
      return true; // Keep message channel open
      
    case 'stopStream':
      stopAudioStream();
      sendResponse({ success: true });
      break;
      
    case 'checkStatus':
      sendResponse({ 
        active: activeStream !== null,
        connectedTab: connectedTab?.id
      });
      break;
      
    default:
      console.warn('🚫 Unknown action:', request.action);
  }
});

// Alternative: Try direct audio capture first
async function tryDirectAudioCapture() {
  try {
    console.log('🔍 DEBUG: Trying direct audio capture...');
    
    // Get all audio devices
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices.filter(device => device.kind === 'audioinput');
    
    console.log('🎵 Available audio inputs:', audioInputs);
    
    // Try to get stereo mix or default audio
    for (const device of audioInputs) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: device.deviceId,
            autoGainControl: false,
            echoCancellation: false,
            noiseSuppression: false,
            sampleRate: 44100,
            channelCount: 2
          }
        });
        
        console.log('✅ Direct audio capture successful with:', device.label);
        return stream;
      } catch (e) {
        console.log('❌ Failed with device:', device.label, e);
      }
    }
    
    throw new Error('No audio device worked');
  } catch (error) {
    console.error('❌ Direct audio capture failed:', error);
    return null;
  }
}

// Capture system audio with professional quality
async function captureSystemAudio(sendResponse) {
  console.log('🔍 DEBUG: captureSystemAudio function called');
  
  try {
    console.log('🎵 Starting system audio capture...');
    
    // First try direct audio capture
    console.log('🔍 DEBUG: Trying direct audio capture first...');
    const directStream = await tryDirectAudioCapture();
    
    if (directStream) {
      console.log('✅ Direct audio capture worked!');
      activeStream = directStream;
      sendResponse({ 
        success: true, 
        stream: 'direct-capture',
        message: 'Audio capture successful via direct device'
      });
      return;
    }
    
    // Fallback to desktop capture
    console.log('🔍 DEBUG: Fallback to desktop capture...');
    const streamId = await new Promise((resolve, reject) => {
      chrome.desktopCapture.chooseDesktopMedia(
        ['audio'],
        (id) => {
          console.log('🔍 DEBUG: Desktop capture callback, id:', id);
          if (id) {
            resolve(id);
          } else {
            reject(new Error('❌ Veuillez sélectionner une source audio pour continuer'));
          }
        }
      );
    });
    
    console.log('🎯 Stream ID obtained:', streamId);
    
    // Get the media stream
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: streamId,
        autoGainControl: false,
        echoCancellation: false,
        noiseSuppression: false,
        sampleRate: 44100,
        channelCount: 2
      },
      video: false
    });
    
    // Store the stream
    activeStream = stream;
    
    // Get audio tracks info
    const audioTracks = stream.getAudioTracks();
    console.log('🎵 Audio tracks captured:', audioTracks.length);
    
    // Send success response with stream info
    sendResponse({
      success: true,
      streamId: streamId,
      tracks: audioTracks.map(track => ({
        id: track.id,
        label: track.label,
        enabled: track.enabled,
        settings: track.getSettings()
      })),
      quality: {
        sampleRate: 44100,
        channelCount: 2,
        autoGainControl: false,
        echoCancellation: false,
        noiseSuppression: false
      }
    });
    
    console.log('✅ DarkVolt Audio - Stream captured successfully');
    
  } catch (error) {
    console.error('❌ DarkVolt Audio - Capture failed:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// Stop active audio stream
function stopAudioStream() {
  if (activeStream) {
    activeStream.getTracks().forEach(track => {
      track.stop();
      console.log('🛑 Audio track stopped:', track.label);
    });
    activeStream = null;
    console.log('🎵 DarkVolt Audio - All streams stopped');
  }
}

// Cleanup on extension unload
chrome.runtime.onSuspend.addListener(() => {
  stopAudioStream();
  console.log('🚀 DarkVolt Audio - Extension suspended');
});

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('🚀 DarkVolt Audio Extension installed:', details.reason);
  
  if (details.reason === 'install') {
    console.log('🎉 Welcome to DarkVolt Audio Engine!');
  }
});

// Handle extension action click
chrome.action.onClicked.addListener((tab) => {
  console.log('🖱️ Extension icon clicked on tab:', tab.id);
  
  // Open popup or send message to content script
  chrome.tabs.sendMessage(tab.id, {
    action: 'toggleAudioPanel'
  }).catch(() => {
    // Content script not loaded, open popup
    chrome.action.openPopup();
  });
});
