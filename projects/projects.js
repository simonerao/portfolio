import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let query = '';             // Track the search query globally
let selectedIndex = -1;     // Track the selected pie slice index globally
let allProjects = [];       // Store the full dataset globally
let newData = [];           // 🆕 Store pie data globally for use in filtering

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

  newData = newRolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  const sliceGenerator = d3.pie().value((d) => d.value);
  const arcData = sliceGenerator(newData);
  const arcs = arcData.map(d => arcGenerator(d));
  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  const svg = d3.select('#projects-pie-plot');

  arcs.forEach((arc, idx) => {
    svg.append('path')
      .attr('d', arc)
      .attr('fill', colors(idx))
      .attr('style', `--color: ${colors(idx)}`)
      .attr('class', idx === selectedIndex ? 'selected' : '')
      .style('cursor', 'pointer')
      .on('click', () => {
        // Toggle selected index
        selectedIndex = selectedIndex === idx ? -1 : idx;

        // Highlight selected wedge
        svg.selectAll('path')
          .attr('class', (_, i) => (i === selectedIndex ? 'selected' : ''));

        // Highlight selected legend item
        d3.select('.legend').selectAll('li')
          .attr('class', (_, i) => (i === selectedIndex ? 'selected legend-item' : 'legend-item'));

        // 🆕 Filter and render projects based on both query and year
        const projectsContainer = document.querySelector('.projects');
        const projectsTitle = document.querySelector('.projects-title');

        const filteredProjects = filterProjects(allProjects);
        renderProjects(filteredProjects, projectsContainer);
        projectsTitle.textContent = `${filteredProjects.length} Projects`;
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

// 🧠 Helper function to combine search query and selected year filtering
function filterProjects(projects) {
  return projects.filter(project => {
    const matchesSearch = Object.values(project)
      .join(' ')
      .toLowerCase()
      .includes(query);

    const matchesYear = selectedIndex === -1 || project.year === newData[selectedIndex].label;

    return matchesSearch && matchesYear;
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    allProjects = await fetchJSON('../lib/projects.json');
    console.log("Projects data fetched:", allProjects);

    if (!allProjects || allProjects.length === 0) {
      console.log("No projects found in the JSON.");
      return;
    }

    const projectsContainer = document.querySelector('.projects');
    const projectsTitle = document.querySelector('.projects-title');
    const searchInput = document.querySelector('.searchBar');

    if (!projectsContainer || !projectsTitle) {
      console.error("Projects container or title not found!");
      return;
    }

    // Initial render
    projectsTitle.textContent = `${allProjects.length} Projects`;
    renderProjects(allProjects, projectsContainer);
    renderPieChart(allProjects);

    // Handle search input
    if (searchInput) {
      searchInput.addEventListener('input', (event) => {
        query = event.target.value.trim().toLowerCase();

        const filteredProjects = filterProjects(allProjects);
        renderProjects(filteredProjects, projectsContainer);
        projectsTitle.textContent = `${filteredProjects.length} Projects`;
        renderPieChart(filteredProjects);  // 🆕 Pie reflects filtered projects
      });
    }

  } catch (error) {
    console.error("Error fetching or rendering projects:", error);
  }
});
