import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

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

    // ======= NEW: Draw pie chart using D3 with Labels =======

    // Updated data with labels
    const data = [
      { value: 1, label: 'apples' },
      { value: 2, label: 'oranges' },
      { value: 3, label: 'mangos' },
      { value: 4, label: 'pears' },
      { value: 5, label: 'limes' },
      { value: 5, label: 'cherries' },
    ];

    // Create the arc generator
    const arcGenerator = d3.arc()
      .innerRadius(0)
      .outerRadius(50);

    // Create the slice generator (this will handle calculating the angles)
    const sliceGenerator = d3.pie().value(d => d.value);

    // Generate the start and end angles for the slices
    const arcData = sliceGenerator(data);

    // Create arcs (paths) from the arcData
    const arcs = arcData.map(d => arcGenerator(d));

    // Use D3's scaleOrdinal for generating a color scale
    const colors = d3.scaleOrdinal(d3.schemeTableau10);

    // Select the SVG container and append the paths for each slice
    const svg = d3.select('#projects-pie-plot');
    arcs.forEach((arc, idx) => {
      svg.append('path')
        .attr('d', arc)
        .attr('fill', colors(idx)); // Use colors as a function

      // Add labels to each slice using arc.centroid() to position them
      const [x, y] = arc.centroid(arcData[idx]);  // Get the centroid of each arc
      svg.append('text')
        .attr('x', x)
        .attr('y', y)
        .attr('text-anchor', 'middle')
        .attr('dy', '.35em') // Vertical alignment
        .text(data[idx].label);  // Label text
    });

    // ======= END of D3 addition =======

  } catch (error) {
    console.error("Error fetching or rendering projects:", error);
  }
});
