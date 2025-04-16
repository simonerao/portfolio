console.log("IT’S ALIVE!");

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Define BASE_PATH based on environment
const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"
  : "/portfolio/"; // Replace 'portfolio' with your actual GitHub repo name if different

// Define navigation structure
let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'contact/', title: 'Contact' },
  { url: 'resume/', title: 'Resume' },
  { url: 'https://github.com/simonerao', title: 'GitHub', external: true }
];

// Create <nav> and add to body
let nav = document.createElement('nav');
document.body.prepend(nav);

// Add links to nav
for (let p of pages) {
  let url = p.url;
  let title = p.title;

  // Adjust internal links to work on both localhost and GitHub Pages
  if (!p.external && !url.startsWith('http')) {
    url = BASE_PATH + url;
  }

  // Build the anchor tag
  const anchorHTML = p.external
    ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a>`
    : `<a href="${url}">${title}</a>`;

  nav.insertAdjacentHTML('beforeend', anchorHTML);
}

// Add .current class to the active page link
const navLinks = $$("nav a");

let currentLink = navLinks.find(
  (a) => a.host === location.host && a.pathname === location.pathname
);

currentLink?.classList.add("current");
