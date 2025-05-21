import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
const fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);


let commits = [];  // Declare commits globally
let xScale, yScale; // Declare xScale and yScale globally
let commitProgress = 100;
let timeScale;
let filteredCommits = [];
let currentScatterCommits = [];




async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));
  return data;
}

function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;

      let ret = {
        id: commit,
        url: 'https://github.com/YOUR_REPO/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, 'lines', {
        value: lines,
        configurable: true,
        writable: true,
        enumerable: false,
      });
      return ret;
    });
}

function renderCommitInfo(data, filteredCommits) {
  d3.select('#stats').selectAll('*').remove(); // Clear previous stats

  const container = d3.select('#stats')
    .append('div')
    .attr('class', 'summary-box');

  container.append('h2').text('Summary');

  const dl = container.append('dl').attr('class', 'stats');

  // Total LOC
  const totalLOC = d3.sum(filteredCommits, d => d.lines.length);
  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(totalLOC);

  // Total commits
  dl.append('dt').text('Total commits');
  dl.append('dd').text(filteredCommits.length);

  // Number of files
  const lines = filteredCommits.flatMap(d => d.lines);
  const fileCount = new Set(lines.map(d => d.file)).size;
  dl.append('dt').text('Number of files');
  dl.append('dd').text(fileCount);

  // Average file length
  const fileLengths = d3.rollups(lines, v => d3.max(v, d => d.line), d => d.file);
  const avgFileLength = d3.mean(fileLengths, d => d[1]);
  dl.append('dt').text('Average file length (lines)');
  dl.append('dd').text(avgFileLength?.toFixed(1) ?? '0.0');

  // Average line length
  const avgLineLength = d3.mean(lines, d => d.length);
  dl.append('dt').text('Average line length (chars)');
  dl.append('dd').text(avgLineLength?.toFixed(1) ?? '0.0');

  // Average depth
  const avgDepth = d3.mean(lines, d => d.depth);
  dl.append('dt').text('Average depth');
  dl.append('dd').text(avgDepth?.toFixed(2) ?? '0.00');
}


const data = await loadData();

function createBrushSelector(svg) {
  const brush = d3.brush()
    .extent([[0, 0], [svg.attr('width') || 1000, svg.attr('height') || 600]])
    .on('brush end', brushed);

  svg.append('g')
    .attr('class', 'brush')
    .call(brush);
}


async function updateScatterPlot(data, filteredCommits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  currentScatterCommits = filteredCommits;


  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  d3.select('#chart svg')?.remove(); // Clear previous SVG

  const svg = d3.select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  xScale = d3.scaleTime()
    .domain(d3.extent(filteredCommits, d => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  yScale = d3.scaleLinear().domain([0, 24]).range([usableArea.bottom, usableArea.top]);

  svg.append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

  const dots = svg.append('g').attr('class', 'dots');

  const [minLines, maxLines] = d3.extent(filteredCommits, d => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  dots.selectAll('circle')
    .data(filteredCommits, d => d.id)
    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });

  svg.append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(d3.axisBottom(xScale));

  svg.append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(d3.axisLeft(yScale).tickFormat(d => String(d % 24).padStart(2, '0') + ':00'));

  createBrushSelector(svg);
}


// Function to check if a commit is selected based on brush selection
function isCommitSelected(selection, commit) {
  if (!selection) return false;

  const [[x0, y0], [x1, y1]] = selection;
  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);

  return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

function renderLanguageBreakdown(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];
  const container = document.getElementById('language-breakdown');

  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }
  const requiredCommits = selectedCommits.length ? selectedCommits : currentScatterCommits;

  const lines = requiredCommits.flatMap((d) => d.lines);

  // Use d3.rollup to count lines per language
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type,
  );

  // Update DOM with breakdown
  container.innerHTML = '';

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);

    container.innerHTML += `
            <dt>${language}</dt>
            <dd>${count} lines (${formatted})</dd>
        `;
  }
}

function brushed(event) {
  const selection = event.selection;

  if (!selection) {
    return; // Exit if no selection is made (null or undefined selection)
  }

  // Update the dots based on the brush selection
  d3.selectAll('circle').classed('selected', (d) => isCommitSelected(selection, d));

  // Call function to update the selection count
  renderSelectionCount(selection);

  // Call function to update the language breakdown
  renderLanguageBreakdown(selection);
}


function renderSelectionCount(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d)) // Get the selected commits based on the selection
    : [];

  // Update the count element text content
  const countElement = document.querySelector('#selection-count');
  countElement.textContent = `${selectedCommits.length || 'No'} commits selected`;

  return selectedCommits;
}

// Add CSS to style selected dots
const style = document.createElement('style');
style.innerHTML = `
  circle.selected {
    fill: #ff6b6b;
  }
`;
document.head.appendChild(style);

commits = processCommits(data);
let NUM_ITEMS = commits.length;
let ITEM_HEIGHT = 120; // You can fine-tune this later
let VISIBLE_COUNT = 10;
let totalHeight = (NUM_ITEMS - 1) * ITEM_HEIGHT;

const scrollContainer = d3.select('#scroll-container');
const spacer = d3.select('#spacer');
spacer.style('height', `${totalHeight}px`);

const itemsContainer = d3.select('#items-container');

scrollContainer.on('scroll', () => {
  const scrollTop = scrollContainer.property('scrollTop');
  let startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
  startIndex = Math.max(0, Math.min(startIndex, commits.length - VISIBLE_COUNT));
  renderItems(startIndex);
});

timeScale = d3.scaleTime()
  .domain(d3.extent(commits, d => d.datetime))
  .range([0, 100]);

filterCommitsByTime();
updateScatterPlot(data, filteredCommits);


function renderTooltipContent(commit) {
  if (!commit) return;
  document.getElementById('commit-link').href = commit.url;
  document.getElementById('commit-link').textContent = commit.id;
  document.getElementById('commit-date').textContent = commit.datetime?.toLocaleString('en', {
    dateStyle: 'full',
  });
  document.getElementById('commit-author').textContent = commit.author;
  document.getElementById('commit-time').textContent = commit.time;
  document.getElementById('commit-lines').textContent = commit.totalLines;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX + 10}px`;
  tooltip.style.top = `${event.clientY + 10}px`;
}

function updateTooltipVisibility(show) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.display = show ? 'block' : 'none';
}

function updateSelectedTime() {
  const commitMaxTime = timeScale.invert(commitProgress);
  d3.select("#selectedTime").text(commitMaxTime.toLocaleString(undefined, {
    dateStyle: "long",
    timeStyle: "short"
  }));

  filterCommitsByTime();
  updateScatterPlot(data, filteredCommits);
  renderCommitInfo(data, filteredCommits); // ✅ this updates the stats

  // Extract all lines from the filtered commits
const lines = filteredCommits.flatMap((d) => d.lines);

// Group lines by file
let files = d3.groups(lines, d => d.file).map(([name, lines]) => ({ name, lines }));

files = d3.sort(files, d => -d.lines.length);


// Clear existing file entries
d3.select('#file-chart').selectAll('div').remove();

// Bind new data
const filesContainer = d3.select('#file-chart')
  .selectAll('div')
  .data(files)
  .enter()
  .append('div');

filesContainer.append('dt')
.html(d => `<code>${d.name}</code><small>${d.lines.length} lines</small>`);

filesContainer.append('dd')
  .selectAll('div')
  .data(d => d.lines)
  .enter()
  .append('div')
  .attr('class', 'line')
  .style('background', d => fileTypeColors(d.type));



}

updateSelectedTime();


function filterCommitsByTime() {
  const commitMaxTime = timeScale.invert(commitProgress);
  filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);
}

function renderItems() {
  itemsContainer.selectAll('.item').remove();

  itemsContainer.selectAll('div')
    .data(commits)
    .enter()
    .append('div')
    .attr('class', 'item')
    .html((d, i) => {
      const dateStr = d.datetime.toLocaleString("en", {
        dateStyle: "full",
        timeStyle: "short"
      });
      const fileCount = d3.rollups(d.lines, D => D.length, d => d.file).length;
      return `
        <p>
          On ${dateStr}, I made
          <a href="${d.url}" target="_blank">
            ${i > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'}
          </a>. I edited ${d.totalLines} lines across ${fileCount} files.
          Then I looked over all I had made, and I saw that it was very good.
        </p>
      `;
    });
}





renderItems();

const scrollEl = document.getElementById('scroll-container');

scrollEl.addEventListener('scroll', () => {
  const scrollTop = scrollEl.scrollTop;
  const scrollHeight = scrollEl.scrollHeight - scrollEl.clientHeight;
  const scrollFraction = scrollTop / scrollHeight;

  // Map scroll % to time
  const maxTime = d3.scaleLinear()
    .domain([0, 1])
    .range(d3.extent(commits, d => d.datetime))(scrollFraction);

  const visibleCommits = commits.filter(d => d.datetime <= maxTime);

  updateScatterPlot(data, visibleCommits);
});


function displayCommitFiles(commitsToShow = filteredCommits) {
  const lines = commitsToShow.flatMap(d => d.lines);

  const fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);

  let files = d3.groups(lines, d => d.file)
    .map(([name, lines]) => ({ name, lines }));

  files = d3.sort(files, d => -d.lines.length);

  // ✅ FIX: clear the correct container
  d3.select('#file-chart').selectAll('div').remove();

  // ✅ FIX: select the correct target for the unit visualization
  const filesContainer = d3.select('#file-chart')
    .selectAll('div')
    .data(files)
    .enter()
    .append('div');

  filesContainer.append('dt')
    .html(d => `<code>${d.name}</code><small>${d.lines.length} lines</small>`);

  filesContainer.append('dd')
    .selectAll('div')
    .data(d => d.lines)
    .enter()
    .append('div')
    .attr('class', 'line')
    .style('background', d => fileTypeColors(d.type));
}


function renderFileNarrative() {
  const fileItemsContainer = d3.select('#file-items-container');

  fileItemsContainer.selectAll('.file-item').remove();

  fileItemsContainer.selectAll('div')
    .data(commits)
    .enter()
    .append('div')
    .attr('class', 'file-item')
    .html((d, i) => {
      const dateStr = d.datetime.toLocaleString("en", {
        dateStyle: "full",
        timeStyle: "short"
      });
      const fileCount = d3.rollups(d.lines, D => D.length, d => d.file).length;
      return `
        <p>
          On ${dateStr}, I edited <strong>${d.totalLines}</strong> lines across
          <strong>${fileCount}</strong> files as part of
          <a href="${d.url}" target="_blank">
            ${i > 0 ? 'another great commit' : 'my first mighty commit'}
          </a>.
        </p>
      `;
    });
}


const fileScrollEl = document.getElementById('file-scroll-container');

fileScrollEl.addEventListener('scroll', () => {
  const scrollTop = fileScrollEl.scrollTop;
  const scrollHeight = fileScrollEl.scrollHeight - fileScrollEl.clientHeight;
  const scrollFraction = scrollTop / scrollHeight;

  const commitMaxTime = d3.scaleLinear()
    .domain([0, 1])
    .range(d3.extent(commits, d => d.datetime))(scrollFraction);

  const visibleCommits = commits.filter(d => d.datetime <= commitMaxTime);

  // 🔄 Link file scrolly to the unit viz
  displayCommitFiles(visibleCommits);
});

renderFileNarrative();
displayCommitFiles(commits); // show everything initially










