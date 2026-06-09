/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, DragEvent, ChangeEvent, FormEvent } from 'react';
import { User, UserRole, UserStatus } from '../types';
import { Shield, Key, Mail, Info, CheckCircle2, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthModalProps {
  onAuthSuccess: (user: User) => void;
  onClose?: () => void;
}

const AVATAR_TEMPLATES = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'
];

export default function AuthModal({ onAuthSuccess, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_TEMPLATES[0]);
  const [customAvatar, setCustomAvatar] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Drag and drop for custom avatar handler
  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setSelectedAvatar(event.target.result as string);
            setCustomAvatar('Dropped image');
          }
        };
        reader.readAsDataURL(file);
      } else {
        setError('Please drop an image file (PNG/JPG)');
      }
    }
  };

  const handleAvatarSelectFile = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedAvatar(event.target.result as string);
          setCustomAvatar(file.name);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        if (!username) {
          setError('Please provide your username or email');
          setLoading(false);
          return;
        }

        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password: 'password123' })
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Authentication failed');
        } else {
          onAuthSuccess(data.user);
          onClose?.();
        }
      } else {
        if (!username || !email) {
          setError('Username and email are required');
          setLoading(false);
          return;
        }

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username.trim(),
            email: email.trim(),
            bio: bio.trim(),
            avatar: selectedAvatar
          })
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Registration failed');
        } else {
          onAuthSuccess(data.user);
          onClose?.();
        }
      }
    } catch (err) {
      console.error(err);
      setError('Connection to CommunityHub gateway lost. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoUsername: string) => {
    setUsername(demoUsername);
    setIsLogin(true);
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: demoUsername, password: 'password123' })
      });
      const data = await res.json();
      if (res.ok) {
        onAuthSuccess(data.user);
        onClose?.();
      } else {
        setError(data.error || 'Demo login failed');
      }
    } catch (e) {
      setError('Offline gateway. Retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg overflow-hidden bg-white rounded-3xl border-2 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]"
      >
        {/* Modal Header */}
        <div className="p-6 text-white bg-slate-900 border-b-2 border-slate-900 relative">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-800 rounded-xl border border-slate-700">
              <Shield className="w-5 h-5 text-emerald-400 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm font-display font-black uppercase tracking-wider text-white font-sans">CommunityHub Authentication</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Join communities and spark deep interest discussions</p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 md:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-950 text-red-705 rounded-2xl text-xs flex items-center gap-3 font-bold shadow-[2px_2px_0px_0px_rgba(239,68,68,0.15)]">
              <Info className="w-5 h-5 flex-shrink-0 stroke-[2.5]" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label htmlFor="username-input" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 font-display">
                {isLogin ? 'Username or Email Address' : 'Choose Username'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4 stroke-[2.5]" />
                </div>
                <input
                  id="username-input"
                  type="text"
                  required
                  placeholder={isLogin ? 'e.g. sarath' : 'e.g. startup_coder'}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs focus:outline-none focus:bg-white text-slate-900 font-bold"
                />
              </div>
            </div>

            {/* Email for Registration */}
            {!isLogin && (
              <div>
                <label htmlFor="email-input" className="block text-[10px] font-black text-slate-505 uppercase tracking-widest mb-2 font-display">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <input
                    id="email-input"
                    type="email"
                    required
                    placeholder="you@clickfused.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs focus:outline-none focus:bg-white text-slate-900 font-bold"
                  />
                </div>
              </div>
            )}

            {/* Bio for Registration */}
            {!isLogin && (
              <div>
                <label htmlFor="bio-input" className="block text-[10px] font-black text-slate-505 uppercase tracking-widest mb-2 font-display">
                  Short Biography (Bio)
                </label>
                <textarea
                  id="bio-input"
                  rows={2}
                  placeholder="Tell the hub about your tech stack, startups, or gamer rank..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs focus:outline-none focus:bg-white text-slate-950 font-bold"
                />
              </div>
            )}

            {/* Avatar Selector for Registration */}
            {!isLogin && (
              <div>
                <span className="block text-[10px] font-black text-slate-550 uppercase tracking-widest mb-2 font-display">
                  Choose Avatar Profile Photo
                </span>
                <div className="flex flex-wrap gap-2.5 mb-3.5">
                  {AVATAR_TEMPLATES.map((img) => (
                    <button
                      id={`avatar-btn-${img.substring(40, 48)}`}
                      type="button"
                      key={img}
                      onClick={() => {
                        setSelectedAvatar(img);
                        setCustomAvatar('');
                      }}
                      className={`relative w-11 h-11 rounded-full overflow-hidden border-2 transition-all ${
                        selectedAvatar === img ? 'border-slate-900 scale-105 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]' : 'border-slate-300 hover:border-slate-900'
                      }`}
                    >
                      <img src={img} alt="Avatar template" className="w-full h-full object-cover" />
                      {selectedAvatar === img && (
                        <div className="absolute inset-0 bg-slate-905/10 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-slate-900 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Drag and Drop Box */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                    dragActive ? 'border-orange-500 bg-orange-50' : 'border-slate-900 hover:bg-slate-100 bg-slate-50'
                  }`}
                >
                  <label htmlFor="avatar-file-upload" className="cursor-pointer">
                    <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight">
                      {customAvatar ? `Custom uploaded: ${customAvatar}` : 'Drag & Drop avatar image here or click to browse'}
                    </p>
                    <input
                      id="avatar-file-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarSelectFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-orange-600 hover:bg-orange-700 border-2 border-slate-900 text-white rounded-xl text-xs font-display font-black uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:translate-y-[-1px] transition-all cursor-pointer"
            >
              {loading ? 'Validating credentials...' : isLogin ? 'Sign Into Hub' : 'Create Free Account'}
            </button>
          </form>

          {/* Alternate switch & Quick Admin Login */}
          <div className="mt-6 pt-5 border-t-2 border-slate-900 flex flex-col gap-4">
            <button
              id="switch-auth-btn"
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-center text-xs text-slate-505 hover:text-slate-950 font-black uppercase tracking-wider transition-all cursor-pointer"
            >
              {isLogin ? "New to CommunityHub? Register account" : "Already member? Login with credentials"}
            </button>

            {/* Quick Demo Accounts */}
            <div className="bg-slate-50 border-2 border-slate-900 rounded-2xl p-4 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
              <span className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3.5 text-center font-display">
                Quick Access Profiles (One-Tap Login)
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-900">
                <button
                  id="demo-login-sarath"
                  type="button"
                  onClick={() => handleDemoLogin('sarath')}
                  className="p-2 py-2.5 bg-white border-2 border-slate-900 rounded-xl font-black text-slate-900 hover:bg-slate-100 text-center transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px]"
                >
                  <Shield className="w-3.5 h-3.5 text-red-650 stroke-[2.5]" />
                  <span>Admin (@sarath)</span>
                </button>
                <button
                  id="demo-login-guru"
                  type="button"
                  onClick={() => handleDemoLogin('tech_guru')}
                  className="p-2 py-2.5 bg-white border-2 border-slate-900 rounded-xl font-black text-slate-900 hover:bg-slate-100 text-center transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px]"
                >
                  <Shield className="w-3.5 h-3.5 text-indigo-650 stroke-[2.5]" />
                  <span>Mod (@tech_guru)</span>
                </button>
                <button
                  id="demo-login-alice"
                  type="button"
                  onClick={() => handleDemoLogin('startup_alice')}
                  className="p-2 py-2.5 bg-white border-2 border-slate-900 rounded-xl font-black text-slate-900 hover:bg-slate-100 text-center transition-all flex items-center justify-center gap-1.5 col-span-2 cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px]"
                >
                  <UserIcon className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                  <span>Member (@startup_alice)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
