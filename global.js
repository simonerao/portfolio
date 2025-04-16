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
  // Add the rest of your pages here as needed
];

// Step 2: Create a new <nav> element and add it to the beginning of the body
let nav = document.createElement('nav');
document.body.prepend(nav);

// Step 3: Iterate over the pages array and create a link for each page
for (let p of pages) {
  let url = p.url;
  let title = p.title;

  // Step 4: Create the link and insert it into the nav
  nav.insertAdjacentHTML('beforeend', `<a href="${url}">${title}</a>`);
}
