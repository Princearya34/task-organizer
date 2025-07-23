"use client";

import React, { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, Lock, Mail, User, CheckCircle, AlertCircle, CheckSquare, Calendar, Target, Zap } from "lucide-react";

// Mock AuthResponse type for the example
export interface AuthResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

interface LoginFormProps {
  onLogin: (authResponse: AuthResponse) => void;
  onLogout?: () => void; // Add logout callback
  isAuthenticated?: boolean; // Track authentication state
}

export function LoginForm({ onLogin, onLogout, isAuthenticated = false }: LoginFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Auto-logout configuration
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const offlineTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  
  // Configuration constants
  const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes of inactivity
  const OFFLINE_TIMEOUT = 30 * 1000; // 30 seconds offline
  const VISIBILITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes when tab is hidden

  const apiUrl = "https://todoapp-princearya-brc9cvdmbegqcwfk.eastasia-01.azurewebsites.net/api/auth";

  // Auto-logout function
  const performLogout = (reason: string) => {
    if (!isAuthenticated) return;
    
    console.log(`🚪 Auto-logout triggered: ${reason}`);
    setMessage({ 
      type: "error", 
      text: `Session ended: ${reason}. Please log in again.` 
    });
    
    // Clear all timeouts
    if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    if (offlineTimeoutRef.current) clearTimeout(offlineTimeoutRef.current);
    if (visibilityTimeoutRef.current) clearTimeout(visibilityTimeoutRef.current);
    
    // Call logout callback
    onLogout?.();
  };

  // Reset inactivity timer
  const resetInactivityTimer = () => {
    if (!isAuthenticated) return;
    
    lastActivityRef.current = Date.now();
    
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
    
    inactivityTimeoutRef.current = setTimeout(() => {
      performLogout("No activity detected");
    }, INACTIVITY_TIMEOUT);
  };

  // Handle online/offline status
  const handleOnline = () => {
    if (offlineTimeoutRef.current) {
      clearTimeout(offlineTimeoutRef.current);
      offlineTimeoutRef.current = null;
    }
    console.log("🌐 Back online");
  };

  const handleOffline = () => {
    if (!isAuthenticated) return;
    
    console.log("📡 Gone offline, starting logout timer");
    offlineTimeoutRef.current = setTimeout(() => {
      performLogout("Connection lost");
    }, OFFLINE_TIMEOUT);
  };

  // Handle page visibility changes
  const handleVisibilityChange = () => {
    if (!isAuthenticated) return;
    
    if (document.hidden) {
      console.log("👁️ Tab hidden, starting logout timer");
      visibilityTimeoutRef.current = setTimeout(() => {
        performLogout("Tab was inactive too long");
      }, VISIBILITY_TIMEOUT);
    } else {
      console.log("👁️ Tab visible again");
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
        visibilityTimeoutRef.current = null;
      }
      resetInactivityTimer(); // Reset activity timer when tab becomes visible
    }
  };

  // Handle page unload (browser close/refresh)
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (isAuthenticated) {
      // This will show a confirmation dialog
      const message = "Are you sure you want to leave? You'll be logged out.";
      e.returnValue = message;
      return message;
    }
  };

  // Activity event listeners
  const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

  useEffect(() => {
    if (!isAuthenticated) {
      // Clean up all timers when not authenticated
      if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
      if (offlineTimeoutRef.current) clearTimeout(offlineTimeoutRef.current);
      if (visibilityTimeoutRef.current) clearTimeout(visibilityTimeoutRef.current);
      return;
    }

    console.log("🔒 Setting up auto-logout listeners");

    // Set up activity listeners
    const handleActivity = () => resetInactivityTimer();
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Set up online/offline listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set up visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Set up beforeunload listener
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Start the inactivity timer
    resetInactivityTimer();

    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up auto-logout listeners");
      
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
      if (offlineTimeoutRef.current) clearTimeout(offlineTimeoutRef.current);
      if (visibilityTimeoutRef.current) clearTimeout(visibilityTimeoutRef.current);
    };
  }, [isAuthenticated]);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setMessage(null);

  try {
    const endpoint = isLogin ? `${apiUrl}/login` : `${apiUrl}/register`;
    const body = isLogin
      ? { username: formData.username, password: formData.password }
      : formData;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `${isLogin ? "Login" : "Registration"} failed`);
    }

    const data = await response.json();
    console.log("✅ Auth API response:", data);

    if (!data.token || !data.username || !data.email) {
      throw new Error("Invalid login response: token or user info missing");
    }

    setMessage({ type: "success", text: `${isLogin ? "Login" : "Registration"} successful!` });

    if (isLogin) {
      setTimeout(() => {
        onLogin({
          token: data.token,
          user: {
            id: 0,
            username: data.username,
            email: data.email
          }
        });
      }, 1000);
    } else {
      setTimeout(() => {
        setIsLogin(true);
        setFormData({ username: "", email: "", password: "" });
        setMessage({ type: "success", text: "Registration successful! Please log in." });
      }, 1000);
    }
  } catch (error: any) {
    setMessage({ type: "error", text: error.message });
  } finally {
    setLoading(false);
  }
};

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Show authenticated state with logout option
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg shadow-2xl rounded-3xl p-8 border border-white/20 dark:border-slate-700/50">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">
              You're logged in!
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Auto-logout is active for your security
            </p>
            <button
              onClick={() => performLogout("Manual logout")}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 border-2 border-orange-300 rounded-lg rotate-12"></div>
        <div className="absolute top-40 right-32 w-24 h-24 border-2 border-amber-300 rounded-full"></div>
        <div className="absolute bottom-32 left-1/4 w-20 h-20 border-2 border-slate-300 rounded-lg -rotate-6"></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 border-2 border-orange-300 rounded-full rotate-45"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Header with Todo App Branding */}
        <div className="text-center mb-8">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
            <CheckSquare className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-orange-600 dark:from-slate-200 dark:to-orange-400 bg-clip-text text-transparent mb-2">
            TaskFlow
          </h1>
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
            {isLogin ? "Welcome back, Organizer!" : "Start Your Productivity Journey"}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 flex items-center justify-center gap-2">
            {isLogin ? (
              <>
                <Target className="h-4 w-4" />
                Ready to tackle your goals?
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Turn chaos into clarity
              </>
            )}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg shadow-2xl rounded-3xl p-8 border border-white/20 dark:border-slate-700/50 relative">
          {/* Decorative Elements */}
          <div className="absolute top-4 right-4 flex gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-400"></div>
            <div className="w-2 h-2 rounded-full bg-amber-400"></div>
            <div className="w-2 h-2 rounded-full bg-slate-400"></div>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-xl flex items-center space-x-3 border-l-4 ${
              message.type === "error"
                ? "bg-red-50/80 border-red-400 text-red-700 dark:bg-red-900/20 dark:border-red-600 dark:text-red-300"
                : "bg-emerald-50/80 border-emerald-400 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-600 dark:text-emerald-300"
            }`}>
              {message.type === "error" ? (
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
              ) : (
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
              )}
              <span className="font-medium">{message.text}</span>
            </div>
          )}

          <div className="space-y-6">
            {/* Username Field */}
            <div className="group">
              <label htmlFor="username" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <User className="h-4 w-4 text-orange-500" />
                Username
              </label>
              <div className="relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition-all duration-200 group-hover:border-orange-300"
                  placeholder="Your unique username"
                  value={formData.username}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Email Field (Registration only) */}
            {!isLogin && (
              <div className="group">
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-amber-500" />
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition-all duration-200 group-hover:border-amber-300"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            )}

            {/* Password Field */}
            <div className="group">
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <Lock className="h-4 w-4 text-slate-500" />
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition-all duration-200 group-hover:border-slate-300 pr-12"
                  placeholder="Your secure password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold py-4 px-6 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-200 dark:focus:ring-orange-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  <span>Getting things ready...</span>
                </div>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {isLogin ? (
                    <>
                      <CheckSquare className="h-5 w-5" />
                      Let's Get Organized
                    </>
                  ) : (
                    <>
                      <Calendar className="h-5 w-5" />
                      Start My Journey
                    </>
                  )}
                </span>
              )}
            </button>

            {/* Toggle Login/Register */}
            <div className="text-center pt-6 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 font-medium transition-colors flex items-center justify-center gap-2 mx-auto group"
              >
                <span className="group-hover:underline">
                  {isLogin ? "New to TaskFlow? Create your account" : "Already organizing with us? Sign in"}
                </span>
                <Zap className="h-4 w-4 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer with Todo App Context */}
        <div className="text-center mt-8 space-y-3">
          <div className="flex items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Task Management
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Smart Planning
            </span>
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              Goal Tracking
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            By continuing, you agree to our{" "}
            <a href="#" className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 hover:underline">
              Privacy Policy
            </a>
          </div>
          <div className="text-center mt-4 text-xs text-slate-400 dark:text-slate-500">
            Made with ❤️ by <span className="font-medium text-orange-500">Prince Kumar Arya</span>
          </div>
        </div>
      </div>
    </div>
  );
}