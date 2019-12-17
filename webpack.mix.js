const mix = require('laravel-mix')

mix.js('src/main.js', 'dist/js')
  .webpackConfig({
      resolve: {
          alias: {
              '@': path.resolve(__dirname, 'src/'),
              '@Boot': path.resolve(__dirname, 'src/bootstrap'),
          }
      }
  })