// scripts/config.js
const SITE_CONFIG = {
    isGitHub: window.location.hostname.includes('github.io'),
    basePath: window.location.hostname.includes('github.io') ? '/samsec/' : '/',
    repoName: 'samsec'
};