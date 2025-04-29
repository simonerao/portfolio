import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Wait for the DOM content to fully load
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Fetch the JSON data for projects
    const projects = await fetchJSON('../lib/projects.json');
    console.log("Projects data fetched:", projects);
    
    if (!projects || projects.length === 0) {
      console.log("No projects found in the JSON.");
      return;
    }
    
    const projectsContainer = document.querySelector('.projects');
    const projectsTitle = document.querySelector('.projects-title');
    
    if (!projectsContainer) {
      console.error("Projects container not found!");
      return;
    }
    
    if (!projectsTitle) {
      console.error("Projects title element not found!");
      return;
    }
    
    projectsTitle.textContent = `${projects.length} Projects`;
    renderProjects(projects, projectsContainer);

    // ======= NEW: Draw pie chart using D3 =======

    const data = [
      { value: 1, label: 'apples' },
      { value: 2, label: 'oranges' },
      { value: 3, label: 'mangos' },
      { value: 4, label: 'pears' },
      { value: 5, label: 'limes' },
      { value: 5, label: 'cherries' }
    ];

    const arcGenerator = d3.arc()
      .innerRadius(0)
      .outerRadius(50);

    const sliceGenerator = d3.pie().value((d) => d.value);
    const arcData = sliceGenerator(data);
    const arcs = arcData.map(d => arcGenerator(d));
    const colors = d3.scaleOrdinal(d3.schemeTableau10);

    const svg = d3.select('#projects-pie-plot');
    arcs.forEach((arc, idx) => {
      svg.append('path')
        .attr('d', arc)
        .attr('fill', colors(idx));
    });

    // ======= END of D3 addition =======

    // Step 2.2: Adding legend
    let legend = d3.select('.legend');
    data.forEach((d, idx) => {
      legend
        .append('li')
        .attr('style', `--color:${colors(idx)}`)
        .attr('class', 'legend-item') // <<== NEW: add class to each <li>
        .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
    });

  } catch (error) {
    console.error("Error fetching or rendering projects:", error);
  }
});
