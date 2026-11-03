// iPhone-style device mockup (prototype dimensions: 440 × 956 CSS px viewport, not official specs).

import { BatteryFull, Signal, Wifi } from '@/components/icons';
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

export type Sky = 'morning' | 'day' | 'evening' | 'night';

/** The sky follows the clock: morning until 10, day until 17, evening after. Night is the dark appearance. */
export function skyFor(hour: number): Exclude<Sky, 'night'> {
  return hour >= 5 && hour < 10 ? 'morning' : hour >= 10 && hour < 17 ? 'day' : 'evening';
}

export function DeviceFrame({ children, scale, sky = 'day' }: { children: ReactNode; scale: number; sky?: Sky }) {
  const time = useClock();
  return (
    <div className="device-slot" style={{ width: DEVICE_W * scale, height: DEVICE_H * scale }}>
      <div className="device" style={{ transform: `scale(${scale})` }} aria-label="iPhone 18 Pro Max prototype frame">
        <div className="screen" id="device-screen" data-sky={sky}>
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
