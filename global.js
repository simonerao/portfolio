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
  { url: 'meta/', title: 'Meta' },
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

// Function to set the color scheme and store it in localStorage
function setColorScheme(colorScheme) {
  document.documentElement.style.setProperty('color-scheme', colorScheme); // Set the color-scheme
  localStorage.setItem('colorScheme', colorScheme); // Save to localStorage
}

// Check if there's a saved color scheme in localStorage on page load
window.addEventListener('load', () => {
  const savedColorScheme = localStorage.getItem('colorScheme'); // Get saved value from localStorage
  
  if (savedColorScheme) {
    // Apply saved color scheme
    setColorScheme(savedColorScheme);
    document.querySelector('#theme-select').value = savedColorScheme; // Update the select element to match
  } else {
    // If no saved preference, default to automatic mode based on the system's color scheme
    const isDark = matchMedia('(prefers-color-scheme: dark)').matches;
    const autoLabel = isDark ? 'Automatic (Dark)' : 'Automatic (Light)';
    document.querySelector('option[value="light dark"]').textContent = autoLabel; // Update label text
    setColorScheme('light dark'); // Set the default to automatic
    document.querySelector('#theme-select').value = 'light dark'; // Set the select value as automatic
  }
});

// Event listener for when the user selects a new theme
document.querySelector('#theme-select').addEventListener('change', function (event) {
  const selectedColorScheme = event.target.value;
  setColorScheme(selectedColorScheme); // Apply the new color scheme
});


// This script will handle the contact form submission

document.addEventListener("DOMContentLoaded", function() {
  // Get a reference to the form
  const form = document.getElementById('contact-form');

  if (form) {
      // Add an event listener for form submission
      form.addEventListener('submit', function (event) {
          event.preventDefault(); // Prevent the default form submission

          // Create a new FormData object to hold the form data
          const data = new FormData(form);

          // Initialize an array to hold the URL parameters
          const params = [];

          // Loop through the FormData object and encode each value
          for (let [name, value] of data) {
              // Add the encoded key-value pair to the params array
              params.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
          }

          // Join the parameters into a query string
          const queryString = params.join('&');

          // Create the mailto URL
          const mailtoUrl = `mailto:sirao@ucsd.edu?${queryString}`;

          // Redirect to the mailto URL (this opens the email client)
          location.href = mailtoUrl;
      });
  }
});

export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  containerElement.innerHTML = '';  // Clear existing content

  projects.forEach(project => {
    const article = document.createElement('article');

    // Title
    const heading = document.createElement(headingLevel);
    heading.textContent = project.title;
    article.appendChild(heading);

    // Image
    const image = document.createElement('img');
    image.src = project.image;
    image.alt = project.title;
    article.appendChild(image);

    // Wrap description and year in a container for styling
    const textBlock = document.createElement('div');
    textBlock.className = 'project-text';

    // Description
    const description = document.createElement('p');
    description.textContent = project.description;
    textBlock.appendChild(description);

    // Year
    const yearElement = document.createElement('time');
    yearElement.className = 'project-year';
    yearElement.dateTime = project.year;
    yearElement.textContent = `c. ${project.year}`;
    textBlock.appendChild(yearElement);

    // Append text block to article
    article.appendChild(textBlock);


    // Optional GitHub link
    if (project.github) {
      const githubLink = document.createElement('a');
      githubLink.href = project.github;
      githubLink.textContent = 'View Project'; // changed from 'View on GitHub'
      githubLink.target = '_blank';
      article.appendChild(githubLink);
    }
    

    // If there is a PDF link, add it
    if (project.pdf) {
      const pdfLink = document.createElement('a');
      pdfLink.href = project.pdf;
      pdfLink.textContent = 'View Project';
      pdfLink.target = '_blank'; // Open in a new tab
      article.appendChild(pdfLink);
    }

    else if (project.note) {
      const note = document.createElement('p');
      note.textContent = project.note;
      article.appendChild(note);
    }


    containerElement.appendChild(article);
  });
}



export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}