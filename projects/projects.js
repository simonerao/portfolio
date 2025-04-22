import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json'); 
const projectsContainer = document.querySelector('.projects');

const projectsTitle = document.querySelector('.projects-title');
projectsTitle.textContent = `Projects (${projects.length})`;

renderProjects(projects, projectsContainer, 'h2');

console.log("Projects loaded:", projects);

