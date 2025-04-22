import { fetchJSON, renderProjects } from '../global.js';

// Wait for the DOM content to fully load
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Fetch the JSON data for projects
    const projects = await fetchJSON('../lib/projects.json');
    console.log("Projects data fetched:", projects); // Check if data is fetched correctly
    
    if (!projects || projects.length === 0) {
      console.log("No projects found in the JSON.");
      return; // If no projects, stop here
    }
    
    // Select the container for the projects and the title element
    const projectsContainer = document.querySelector('.projects');
    const projectsTitle = document.querySelector('.projects-title');
    
    // Ensure elements are selected correctly
    if (!projectsContainer) {
      console.error("Projects container not found!");
      return;
    }
    
    if (!projectsTitle) {
      console.error("Projects title element not found!");
      return;
    }
    
    // Update the title to show the number of projects as "12 Projects"
    projectsTitle.textContent = `${projects.length} Projects`;
    
    // Render the projects dynamically
    renderProjects(projects, projectsContainer);
    
  } catch (error) {
    console.error("Error fetching or rendering projects:", error);
  }
});
