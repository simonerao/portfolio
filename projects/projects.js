import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json'); 
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

const projectsTitle = document.querySelector('.projects-title');

// Update the text content of the title to include the count of projects
projectsTitle.textContent = `Projects (${projects.length})`;

console.log("Projects loaded:", projects);

