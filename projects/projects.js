import { fetchJSON, renderProjects } from './global.js';

const data = await fetchJSON('../lib/projects.json');
renderProjects(data, document.querySelector('.projects'), 'h3');

// Count the projects and update the title
const titleElement = document.querySelector('.projects-title');
if (titleElement) {
  titleElement.textContent = `Projects (${data.length})`;
}
