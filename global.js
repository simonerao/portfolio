console.log("IT’S ALIVE!");

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// const navLinks = $$("nav a");

// let currentLink = navLinks.find(
//   (a) => a.host === location.host && a.pathname === location.pathname
// );

// currentLink?.classList.add('current');

// Step 1: Define the pages array
let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'contact/', title: 'Contact' },
  { url: 'resume/', title: 'Resume' },
  { url: 'https://github.com/simonerao', title: 'GitHub', external: true }
];

// Step 2: Create a new <nav> element and add it to the beginning of the body
let nav = document.createElement('nav');
document.body.prepend(nav);

// Step 3: Iterate over the pages array and create a link for each page
for (let p of pages) {
  let url = p.url;
  let title = p.title;

  // Prefix BASE_PATH for internal links
  if (!p.external) {
    url = url.startsWith('http') ? url : BASE_PATH + url;
  }

  // Add to nav
  if (p.external) {
    nav.insertAdjacentHTML('beforeend', `<a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a>`);
  } else {
    nav.insertAdjacentHTML('beforeend', `<a href="${url}">${title}</a>`);
  }
}

// Step 5: Highlight the current page
const navLinks = $$("nav a");

let currentLink = navLinks.find(
  (a) => a.host === location.host && a.pathname === location.pathname
);

currentLink?.classList.add('current');
