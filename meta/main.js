import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let commits = [];  // Declare commits globally
let xScale, yScale; // Declare xScale and yScale globally

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

function renderCommitInfo(data, commits) {
  const container = d3.select('#stats')
    .append('div')
    .attr('class', 'summary-box');

  container.append('h2').text('Summary');

  const dl = container.append('dl').attr('class', 'stats');

  // Total LOC
  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);

  // Total commits
  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

  // Number of files
  dl.append('dt').text('Number of files');
  dl.append('dd').text(d3.groups(data, d => d.file).length);

  // Average file length
  const fileLengths = d3.rollups(data, v => d3.max(v, d => d.line), d => d.file);
  const avgFileLength = d3.mean(fileLengths, d => d[1]);
  dl.append('dt').text('Average file length (lines)');
  dl.append('dd').text(avgFileLength.toFixed(1));

  // Average line length
  const avgLineLength = d3.mean(data, d => d.length);
  dl.append('dt').text('Average line length (chars)');
  dl.append('dd').text(avgLineLength.toFixed(1));

  // Average depth
  const avgDepth = d3.mean(data, d => d.depth);
  dl.append('dt').text('Average depth');
  dl.append('dd').text(avgDepth.toFixed(2));
}

const data = await loadData();
renderCommitInfo(data, commits);

async function renderScatterPlot() {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  let data = await loadData();
  commits = processCommits(data); // Store commits globally

  // Sort commits by totalLines in descending order
  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  // Compute min and max total lines per commit
  const [minLines, maxLines] = d3.extent(sortedCommits, d => d.totalLines);

  // Define square root scale for radius
  const rScale = d3
    .scaleSqrt()
    .domain([minLines, maxLines])
    .range([2, 30]);

  // Declare the scales globally
  xScale = d3
    .scaleTime()
    .domain(d3.extent(sortedCommits, d => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  yScale = d3.scaleLinear().domain([0, 24]).range([usableArea.bottom, usableArea.top]);

  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);

  gridlines
    .call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width))
    .selectAll('line')
    .attr('stroke', (d) => {
      const hour = d;
      if (hour >= 6 && hour < 18) {
        return d3.interpolateOranges((hour - 6) / 12);
      } else {
        return d3.interpolateBlues((hour - 18) / 12);
      }
    })
    .attr('stroke-width', 1.5);

  const dots = svg.append('g').attr('class', 'dots');

  dots
    .selectAll('circle')
    .data(sortedCommits)
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

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale).tickFormat(d => String(d % 24).padStart(2, '0') + ':00');

  svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);

  // Call the brush function after scatter plot rendering
  createBrushSelector(svg);
}

function createBrushSelector(svg) {
  // Create brush
  svg.call(d3.brush().on('start brush end', brushed));

  // Raise dots above overlay
  svg.selectAll('.dots, .overlay ~ *').raise();
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
  const requiredCommits = selectedCommits.length ? selectedCommits : commits;
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

renderScatterPlot();

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

