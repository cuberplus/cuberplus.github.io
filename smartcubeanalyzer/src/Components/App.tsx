import React, { useState, useEffect, useCallback, useContext } from 'react';
import { FileInput } from './FileInput';
import { ThemeContext } from '../contexts/ThemeContext';
import { Footer, PageVisible } from '@cuberplus/navigation';
import "../CSS/Style.css";
import ReactGA from 'react-ga4';

function getInitialIsDark(): boolean {
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') return stored === 'dark';
  } catch { /* Use the default when storage is blocked. */ }
  return true;
}

function App() {
  const visible = useContext(PageVisible);
  const [isDark, setIsDark] = useState(getInitialIsDark);
  useEffect(() => { ReactGA.initialize('G-BHXNCQ3K0D'); }, []);
  useEffect(() => { if (visible) ReactGA.send({ hitType: 'pageview', page: window.location.pathname }); }, [visible]);
  useEffect(() => {
    if (!visible) return;
    const theme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-bs-theme', theme);
    try { localStorage.setItem('theme', theme); } catch { /* Theme still works without storage. */ }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', isDark ? '#10141e' : '#f3f6fa');
  }, [isDark, visible]);

  const setTheme = useCallback((theme: 'light' | 'dark') => setIsDark(theme === 'dark'), []);

  return (
    <ThemeContext.Provider value={{ isDark, setTheme }}>
      <div className="App cuberplus-page">
        <FileInput />
        <Footer />
      </div>
    </ThemeContext.Provider>
  );
}

export default App;
