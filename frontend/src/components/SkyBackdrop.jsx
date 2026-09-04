import { useLocation } from 'react-router-dom';

/** Shows the illustrated backdrop on public entry pages and the tint after sign-in. */
export default function SkyBackdrop() {
  const { pathname } = useLocation();
  const isAuthPage = ['/', '/login', '/register', '/mentor-login'].includes(pathname);

  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{
        backgroundColor: '#f5fffa',
        backgroundImage: isAuthPage ? "url('/assets/auth_background.png')" : 'none',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
      }}
      aria-hidden="true"
    />
  );
}
