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
      {
        text: 'Guide',
        link: '/guide/getting-started'
        // children: ['/guide/getting-started', '/guide/concepts', '/guide/writing-plugins'],
      },
      {
        text: 'Docs',
        children: [
          {
            text: 'API',
            link: '/docs/core-api'
          },
          {
            text: 'Concepts',
            link: '/docs/concepts'
          },
          {
            text: 'Features',
            link: '/docs/features'
          },
        ]
      },
      // {
      //   text: 'SICK Specific',
      //   children: ['/sick/concepts', '/sick/api'],
      // },
      // {
      //   text: 'Base Services',
      //   children: ['/services/navigation', '/services/notifications'],
      // },
      // {
      //   text: 'Examples',
      //   children: ['/examples/simple', '/examples/modals'],
      // },
    ],
  },
};
