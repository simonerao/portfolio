console.log("IT’S ALIVE!");

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"                   // Local server
  : "/portfolio/";        // GitHub Pages repo name — change if needed

// Define site pages
let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'contact/', title: 'Contact' },
  { url: 'resume/', title: 'Resume' },
  { url: 'https://github.com/simonerao', title: 'GitHub' }
];

// Create nav element and add it to top of body
let nav = document.createElement('nav');
document.body.prepend(nav);

// Create links and add them to nav
for (let p of pages) {
  let url = p.url;
  let title = p.title;

  // Prefix relative URLs with base path
  url = !url.startsWith('http') ? BASE_PATH + url : url;

  nav.insertAdjacentHTML('beforeend', `<a href="${url}">${title}</a>`);
}
