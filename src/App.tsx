import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, LayoutDashboard, Tv, Image as ImageIcon, 
  Monitor, Smartphone, CheckCircle, RefreshCw, 
  X, Check, User, ExternalLink, ArrowRight, Zap,
  Globe, Shield, QrCode, Sparkles
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import io from 'socket.io-client';
import Peer from 'peerjs';

const SERVER_URL = (import.meta.env.VITE_SERVER_URL || `http://${window.location.hostname}:5000`).toString().trim();
const socket = io(SERVER_URL);

// --- Navigation ---
const Navbar = () => {
  const { pathname } = useLocation();
  if (pathname === '/client') return null;

  return (
    <nav className="navbar">
      <Link to="/" className="text-xl font-black tracking-tighter flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Camera size={18} className="text-white" />
        </div>
        <span className="hidden sm:inline">CL.</span>
      </Link>
      <div className="nav-links">
        <Link to="/gallery">Gallery</Link>
        <Link to="/admin">Admin</Link>
      </div>
      <Link to="/client" className="btn btn-primary !py-2 !px-4 rounded-full text-[10px] sm:text-xs">
        <Camera size={14} /> Open Camera
      </Link>
    </nav>
  );
};

// --- Pages ---

const Home = () => {
  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center w-full"
      >
        <div className="status-badge mb-6 text-primary">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          GLOBAL SESSION ACTIVE
        </div>
        <h1 className="hero-title">
          LIVE <span className="text-gradient">SYNERGY.</span>
        </h1>
        <p className="hero-subtitle">
          Turn your smartphone into a high-end live camera. 
          Capture, share, and see your vision live in the community gallery.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 w-full max-w-sm sm:max-w-none">
          <Link to="/client" className="btn btn-primary px-10 py-5 text-lg">
            Join as Photographer <Camera size={20} />
          </Link>
          <Link to="/gallery" className="btn btn-secondary px-10 py-5 text-lg">
            Explore Gallery
          </Link>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full">
        <div className="glass-card flex flex-col items-center text-center gap-4 hover:border-primary/30 transition-all group">
          <div className="p-4 bg-primary/10 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Zap /></div>
          <h3 className="text-lg font-bold">Real-time</h3>
          <p className="text-xs text-text-secondary">Sub-second latency streaming for instant visual interaction.</p>
        </div>
        <div className="glass-card flex flex-col items-center text-center gap-4 hover:border-primary/30 transition-all group">
          <div className="p-4 bg-primary/10 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Globe /></div>
          <h3 className="text-lg font-bold">Universal</h3>
          <p className="text-xs text-text-secondary">No app required. Works perfectly in any mobile browser.</p>
        </div>
        <div className="glass-card flex flex-col items-center text-center gap-4 hover:border-primary/30 transition-all group">
          <div className="p-4 bg-primary/10 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Shield /></div>
          <h3 className="text-lg font-bold">Curated</h3>
          <p className="text-xs text-text-secondary">Community-driven content verified by live moderators.</p>
        </div>
      </div>
    </div>
  );
};

const ClientCamera = () => {
  const [name, setName] = useState('');
  const [joined, setJoined] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [success, setSuccess] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [peer, setPeer] = useState<Peer | null>(null);

  const join = async () => {
    try {
      const ms = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: true });
      setStream(ms);
      if (videoRef.current) videoRef.current.srcObject = ms;
      const p = new Peer();
      p.on('open', (id) => socket.emit('register-streamer', id));
      setPeer(p);
      setJoined(true);
    } catch (e) { alert('Camera access required.'); }
  };

  const capture = () => {
    const canvas = document.createElement('canvas');
    const video = videoRef.current!;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob(async (b) => {
      const fd = new FormData();
      fd.append('photo', b!, 'c.jpg');
      fd.append('userName', name);
      setCapturing(true);
      await fetch(`${SERVER_URL}/upload`, { method: 'POST', body: fd });
      setCapturing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 'image/jpeg', 0.8);
  };

  if (!joined) {
    return (
      <div className="page-container h-screen flex items-center justify-center p-6 !pt-0">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card max-w-sm text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-right from-primary to-accent" />
          <div className="w-20 h-20 bg-primary/10 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-inner">
            <User size={40} className="text-primary" />
          </div>
          <h2 className="text-3xl font-black mb-2">Identify</h2>
          <p className="text-text-secondary text-sm mb-10">Enter your name to start sharing live moments with the world.</p>
          
          <div className="space-y-6">
            <input 
              className="input-field"
              placeholder="Full Name"
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
            />
            <button disabled={!name} onClick={join} className="btn btn-primary w-full py-5 text-lg shadow-2xl">
              Connect Camera <ArrowRight size={20} />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mobile-fullscreen">
      <video ref={videoRef} autoPlay playsInline muted className="camera-preview" />
      
      {/* Top Overlay */}
      <div className="absolute top-8 left-6 right-6 flex justify-between items-start pointer-events-none">
        <div className="status-badge pointer-events-auto">
          <div className={`w-2 h-2 rounded-full ${streaming ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
          <span className="font-black uppercase text-[10px]">{name} • {streaming ? 'LIVE' : 'READY'}</span>
        </div>
        <button onClick={() => window.location.reload()} className="p-3 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl pointer-events-auto">
          <RefreshCw size={24} className="text-white" />
        </button>
      </div>

      {/* Success Notification */}
      <AnimatePresence>
        {success && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="absolute top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="bg-emerald-500 text-white px-8 py-3 rounded-full font-black text-xs shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center gap-3">
              <CheckCircle size={18} /> CAPTURE SENT FOR REVIEW
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls */}
      <div className="camera-controls">
        <button 
          onClick={() => { if (!streaming) { peer?.call('admin-dashboard', stream!); setStreaming(true); } else window.location.reload(); }}
          className={`p-5 rounded-2xl backdrop-blur-xl border ${streaming ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-white/5 border-white/10 text-white'}`}
        >
          <Tv size={32} />
        </button>

        <button onClick={capture} disabled={capturing} className="shutter-btn group">
           <div className="w-16 h-16 rounded-full border-2 border-slate-900 flex items-center justify-center">
             {capturing && <RefreshCw size={32} className="text-primary animate-spin" />}
             {!capturing && <div className="w-12 h-12 bg-slate-900/5 rounded-full" />}
           </div>
        </button>

        <div className="w-[72px] h-[72px] flex items-center justify-center opacity-30">
          <Sparkles className="text-white" />
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [photos, setPhotos] = useState<any[]>([]);
  const [streamerId, setStreamerId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const clientUrl = `${window.location.origin}/client`;

  useEffect(() => {
    fetch(`${SERVER_URL}/photos`).then(r => r.json()).then(setPhotos);
    const p = new Peer('admin-dashboard');
    p.on('call', (call) => {
      call.answer(); 
      call.on('stream', (s) => { if (videoRef.current) videoRef.current.srcObject = s; });
    });
    socket.on('new-photo', (ph) => setPhotos(v => [ph, ...v]));
    socket.on('photo-approved', (u) => setPhotos(v => v.map(p => p.id === u.id ? u : p)));
    socket.on('photo-removed', (id) => setPhotos(v => v.filter(p => p.id !== id)));
    socket.on('streamer-list', (l) => setStreamerId(l[0] || null));
    return () => { p.destroy(); socket.off('new-photo'); socket.off('photo-approved'); socket.off('photo-removed'); socket.off('streamer-list'); };
  }, []);

  return (
    <div className="page-container">
      <div className="w-full mb-12 flex flex-col md:flex-row justify-between items-end gap-8">
        <div>
          <h2 className="text-4xl font-black mb-2">Control <span className="text-primary">Hub</span></h2>
          <p className="text-text-secondary">Monitor live feeds and moderate community captures.</p>
        </div>
        <div className="glass-card p-4 !w-auto flex items-center gap-6 border-primary/20 bg-primary/5">
           <div className="text-right">
             <p className="text-[10px] font-black text-primary uppercase">Remote Access</p>
             <p className="text-xs font-mono">{clientUrl}</p>
           </div>
           <div className="p-2 bg-white rounded-xl">
             <QRCodeSVG value={clientUrl} size={64} fgColor="#020617" />
           </div>
        </div>
      </div>

      <div className="admin-grid mb-12">
        <div className="flex flex-col gap-4">
          <div className="video-container glass-card !p-0 overflow-hidden">
            <div className="absolute top-6 left-6 z-10">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest border ${streamerId ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                {streamerId ? 'LIVE BROADCAST' : 'SIGNAL LOST'}
              </span>
            </div>
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            {!streamerId && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700">
                <Monitor size={64} strokeWidth={1} />
                <p className="mt-4 font-bold text-sm">Waiting for connection...</p>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="glass-card p-6 flex-1 flex flex-col justify-center gap-6">
            <div>
              <p className="text-sm text-text-secondary mb-1">Queue Size</p>
              <p className="text-5xl font-black">{photos.filter(p => p.status === 'pending').length}</p>
            </div>
            <div className="h-px bg-white/5" />
            <div>
              <p className="text-sm text-text-secondary mb-1">Published</p>
              <p className="text-5xl font-black text-primary">{photos.filter(p => p.status === 'approved').length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full">
        <h3 className="text-2xl font-black mb-8">Media Queue</h3>
        <div className="gallery-grid">
          <AnimatePresence mode="popLayout">
            {photos.map((p) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={p.id}
                className={`glass-card !p-0 overflow-hidden relative aspect-square ${p.status === 'approved' ? 'border-primary' : ''}`}
              >
                <img src={p.url} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-slate-950/80 opacity-0 hover:opacity-100 transition-opacity p-6 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${p.status === 'approved' ? 'bg-primary text-white' : 'bg-amber-500 text-black'}`}>
                      {p.status}
                    </span>
                    <button onClick={() => fetch(`${SERVER_URL}/photo/${p.id}`, { method: 'DELETE' })} className="text-slate-400 hover:text-red-400"><X size={20}/></button>
                  </div>
                  <div>
                    <p className="font-black text-xl">{p.userName}</p>
                    <p className="text-[10px] text-text-secondary mb-4">{new Date(p.timestamp).toLocaleTimeString()}</p>
                    {p.status === 'pending' && (
                      <button onClick={() => fetch(`${SERVER_URL}/approve/${p.id}`, { method: 'POST' })} className="btn btn-primary w-full justify-center py-2 text-sm">Approve</button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const PublicGallery = () => {
  const [photos, setPhotos] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${SERVER_URL}/photos/approved`).then(r => r.json()).then(setPhotos);
    socket.on('photo-approved', (p) => setPhotos(v => [p, ...v]));
    socket.on('photo-removed', (id) => setPhotos(v => v.filter(p => p.id !== id)));
    return () => { socket.off('photo-approved'); socket.off('photo-removed'); };
  }, []);

  return (
    <div className="page-container">
      <header className="text-center mb-16">
        <h1 className="hero-title">LIVE <span className="text-gradient">SYNERGY.</span></h1>
        <p className="hero-subtitle mx-auto">Authentic moments captured live by our community.</p>
      </header>

      {photos.length === 0 ? (
        <div className="glass-card text-center p-20 border-dashed opacity-50">
          <ImageIcon size={48} className="mx-auto mb-4" />
          <p className="font-bold">The wall is empty. Waiting for live captures...</p>
        </div>
      ) : (
        <div className="gallery-grid">
          {photos.map((p) => (
            <div key={p.id} className="photo-card glass-card !p-0">
              <img src={p.url} />
              <div className="photo-overlay">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-primary/20 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center font-black">
                     {p.userName.charAt(0).toUpperCase()}
                   </div>
                   <div>
                     <p className="font-black text-lg leading-tight">{p.userName}</p>
                     <p className="text-[10px] text-primary font-black tracking-widest uppercase">Verified Capture</p>
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="mesh-bg" />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/client" element={<ClientCamera />} />
        <Route path="/gallery" element={<PublicGallery />} />
      </Routes>
    </Router>
  );
}

export default App;
