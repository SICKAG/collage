import { defaultTheme } from 'vuepress';

export default {
  lang: 'en-US',
  title: 'Collage',
  description: 'micro frontends made simple',
  base: process.env.BASE_URL || '',

  theme: defaultTheme({
    _logo: 'https://vuejs.org/images/logo.png',
    navbar: [
      {
        text: 'Home',
        link: '/',
      },
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
        ],
      },
      {
        text: 'github',
        link: 'https://github.com/SICKAG/collage',
      },
    ],
  }),
};
