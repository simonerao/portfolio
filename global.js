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

const isDark = matchMedia('(prefers-color-scheme: dark)').matches;
const autoLabel = isDark ? 'Automatic (Dark)' : 'Automatic (Light)';

document.body.insertAdjacentHTML(
  'afterbegin',
  `
  <label class="color-scheme">
    Theme:
    <select id="theme-select">
      <option value="light dark">${autoLabel}</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
  `
);

document.getElementById('theme-select').addEventListener('change', (e) => {
  document.documentElement.style.colorScheme = e.target.value;
});

const select = document.querySelector('#theme-select');

select.addEventListener('input', function (event) {
  console.log('color scheme changed to', event.target.value); // Log the selected value

  document.documentElement.style.setProperty('color-scheme', event.target.value);
});

// Function to set the color scheme
function setColorScheme(colorScheme) {
  document.documentElement.style.setProperty('color-scheme', colorScheme); // Set the color-scheme on the root element
  localStorage.colorScheme = colorScheme; // Save the color scheme to localStorage
  select.value = colorScheme; // Update the <select> element to match the saved preference
}

// On page load, check if the color scheme is saved in localStorage
window.addEventListener('load', () => {
  // Check if there's a saved color scheme in localStorage
  const savedColorScheme = localStorage.colorScheme;

  if (savedColorScheme) {
    setColorScheme(savedColorScheme); // Apply the saved color scheme
  } else {
    // If no saved color scheme, default to 'light dark' (automatic based on system preference)
    const isDark = matchMedia('(prefers-color-scheme: dark)').matches;
    const autoLabel = isDark ? 'Automatic (Dark)' : 'Automatic (Light)';
    select.querySelector('option[value="light dark"]').textContent = autoLabel;
    setColorScheme('light dark'); // Default to automatic
  }
});

// Add event listener to the select element to change the color scheme
const select = document.querySelector('#theme-select');

select.addEventListener('input', function (event) {
  setColorScheme(event.target.value); // Change the color scheme based on user input
});




