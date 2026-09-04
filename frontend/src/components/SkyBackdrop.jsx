/** Shows the app-wide illustrated backdrop across all pages. */
export default function SkyBackdrop() {
  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{
        backgroundColor: '#eaf8f5',
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

