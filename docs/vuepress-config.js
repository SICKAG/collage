module.exports = {
  lang: 'en-US',
  title: 'Collage',
  description: 'micro frontends made simple',
  dest: './docs/dist',

  themeConfig: {
    _logo: 'https://vuejs.org/images/logo.png',
    navbar: [
      {
        text: 'Home',
        link: '/',
      },
      ...(() => (process.env.DEVELOP ? [{
        text: 'Regression',
        children: [
          {
            text: 'Integration',
            link: '/regression/integration',
          },
          {
            text: 'Features',
            link: '/regression/features',
          },
        ],
      }] : []))(),
      {
        text: 'Guide',
        link: '/guide/getting-started',
      },
      {
        text: 'Docs',
        children: [
          {
            text: 'API',
            link: '/docs/core-api',
          },
          {
            text: 'Concepts',
            link: '/docs/concepts',
          },
          {
            text: 'Features',
            link: '/docs/features',
          },
          {
            text: 'Architecture',
            link: '/docs/architecture',
          },
        ],
      },
    ],
  },
};
