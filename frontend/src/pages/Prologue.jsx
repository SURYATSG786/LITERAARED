/** Isolate the supplied standalone landing page from global app styles. */
export default function Prologue() {
  return (
    <iframe
      src="/landing.html"
      title="LiteraAI — Read the World, in Your Own Words"
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 0, zIndex: 100, background: '#02050f' }}
      allow="microphone"
    />
  );
}
