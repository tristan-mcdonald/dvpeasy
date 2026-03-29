export default function FooterGlobal () {
  return (
    <footer className="flex flex-col items-center justify-center gap-2 border-t border-interface-border px-4 py-6">
      <span className="block label leading-none">Provided by</span>
      <a
      className="link link-primary link-animated font-medium"
      href="https://paypal.me/tristanrmcdonald"
      rel="noopener noreferrer"
      target="_blank">Tristan McDonald</a>
      <span className="text-xs text-text-muted">Say thanks with a contribution</span>
    </footer>
  );
}
