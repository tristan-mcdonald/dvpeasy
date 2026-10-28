import { copyToClipboard } from '../lib/clipboard';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * How long a copy button shows that it copied, in milliseconds.
 */
const COPIED_DURATION = 2000;

/**
 * Copies text to the clipboard, and holds the text last copied for `COPIED_DURATION`, so that the
 * button which copied it can show a tick.
 */
export function useCopyToClipboard () {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const copy = useCallback(async (text: string) => {
    if (!await copyToClipboard(text)) return;

    setCopiedText(text);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopiedText(null), COPIED_DURATION);
  }, []);

  return { copiedText, copy };
}
