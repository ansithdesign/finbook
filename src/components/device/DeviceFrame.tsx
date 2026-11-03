// iPhone-style device mockup (prototype dimensions: 440 × 956 CSS px viewport, not official specs).

import { BatteryFull, Signal, Wifi } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

const DEVICE_W = 468;
const DEVICE_H = 984;

function useClock() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 15000);
    return () => clearInterval(id);
  }, []);
  return t.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: false });
}

export function useDeviceScale(reservedLeft: number) {
  const calc = () => {
    const h = (window.innerHeight - 32) / DEVICE_H;
    const w = (window.innerWidth - reservedLeft - 32) / DEVICE_W;
    return Math.max(0.35, Math.min(1, h, w));
  };
  const [scale, setScale] = useState(calc);
  useEffect(() => {
    const on = () => setScale(calc());
    on();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservedLeft]);
  return scale;
}

export function DeviceFrame({ children, scale, appearance = 'light' }: { children: ReactNode; scale: number; appearance?: 'light' | 'dark' }) {
  const time = useClock();
  return (
    <div className="device-slot" style={{ width: DEVICE_W * scale, height: DEVICE_H * scale }}>
      <div className="device" style={{ transform: `scale(${scale})` }} aria-label="iPhone 18 Pro Max prototype frame">
        <div className="screen" id="device-screen" data-theme={appearance}>
          <div className="statusbar" aria-hidden="true">
            <span>{time}</span>
            <span className="icons">
              <Signal size={17} strokeWidth={2.5} />
              <Wifi size={17} strokeWidth={2.5} />
              <BatteryFull size={24} strokeWidth={1.8} />
            </span>
          </div>
          <div className="island" aria-hidden="true" />
          {children}
          <div className="home-indicator" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
