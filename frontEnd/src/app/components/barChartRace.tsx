'use client';

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// Define interfaces for type safety
interface BrandData {
  name: string;
  value: number;
  lastValue: number;
  year: number;
  colour: string;
  rank?: number;
}

// const convertUnixToYearDecimal = (unixTime: number): number => {
//   const date = new Date(unixTime * 1000); // Convert to milliseconds
//   const year = date.getFullYear();
//   const startOfYear = new Date(year, 0, 1).getTime();
//   const endOfYear = new Date(year + 1, 0, 1).getTime();
//   const yearFraction = (unixTime * 1000 - startOfYear) / (endOfYear - startOfYear);
//   return year + yearFraction;
// };

// const halo = (text: d3.Selection<SVGTextElement, unknown, null, undefined>, strokeWidth: number): void => {
//   text.each(function () {
//     const parent = this.parentNode;
//     if (parent) {
//       const clone = this.cloneNode(true) as Element;
//       parent.insertBefore(clone, this);
//       d3.select(clone)
//       .style('fill', '#ffffff')
//       .style('stroke','#ffffff')
//       .style('stroke-width', strokeWidth)
//       .style('stroke-linejoin', 'round')
//       .style('opacity', 1);
      
//       // erase the old text
//       // d3.select(clone)
//       //   .attr('fill', 'none')
//       //   .attr('stroke', 'none');

//     }
//   });
// };
const D3BarChart: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const width = 960;
  const height = 600;

  useEffect(() => {
    // Ensure we're only running this on the client
    if (typeof window === 'undefined') return;

    // Remove any existing SVG to prevent duplicate renders
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const tickDuration = 300;
    const top_n = 12;

    const margin = {
      top: 80,
      right: 0,
      bottom: 5,
      left: 0,
    };

    const barPadding = (height - (margin.bottom + margin.top)) / (top_n * 5);

    // Add title, subtitle, and caption
    svg.append("text")
      .attr("class", "title")
      .attr("y", 24)
      .style("fill", "#eeeeee")
      .html("Top Bits Goa CodeForce Users");

    svg.append("text")
      .attr("class", "subTitle")
      .attr("y", 55)
      .style("fill", "#eeeeee")
      .html("Rating");

    svg.append("text")
      .attr("class", "caption")
      .attr("x", width)
      .attr("y", height - 5)
      .style("text-anchor", "end")
      .style("fill", "#eeeeee")
      .html("Source: CodeForces");

    let year = 2000;

    // Fetch CSV data - adjust path for Next.js public folder
    d3.csv("/brand_values.csv").then((data) => {
      const processedData: BrandData[] = data.map((d) => ({
        name: d.name,
        value: +d.value || 0,
        lastValue: +d.lastValue || 0,
        year: +d.year || 0,
        colour: d3.hsl((Math.random() * (0.9 - 0.1) + 0.1) * 500, 0.8, 0.8).toString(),
      }));

      const maxYear = d3.max(processedData, (d) => d.year) || 0;
      const maxValue = d3.max(processedData, (d) => d.value) || 0;

      let yearSlice = processedData
        .filter((d) => d.year === year && !isNaN(d.value))
        .sort((a, b) => b.value - a.value)
        .slice(0, top_n)
        .map((d, i) => ({ ...d, rank: i }));

      const x = d3.scaleLinear()
        .domain([0, d3.max(yearSlice, (d) => d.value-100) || 0])
        .range([margin.left, 900]);

      const y = d3.scaleLinear()
        .domain([top_n, 0])
        .range([height - margin.bottom, margin.top]);

      const xAxis = d3.axisTop(x)
        .ticks(5)
        .tickSize(-(height - margin.top - margin.bottom))
        .tickFormat(d3.format(","));

      svg.append("g")
        .attr("class", "axis xAxis")
        .attr("transform", `translate(0, ${margin.top})`)
        .call(xAxis)
        .selectAll(".tick line")
        .style("stroke", "#666666")
        .classed("origin", (d) => d === 0);

      svg.selectAll(".tick text")
        .style("fill", "#ffffff") // Tick text color
        .style("font-size", "12px");
      // Rest of the implementation follows the original code...
      // (Note: For brevity, I've omitted the full interval and rendering logic)
      // You would continue the implementation similarly to the original component

      svg
        .selectAll<SVGRectElement, BrandData>("rect.bar") // Explicitly type the selection
        .data(yearSlice, (d) => d.name)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", x(0) + 1)
        .attr("width", (d: BrandData) => x(d.value) - x(0) - 1)
        .attr("y", (d) => y(d.rank) + 5)
        .attr("height", y(1) - y(0) - barPadding)
        .style("fill", (d) => d.colour);

      svg
        .selectAll<SVGRectElement, BrandData>("text.label")
        .data(yearSlice, (d) => d.name)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", (d) => x(d.value) - 8)
        .attr("y", (d) => y(d.rank) + 5 + (y(1) - y(0)) / 2 + 1)
        .style("text-anchor", "end")
        .html((d) => d.name);

      svg
        .selectAll<SVGRectElement, BrandData>("text.valueLabel")
        .data(yearSlice, (d) => d.name)
        .enter()
        .append("text")
        .style("fill", "#eeeeee")
        .attr("class", "valueLabel")
        .attr("x", (d) => x(d.value) + 5)
        .attr("y", (d) => y(d.rank) + 5 + (y(1) - y(0)) / 2 + 1)
        .text((d) => d3.format(",.0f")(d.lastValue));

      const yearText = svg
        .append("text")
        .attr("class", "yearText")
        .attr("x", width - margin.right)
        .attr("y", height - 25)
        .style("text-anchor", "end")
        .style("fill", "#e7e7e7") // Text color
        .style("font-size", "48px") // Increase font size
        .style("font-weight", "bold") // Make text bold
        .style("stroke", "#ffffff") // Optional: Add a stroke for contrast
        .style("stroke-width", 1) // Make the stroke thicker for visibility
        .style("stroke-linejoin", "round")
        .html(year.toString().split(".")[0]);
        // .call(halo, 0);
      // Ticker interval would be set up here
      const ticker = d3.interval(() => {
        // Interval logic remains the same as in the original component
        // Update year slice, redraw bars, labels, etc.
      yearSlice = processedData
                .filter((d) => +d.year == year && !isNaN(+d.value))
                .sort((a, b) => b.value - a.value)
                // set the values of the undefined to 0
                
                .slice(0, top_n)  
                .map((d, i) => ({ ...d, rank: i }));

        // yearSlice.forEach((d, i) => (d.rank = i));
        // console.log(yearSlice.map())
        // yearText.html(year.toString());
        // console.log(yearSlice[0]);

        //console.log('IntervalYear: ', yearSlice);

        // let maxxVall = d3.max(yearSlice, (d) => d.value) || 0;
        
        x.domain([0, yearSlice[0].value]);
        // x.range([margin.left, width - margin.right]);
        // print the largest value of the yearSlice.value
        
// const xAxis: d3.Axis<d3.NumberValue> = d3.axisTop(x);

svg.select(".xAxis")
  .transition()
  .duration(tickDuration)
  .ease(d3.easeLinear)
  .call((g) => xAxis(g as unknown as d3.Selection<SVGGElement, unknown, HTMLElement, unknown>));

        const bars = svg.selectAll<SVGRectElement, BrandData>(".bar").data(yearSlice, (d) => d.name);

        bars
          .enter()
          .append("rect")
          .attr("class", (d) => `bar ${d.name.replace(/\s/g, "_")}`)
          .attr("x", x(0) + 1)
          // .attr("width", (d) => x(d.value) - x(0) - 1)
          // .attr("width", (d) => Math.min(x(d.value) - x(0) - 1, width - margin.right - x(0) - 1)) // Ensure bars do not exceed the right boundary
          .attr("width", (d) => ((x(d.value) - x(0))/maxValue)*width) // Ensure bars do not exceed the right boundary
          .attr("y", y(top_n + 1) + 5)
          .attr("height", y(1) - y(0) - barPadding)
          // .style("fill", (d) => d.colour)
          .transition()
          .duration(tickDuration)
          .ease(d3.easeLinear)
          .attr("y", (d) => y(d.rank) + 5)
          .style("fill", d3.hsl((Math.random() * (0.9 - 0.5) + 0.5) * 500, 0.8, 0.8).toString());

        bars
          .transition()
          .duration(tickDuration)
          .ease(d3.easeLinear)
          // .attr("width", (d) => x(d.value) - x(0) - 1)
          // .attr("width", (d) => Math.min(x(d.value) - x(0) - 1, width - margin.right - x(0) - 1)) // Ensure bars do not exceed the right boundary
          .attr("width", (d) => ((x(d.value)-x(0)-1)/1)*1) // Ensure bars do not exceed the right boundary
          .attr("y", (d) => y(d.rank) + 5);
          // .style("fill", d3.hsl(Math.random() * 360, 0.75, 0.75).toString());
          // .style("fill", (d) => d.colour); // Ensure color is set for each bar

        bars
          .exit()
          .transition()
          .duration(tickDuration)
          .ease(d3.easeLinear)
          // .attr("width", (d) => x(d.value) - x(0) - 1)
          .attr("y", y(top_n + 1) + 5)
          .remove();

        const labels = svg.selectAll<SVGRectElement, BrandData>(".label").data(yearSlice, (d) => d.name);

        labels
          .enter()
          .append("text")
          .attr("class", "label")
          .attr("width", (d) => Math.min(x(d.value) - x(0) - 1, width - margin.right - x(0) - 1)) // Ensure bars do not exceed the right boundary
          .attr("x", (d) => x(d.value) - 8)
          .attr("y", y(top_n + 1) + 5 + (y(1) - y(0)) / 2)
          .style("text-anchor", "end")
          .html((d) => d.name)
          .transition()
          .duration(tickDuration)
          .ease(d3.easeLinear)
          .attr("y", (d) => y(d.rank) + 5 + (y(1) - y(0)) / 2 + 1);

        labels
          .transition()
          .duration(tickDuration)
          .attr("width", (d) => Math.min(x(d.value) - x(0) - 1, width - margin.right - x(0) - 1)) // Ensure bars do not exceed the right boundary
          .ease(d3.easeLinear)
          .attr("x", (d) => x(d.value) - 8)
          .attr("y", (d) => y(d.rank) + 5 + (y(1) - y(0)) / 2 + 1);

        labels
          .exit()
          .transition()
          .duration(tickDuration)
          // .attr("width", (d) => Math.min(x(d.value) - x(0) - 1, width - margin.right - x(0) - 1)) // Ensure bars do not exceed the right boundary
          .ease(d3.easeLinear)
          // .attr("x", (d) => x(d.value) - 8)
          .attr("y", y(top_n + 1) + 5)
          .remove();

        const valueLabels = svg
          .selectAll<SVGRectElement, BrandData>(".valueLabel")
          .data(yearSlice, (d) => d.name);

        valueLabels
          .enter()
          .append("text")
          .attr("class", "valueLabel")
          .attr("x", (d) => x(d.value) + 5)
          .attr("y", y(top_n + 1) + 5)
          .text((d) => d3.format(",.0f")(d.lastValue))
          .transition()
          .style("fill", "#ffffff")
          .duration(tickDuration)
          .ease(d3.easeLinear)
          .attr("y", (d) => y(d.rank) + 5 + (y(1) - y(0)) / 2 + 1);

        valueLabels
          .transition()
          .duration(tickDuration)
          .ease(d3.easeLinear)
          .attr("x", (d) => x(d.value) + 5)
          .attr("y", (d) => y(d.rank) + 5 + (y(1) - y(0)) / 2 + 1)
          .tween("text", function (d) {
            const i = d3.interpolateRound(d.lastValue, d.value);
            return function (t) {
              this.textContent = d3.format(",")(i(t));
            };
          });

        valueLabels
          .exit()
          .transition()
          .duration(tickDuration)
          .ease(d3.easeLinear)
          // .attr("x", (d) => x(d.value) + 5)
          .attr("y", y(top_n + 1) + 5)
          .remove();
          
        yearText.html(year.toString().split(".")[0]);


        // if (year === 2001) ticker.stop();
        
        if (year === maxYear) ticker.stop();
        year = +d3.format(".1f")(year + 0.1);
      }, tickDuration);
    });
  }, []); // Empty dependency  array ensures this runs once on mount

  return (
    <div className="w-full overflow-x-auto">
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default D3BarChart;