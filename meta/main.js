import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

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
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');
  
    // Total LOC
    dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd').text(data.length);
  
    // Total commits
    dl.append('dt').text('Total commits');
    dl.append('dd').text(commits.length);
  
    // Number of files in the codebase
    dl.append('dt').text('Number of files');
    dl.append('dd').text(d3.groups(data, d => d.file).length);
  
    // Average file length (in lines)
    const fileLengths = d3.rollups(
      data,
      v => d3.max(v, d => d.line),
      d => d.file
    );
    const avgFileLength = d3.mean(fileLengths, d => d[1]);
    dl.append('dt').text('Average file length (lines)');
    dl.append('dd').text(avgFileLength.toFixed(1));
  
    // Average line length (in characters)
    const avgLineLength = d3.mean(data, d => d.length);
    dl.append('dt').text('Average line length (chars)');
    dl.append('dd').text(avgLineLength.toFixed(1));
  
    // Average depth
    const avgDepth = d3.mean(data, d => d.depth);
    dl.append('dt').text('Average depth');
    dl.append('dd').text(avgDepth.toFixed(2));
  
    // Average file depth: average of max depth per file
    const fileDepths = d3.rollups(
      data,
      v => d3.max(v, d => d.depth),
      d => d.file
    );
    const avgFileDepth = d3.mean(fileDepths, d => d[1]);
    dl.append('dt').text('Average file depth');
    dl.append('dd').text(avgFileDepth.toFixed(2));
  }
  


const data = await loadData();
const commits = processCommits(data);
renderCommitInfo(data, commits);
