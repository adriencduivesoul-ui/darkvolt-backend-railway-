import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStreamApi } from '../hooks/useStreamApi';
import { useWebRTCViewer } from '../hooks/useWebRTCViewer';
import VideoPlayer from '../components/VideoPlayer';

const G = '#39FF14';
const R = '#FF1A1A';

export default function StreamTest() {
  const { user } = useAuth();
  const { status } = useStreamApi();
  const { remoteStream, connected, hasVideo, join, leave } = useWebRTCViewer(
    user?.id || 'test-user', 
    user?.username || 'TestUser'
  );

  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    addLog(`Status: ${status.isLive ? 'LIVE' : 'OFFLINE'}`);
    addLog(`Connected: ${connected}`);
    addLog(`Has Video: ${hasVideo}`);
    addLog(`Remote Stream: ${remoteStream ? 'YES' : 'NO'}`);
    if (remoteStream) {
      addLog(`Tracks: ${remoteStream.getTracks().length} (${remoteStream.getTracks().map(t => t.kind).join(', ')})`);
    }
  }, [status.isLive, connected, hasVideo, remoteStream]);

  return (
    <div className="min-h-screen p-8" style={{ background: '#050505', color: '#e8e8e8' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="font-orbitron text-2xl font-bold mb-6" style={{ color: G }}>
          🎥 Stream Test Page
        </h1>

        {/* Status */}
        <div className="p-4 mb-6" style={{ background: '#0a0a0a', border: `1px solid ${G}22` }}>
          <h2 className="font-orbitron text-lg mb-3" style={{ color: G }}>Status</h2>
          <div className="grid grid-cols-2 gap-4 font-mono text-sm">
            <div>Stream Status: <span style={{ color: status.isLive ? G : R }}>{status.isLive ? 'LIVE' : 'OFFLINE'}</span></div>
            <div>Title: <span style={{ color: '#e8e8e8' }}>{status.title || 'N/A'}</span></div>
            <div>Connected: <span style={{ color: connected ? G : R }}>{connected ? 'YES' : 'NO'}</span></div>
            <div>Has Video: <span style={{ color: hasVideo ? G : R }}>{hasVideo ? 'YES' : 'NO'}</span></div>
            <div>Viewers: <span style={{ color: G }}>{status.viewers}</span></div>
            <div>Streamer: <span style={{ color: '#e8e8e8' }}>{status.streamerName || 'N/A'}</span></div>
          </div>
        </div>

        {/* Video Player */}
        {status.isLive && remoteStream && (
          <div className="mb-6">
            <h2 className="font-orbitron text-lg mb-3" style={{ color: G }}>Video Player</h2>
            <VideoPlayer 
              stream={remoteStream}
              title={status.title}
              viewerCount={status.viewers}
              isLive={true}
            />
          </div>
        )}

        {/* Controls */}
        <div className="p-4 mb-6" style={{ background: '#0a0a0a', border: `1px solid ${G}22` }}>
          <h2 className="font-orbitron text-lg mb-3" style={{ color: G }}>Controls</h2>
          <div className="flex gap-4">
            <button
              onClick={join}
              disabled={connected}
              className="px-4 py-2 font-orbitron text-sm"
              style={{ 
                background: connected ? '#333' : G, 
                color: connected ? '#999' : '#050505',
                border: 'none',
                cursor: connected ? 'default' : 'pointer'
              }}
            >
              Join Stream
            </button>
            <button
              onClick={leave}
              disabled={!connected}
              className="px-4 py-2 font-orbitron text-sm"
              style={{ 
                background: !connected ? '#333' : R, 
                color: !connected ? '#999' : '#fff',
                border: 'none',
                cursor: !connected ? 'default' : 'pointer'
              }}
            >
              Leave Stream
            </button>
          </div>
        </div>

        {/* Logs */}
        <div className="p-4" style={{ background: '#0a0a0a', border: `1px solid ${G}22` }}>
          <h2 className="font-orbitron text-lg mb-3" style={{ color: G }}>Debug Logs</h2>
          <div className="font-mono text-xs space-y-1" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {logs.map((log, i) => (
              <div key={i} style={{ color: '#e8e8e866' }}>{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
