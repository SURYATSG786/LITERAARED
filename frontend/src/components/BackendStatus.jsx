import { useEffect, useState } from 'react';
import api from '../api/client';

/** Shows a clear banner when the backend API is down — prevents silent "Request failed".
 *  Pass `light` when placing this on a light background (e.g. the sky-themed auth pages). */
export default function BackendStatus({ light = false }) {
  const [ok, setOk] = useState(null);
  const [detail, setDetail] = useState('');

  useEffect(() => {
    let alive = true;
    async function ping() {
      try {
        const res = await api.health();
        if (!alive) return;
        setOk(res.status === 'ok');
        setDetail(res.database ? `${res.database.users} learners saved` : 'API online');
      } catch (err) {
        if (!alive) return;
        setOk(false);
        setDetail(err.message);
      }
    }
    ping();
    const id = setInterval(ping, 8000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (ok === null || ok) return null;
  return light ? (
    <div className="sky-status-err mb-4" role="alert">
      Backend is not running. In a terminal run:
      <code>cd backend && cp .env.example .env && npm install && npm run dev</code>
      Keep that terminal open, then try again. ({detail})
    </div>
  ) : (
    <div className="mb-4 rounded-xl bg-[rgba(255,75,75,0.22)] px-3 py-3 text-sm font-extrabold leading-snug text-[#ffc0c0]" role="alert">
      Backend is not running. In a terminal run:
      <code className="mt-2 block rounded-lg bg-black/25 px-2 py-2 text-[11px] text-white/90">
        cd backend && cp .env.example .env && npm install && npm run dev
      </code>
      Keep that terminal open, then try again. ({detail})
    </div>
  );
}
