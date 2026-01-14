/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://testsurely.com',
  generateRobotsTxt: true, // This also generates robots.txt!
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 5000,
  exclude: ['/admin/*', '/private/*'], // Pages to exclude
}