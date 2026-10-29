/**
 * Adds the favicons, the web app manifest and Microsoft's tile tags to the document's head.
 */
export const injectHeadElements = (): void => {
  injectFavicons();
};

const injectFavicons = (): void => {
  const faviconTags = [
    {
      rel: 'apple-touch-icon-precomposed',
      sizes: '57x57',
      href: '/favicons/apple-touch-icon-57x57.png',
    },
    {
      rel: 'apple-touch-icon-precomposed',
      sizes: '114x114',
      href: '/favicons/apple-touch-icon-114x114.png',
    },
    {
      rel: 'apple-touch-icon-precomposed',
      sizes: '72x72',
      href: '/favicons/apple-touch-icon-72x72.png',
    },
    {
      rel: 'apple-touch-icon-precomposed',
      sizes: '144x144',
      href: '/favicons/apple-touch-icon-144x144.png',
    },
    {
      rel: 'apple-touch-icon-precomposed',
      sizes: '60x60',
      href: '/favicons/apple-touch-icon-60x60.png',
    },
    {
      rel: 'apple-touch-icon-precomposed',
      sizes: '120x120',
      href: '/favicons/apple-touch-icon-120x120.png',
    },
    {
      rel: 'apple-touch-icon-precomposed',
      sizes: '76x76',
      href: '/favicons/apple-touch-icon-76x76.png',
    },
    {
      rel: 'apple-touch-icon-precomposed',
      sizes: '152x152',
      href: '/favicons/apple-touch-icon-152x152.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '196x196',
      href: '/favicons/favicon-196x196.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '96x96',
      href: '/favicons/favicon-96x96.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      href: '/favicons/favicon-32x32.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '16x16',
      href: '/favicons/favicon-16x16.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '128x128',
      href: '/favicons/favicon-128.png',
    },
    {
      rel: 'manifest',
      href: '/favicons/site.webmanifest',
    },
  ];

  const msAppMetaTags = [
    {
      name: 'application-name',
      content: '&nbsp;',
    },
    {
      name: 'msapplication-TileColor',
      content: '#FFFFFF',
    },
    {
      name: 'msapplication-TileImage',
      content: '/favicons/mstile-144x144.png',
    },
    {
      name: 'msapplication-square70x70logo',
      content: '/favicons/mstile-70x70.png',
    },
    {
      name: 'msapplication-square150x150logo',
      content: '/favicons/mstile-150x150.png',
    },
    {
      name: 'msapplication-wide310x150logo',
      content: '/favicons/mstile-310x150.png',
    },
    {
      name: 'msapplication-square310x310logo',
      content: '/favicons/mstile-310x310.png',
    },
  ];

  faviconTags.forEach(tag => {
    const link = document.createElement('link');

    Object.entries(tag).forEach(([attribute, value]) => {
      link.setAttribute(attribute, value);
    });

    document.head.appendChild(link);
  });

  msAppMetaTags.forEach(tag => {
    const meta = document.createElement('meta');

    Object.entries(tag).forEach(([attribute, value]) => {
      meta.setAttribute(attribute, value);
    });

    document.head.appendChild(meta);
  });
};
