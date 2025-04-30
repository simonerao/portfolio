import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let query = ''; // Declare the search query variable
let selectedIndex = -1; // 🆕 Track selected wedge

// Function to render pie chart
function renderPieChart(projectsGiven) {
  // Clear previous pie chart and legend
  d3.select('#projects-pie-plot').selectAll('path').remove();
  d3.select('.legend').selectAll('li').remove();

  // Re-calculate rolled data
  let newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  );

  // Re-calculate data for the pie chart
  let newData = newRolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  // Set up D3 chart elements
  const arcGenerator = d3.arc()
    .innerRadius(0)
    .outerRadius(50);

  const sliceGenerator = d3.pie().value((d) => d.value);
  const arcData = sliceGenerator(newData);
  const arcs = arcData.map(d => arcGenerator(d));
  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  const svg = d3.select('#projects-pie-plot');

  // Render the pie chart
  arcs.forEach((arc, idx) => {
    svg.append('path')
      .attr('d', arc)
      .attr('fill', colors(idx))
      .attr('style', `--color: ${colors(idx)}`)
      .attr('class', idx === selectedIndex ? 'selected' : '')
      .style('cursor', 'pointer') // 🆕 Cursor pointer for better UX
      .on('click', () => {
        selectedIndex = selectedIndex === idx ? -1 : idx;

        // Update pie wedge highlight
        svg.selectAll('path')
          .attr('class', (_, i) => (i === selectedIndex ? 'selected' : ''));

        // Update legend highlight
        d3.select('.legend').selectAll('li')
          .attr('class', (_, i) => (i === selectedIndex ? 'selected legend-item' : 'legend-item'));
      });
  });

  // Render the legend
  let legend = d3.select('.legend');
  newData.forEach((d, idx) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(idx)}`)
      .attr('class', idx === selectedIndex ? 'selected legend-item' : 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

// Wait for the DOM content to fully load
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const projects = await fetchJSON('../lib/projects.json');
    console.log("Projects data fetched:", projects);

    if (!projects || projects.length === 0) {
      console.log("No projects found in the JSON.");
      return;
    }

    const projectsContainer = document.querySelector('.projects');
    const projectsTitle = document.querySelector('.projects-title');
    const searchInput = document.querySelector('.searchBar');

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
    renderPieChart(projects);

    // ======= Search functionality =======
    if (searchInput) {
      searchInput.addEventListener('input', (event) => {
        query = event.target.value.trim().toLowerCase();

        const filteredProjects = projects.filter((project) =>
          Object.values(project).join(' ').toLowerCase().includes(query)
        );

        renderProjects(filteredProjects, projectsContainer);
        projectsTitle.textContent = `${filteredProjects.length} Projects`;

        selectedIndex = -1; // 🆕 Reset selection when data changes
        renderPieChart(filteredProjects); // Re-render pie chart with filtered data
      });
    }

  } catch (error) {
    console.error("Error fetching or rendering projects:", error);
  }
});
