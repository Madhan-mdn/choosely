import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppStateProvider } from './context/AppStateContext';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Generator } from './pages/Generator';
import { WheelArena } from './pages/WheelArena';
import { History } from './pages/History';
import { Favorites } from './pages/Favorites';
import { Settings } from './pages/Settings';

export function App() {
  return (
    <BrowserRouter>
      <AppStateProvider>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/generator" element={<Generator />} />
            <Route path="/wheel" element={<WheelArena />} />
            <Route path="/history" element={<History />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </AppStateProvider>
    </BrowserRouter>
  );
}

export default App;
