import { fetchJSON, renderProjects } from '../global.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Fetch the JSON data for projects
  const projects = await fetchJSON('../lib/projects.json');
  
  // Select the container for the projects and the title element
  const projectsContainer = document.querySelector('.projects');
  const projectsTitle = document.querySelector('.projects-title');
  
  // Update the title to show the number of projects
  projectsTitle.textContent = `Projects (${projects.length})`;
  
  // Render the projects dynamically
  renderProjects(projects, projectsContainer, 'h2');
  
  // Log to confirm the projects are loaded
  console.log("Projects loaded:", projects);
});
