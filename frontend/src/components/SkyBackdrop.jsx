/** Shows the illustrated background across the entire application */
export default function SkyBackdrop() {
  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{
        backgroundColor: '#f5fffa',
        backgroundImage: "url('/assets/app_background.png')",
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
      }}
      aria-hidden="true"
    />
  );
}

