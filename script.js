import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm'

(async () => {
  const endpoint = 'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/cyclist-data.json'
  const data = await getData(endpoint)
  
  const svgWidth = 900
  const svgHeight = 600
  const svgPadding = 50

  const xDomain = [
    new Date(d3.min(data, (d) => d['Year'] - 1), 0),
    new Date(d3.max(data, (d) => d['Year'] + 1), 0)
  ]

  const yDomain = [
    dateTimeFormat(d3.max(data, (d) => d['Time'])),
    dateTimeFormat(d3.min(data, (d) => d['Time']))
  ]

  const svg = d3
    .select('.svg-container')
    .append('svg')
    .attr('width', svgWidth)
    .attr('height', svgHeight)

  const xScale = d3.scaleTime(
    xDomain,
    [svgPadding, svgWidth - svgPadding]
  )

  const yScale = d3.scaleTime(
    yDomain,
    [svgHeight - svgPadding, svgPadding]
  )

  const [ blue, orange ] = d3.schemeCategory10

  svg
    .append('g')
    .attr('id', 'x-axis')
    .attr('transform', `translate(0, ${svgHeight - svgPadding})`)
    .call(d3.axisBottom(xScale))

  svg
    .append('g')
    .attr('id', 'y-axis')
    .attr('transform', `translate(${svgPadding}, 0)`)
    .call(d3.axisLeft(yScale).tickFormat(d3.timeFormat('%M:%S')))
  
  svg
    .append('text')
    .attr('x', 10)
    .attr('y', 40)
    .style('font-size', '.8em')
    .text('Time in Minutes')
  
  createColorLegend(
    svg,
    [orange, blue],
    ['No doping allegations', 'Riders with doping allegations'],
    svgWidth - svgPadding,
    svgHeight / 2
  )

  const plots = svg
    .selectAll('.dot')
    .data(data)
    .join('circle')
    .classed('dot', true)
    .attr('cx', (d) => xScale(new Date(d['Year'], 0)))
    .attr('cy', (d) => yScale(dateTimeFormat(d['Time'])))
    .attr('r', 5)
    .attr('data-xvalue', (d) => d['Year'])
    .attr('data-yvalue', (d) => dateTimeFormat(d['Time']).toISOString())
    .attr('fill', (d) => d['Doping'] ? blue : orange)
  
  plots.on('mouseover', (event, d) => {
    const [ x, y ] = d3.pointer(event, svg)
    const color = d['Doping'] ? blue : orange
    activateTooltip(d, x, y, color)
  })

  plots.on('mouseout', () => deactivateTooltip())
})()

async function getData(url) {
  const response = await fetch(url)
  return await response.json()
}

function dateTimeFormat(time) {
  const [ minutes, seconds ] = time.split(':')
  const date = new Date(1970, 0, 1, 0, minutes, seconds)
  return date
}

function createColorLegend(svgElement, colors, legends, x, y) {
  const legend = svgElement
    .append('g')
    .attr('id', 'legend')
    .attr('transform', `translate(${x}, ${y})`)
  
  colors.forEach((color, index) => {
    const label = legend
      .append('g')
      .classed('label', true)
      .attr('transform', `translate(0, ${index * 20})`)
    
    label
      .append('rect')
      .attr('x', 5)
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', color)
    
    label
      .append('text')
      .attr('y', 12)
      .attr('text-anchor', 'end')
      .text(legends[index])
      .style('font-size', '.8em')
  })
}

function activateTooltip(data, x, y, color) {
  const position = x >= innerWidth / 2 ? 'calc(-100% - 10px)' : '10px'
  d3
    .select('#tooltip')
    .classed('active', true)
    .attr('data-year', data['Year'])
    .style('left', x + 'px')
    .style('top', y + 'px')
    .style('transform', `translate(${position}, -50%)`)
    .style('background-color', color)
    .html(`
      <p>
        ${data['Name']}: ${data['Nationality']}<br>
        Year: ${data['Year']}, Time: ${data['Time']}
      </p>
      <p>${data['Doping']}</p>
    `)
}

function deactivateTooltip() {
  d3.select('#tooltip').classed('active', false)
}
