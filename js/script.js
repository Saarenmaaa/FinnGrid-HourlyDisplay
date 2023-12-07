const myHeaders = new Headers()
myHeaders.append("x-api-key", "IpheXhkURc4pk7faSVft6ElLAFHrFUE7TjWf9YHh")

const requestOptions = {
  method: 'GET',
  headers: myHeaders,
  redirect: 'follow'
}

// Päivä inputit
let startInput = document.querySelector('#start-date');
let endInput = document.querySelector('#end-date');

function getValue() {
  const selectedValue = document.querySelector('input[name="data-type"]:checked').value;
  return selectedValue
}

// Datan Haku
async function getData() {
  d3.selectAll("#wrapper > *").remove();
  // Data
  const apiUrl = "https://api.fingrid.fi/v1/variable/" + String(getValue()) + "/events/csv?start_time=" + String(startInput.value) + "T00:00:00Z&end_time=" + String(endInput.value) + "T23:59:59Z"
  const dataset = await d3.csv(apiUrl, requestOptions)

  const dateParser = d3.timeParse("%Y-%m-%dT%H:%M:%S+0000") 
  const xAccessor = d => dateParser(d.start_time)
  const yAccessor = d => Number(d.value)
  const meanValue = d3.mean(dataset, yAccessor);

  
  
  // 2. Mitoitus graafille
  const dimensions = {
    width: window.innerWidth * 0.9,
    height: 500,
    margin: {
        top: 15,
        right: 15,
        bottom: 40,
        left: 60
    }
  }
  dimensions.boundedWidth = dimensions.width -
      dimensions.margin.left -
      dimensions.margin.right

  dimensions.boundedHeight = dimensions.height -
      dimensions.margin.top -
      dimensions.margin.bottom


  // 3. Pohja
  const wrapper = d3.select("#wrapper")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height)

  const boundingBox = wrapper.append("g")
    .style("transform", `translate(
      ${dimensions.margin.left}px, 
      ${dimensions.margin.top}px)`)

  // 4. Skaalaimet
  const xScale = d3.scaleTime()
      .domain(d3.extent(dataset, xAccessor))
      .range([0, dimensions.boundedWidth])

  const yScale = d3.scaleLinear()
      .domain(d3.extent(dataset, yAccessor))
      .range([dimensions.boundedHeight, 0])
  console.log(d3.extent(dataset, yAccessor))
  
  // 5. Datan piirto
  const dataDraw = boundingBox.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", dimensions.boundedWidth)
    .attr("height", dimensions.boundedHeight)
    .attr("fill", "rgb(173, 216, 230, 0.3)")
  
  const lineGenerator = d3.line()
    .x(d => xScale(xAccessor(d)))
    .y(d => yScale(yAccessor(d)))
  
  boundingBox.append("path")
    .attr("d", lineGenerator(dataset))
    .attr("fill", "none")
    .attr("stroke", "black")
  
  boundingBox.append("line")
    .attr("x1", 0)
    .attr("y1", yScale(meanValue))
    .attr("x2", dimensions.boundedWidth)
    .attr("y2", yScale(meanValue))
    .attr("stroke", "red")
    .attr("stroke-dasharray", "5 5")
    .attr("stroke-width", 2);
  
  boundingBox.append("text")
    .attr("class", "meanText")
    .attr("x", dimensions.boundedWidth - 130)
    .attr("y", yScale(meanValue) - 5)
    .attr("text-anchor", "center")
    .attr("font-size", "15px")
    .attr("fill", "black")
    .text("Mean: " + meanValue.toFixed(0) + " MWh/h")
    
  const selectedRadio = document.querySelector('input[name="data-type"]:checked');
  const selectedLabel = selectedRadio.parentElement.textContent.trim();

  boundingBox.append("text")
    .attr("class", "chart-title")
    .attr("x", dimensions.boundedWidth / 2)
    .attr("y", 25)
    .attr("text-anchor", "middle")
    .text(selectedLabel)
    .attr("font-size", "28px")

  // 6. Akselit ja muut
  const xAxisGenerator = d3.axisBottom()
    .scale(xScale)
  
  const yAxisGenerator = d3.axisLeft()
    .scale(yScale)
  
  const xAxis = boundingBox.append("g")
    .call(xAxisGenerator)
    .style("transform", `translateY(${dimensions.boundedHeight}px)`)
      
  const yAxis = boundingBox.append("g")
    .call(yAxisGenerator)
  
  wrapper.append("text")
    .attr("y", 15) 
    .attr("x", -dimensions.boundedHeight/2)
    .attr("transform", "rotate(-90)")
    .style("text-anchor", "middle")
    .text("MWh/h")
    .attr("font-size", "18px")
    
  wrapper.append("text")
    .attr("y", 490) 
    .attr("x", dimensions.boundedWidth/2)
    .text("Date")
    .attr("font-size", "18px")

  // Ympyrät datoihin
  const circles = boundingBox.selectAll("circle")
    .data(dataset)
    .enter()
    .append("circle")
    .attr("cx", d => xScale(xAccessor(d)))
    .attr("cy", d => yScale(yAccessor(d)))
    .attr("r", 3)
    .attr("fill", "black");

  // tooltip 
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
  
  const dateFormatter = d3.timeFormat("%a %b %d <br> %H:%M");
  circles.on("mouseenter", (event, d) => {
      tooltip.transition()
        .duration(200)
        .style("opacity", 1);
      tooltip.html(`${yAccessor(d)} MWh/h <br> ${dateFormatter(xAccessor(d))}`)
        .style("left", (event.pageX - tooltip.node().getBoundingClientRect().width) - 10 + "px")
        .style("top", (event.pageY - 30) + "px")
    })
    .on("mouseleave", () => {
      tooltip.transition()
        .duration(200)
        .style("opacity", 0);
    });
}

const button = d3.select("button")
  .on("click", getData) 
