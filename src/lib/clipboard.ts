import { logger } from './logger';

/**
 * Copies text to the clipboard, and says whether it could.
 */
export async function copyToClipboard (text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    logger.error('Failed to copy to the clipboard:', error);
    return false;
  }
}
