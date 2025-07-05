
function loadData(year,continent) {
   let dataFilePath = `data/total_avg_${year}.json`; // getting file for the required year
   Promise.all([
      // loading the file from path constuctted
      d3.json(dataFilePath),
      d3.json('data/country_codes_mapping.json'), // country code to make it easy to load svg for flags
      d3.json('data/continent-country.json') // continent to country from the csv file , preprocessed for reducing redundant computation
   ]).then(function([data, countryCodes,contientmap]) {
      d3.select('svg').selectAll('*').remove(); // this removes the previous plot


      const countries_con= contientmap[continent]; // gets the array of country for a given continent , returns a list of all contries if it all

      // filters the data from the data file based on continent
      let filteredData = data.filter(d => countries_con.includes(d.country));

      // sets margin for svg
      const margin = { top: 20, right: 30, bottom: 30, left: 40 };

      const svg = d3.select("svg"),
         width = +svg.attr("width") - margin.left - margin.right,
         height = +svg.attr("height") - margin.top - margin.bottom;

      // sets linear scale for x axis as it only varies from 0-100
      const x = d3.scaleLinear()
         .domain([0, 100]) // hardcoded to 100
         .range([0, width]);

      // used a logarithmic scale as the power of value of y is much higher than x and this makes the visualisation clearl
      const y = d3.scaleLog()
         .domain([1, d3.max(filteredData, d => d.total)]) // getting max based on present data
         .range([height, 0])
         .nice(); // visaul improvement to end on round value


      const g = svg.append("g")
         .attr("transform", `translate(${margin.left},${margin.top})`);


      // Plot the position for the X and Y axis
      g.append("g")
          .attr("transform", `translate(0,${height})`)
          .call(d3.axisBottom(x));

      g.append("g")
          .call(d3.axisLeft(y).ticks(null, ".1s"));

      // the flag data is in country codes , hence we translate it using the file with the translation present
      filteredData.forEach(d => {
         if (d.country in countryCodes) {
             d.countryCode = countryCodes[d.country].toLowerCase();
             console.log(d.countryCode);
         } else {
             console.warn(`No code found for country: ${d.country}`);
             d.countryCode = "";
            }
      });

      // Append flag images for each data point
      g.selectAll(".flag")
        .data(filteredData)
        .enter().append("image")
        .attr("class", "flag")
        .attr("xlink:href", d => `flags/${d.countryCode}.svg`) // getting the correct flag based on country code
        .attr("width", 20) // flag width
        .attr("height", 20)// flag height
        .style("filter", "grayscale(100%)")
        // used square for asthetics and minimising obstruction

         // another visual feature that ensures the point is on the centre of the flag and not the corner , to make reading easier
        .attr("x", d => x(d.average) - 10)
        .attr("y", d => y(d.total) - 10)
        .on("mouseover", function(event, d) {
           // adding tooltip that gives extra information on hover
           d3.select("#tooltip")
                 .style("visibility", "visible")
                 .html(`Country: ${d.country}<br>Average: ${d.average.toFixed(2)}<br>Total: ${d.total.toFixed(2)}`)
                 .style("left", (event.pageX + 10) + "px")
                 .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
           // removing the tooltip
           d3.select("#tooltip").style("visibility", "hidden");
        });

   });
}


// plotting the first scatterplot with default values
loadData("all", "all");

// listener for the year selector
document.getElementById('yearSelector').addEventListener('change', function() {
   const selectedYear = this.value; // new year
   const selectedContinent = document.getElementById('continentSelector').value; // to get the current continent as it doesnt change when year is changes
   loadData(selectedYear, selectedContinent); // new plot
});

// Event listener for the continent selector
document.getElementById('continentSelector').addEventListener('change', function() {
    const selectedYear = document.getElementById('yearSelector').value; // similar to above listener fetches year
    const selectedContinent = this.value; // new continent
    loadData(selectedYear, selectedContinent);
});
