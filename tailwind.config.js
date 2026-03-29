/** @type {import('tailwindcss').Config} */

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/flyonui/dist/js/*.js',
  ],
  theme: {
    extend: {
      colors: {
        'attention':                 'var(--color-attention)',
        'attention-subtle':          'var(--color-attention-subtle)',
        'body-background':           'var(--color-body-background)',
        'card-background':           'var(--color-card-background)',
        'input-background':          'var(--color-input-background)',
        'input-border':              'var(--color-input-border)',
        'input-border-focus':        'var(--color-input-border-focus)',
        'input-outline-focus':       'var(--color-input-outline)',
        'input-placeholder':         'var(--color-input-placeholder)',
        'interface-black':           'var(--color-interface-black)',
        'interface-border':          'var(--color-interface-border)',
        'interface-dark':            'var(--color-interface-dark)',
        'logo-highlight':            'var(--color-logo-highlight)',
        'logo-main':                 'var(--color-logo-main)',
        'primary-button-background': 'var(--color-primary-button-background)',
        'primary-button-border':     'var(--color-primary-button-border)',
        'primary-interaction':       'var(--color-primary-interaction)',
        'primary-subtle':            'var(--color-primary-subtle)',
        'secondary':                 'var(--color-secondary)',
        'text-anchor':               'var(--color-text-anchor)',
        'text-body':                 'var(--color-text-body)',
        'text-disabled':             'var(--color-text-disabled)',
        'text-label':                'var(--color-text-label)',
      },
      fontFamily: {
        'sans': ['Geist', 'system-ui', '-apple-system', 'sans-serif'],
        'mono': ['GeistMono', 'Courier New', 'monospace'],
      },
      maxWidth: {
        'ch': '88ch',
      },
      spacing: {
        '120': '30rem',
        '124': '31rem',
        '128': '32rem',
      },
    },
  },
  plugins: [
    require('flyonui'),
  ],
};
