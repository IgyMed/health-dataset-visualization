import * as d3 from "d3";

const enc_dict = {
  "HadHeartAttack": {
    "binary": {"No":0, "Yes":1},
    "nary": null
  },
  "HadAngina": {
    "binary": {"No":0, "Yes":1},
    "nary": null
  },
  "HadSkinCancer": {
    "binary": {"No":0, "Yes":1},
    "nary": null
  },
  "HadStroke": {
    "binary": {"No":0, "Yes":1},
    "nary": null
  },
  "SmokerStatus": {
    "binary": {"Never smoked": 0, 
               "Current smoker - now smokes every day": 1, 
               "Current smoker - now smokes some days": 1, 
               "Former smoker": 1},
    "nary": {"Never smoked": 0,                          
             "Current smoker - now smokes every day": 1,
             "Current smoker - now smokes some days": 2,
             "Former smoker": 3}
  }
};

function encoding(col, bin_enc_dict) {
  const enc_col = [];
  for(let i=0;i<col.length;i++) {
      enc_col[i] = bin_enc_dict[col[i]];
  }
  return enc_col;
}

function get_mean(col) {
  let val = 0;
  for(let i=0;i<col.length;i++){
    val += col[i];
  }
  return val/col.length;
}

function get_std(col) {
  let val = 0;
  let mean = get_mean(col);
  for(let i=0;i<col.length;i++){
    val += (col[i]-mean)**2;
  }
  val /= col.length;
  return Math.sqrt(val);
}

function get_cov(col1, col2) {
  const mean_1 = get_mean(col1);
  const mean_2 = get_mean(col2);
  let val = 0;
  for(let i=0;i<col1.length;i++){
    val += (col1[i]-mean_1)*(col2[i]-mean_2);
  }
  return val/col1.length;
}

function get_corr_coef(col1, col2) {
  const cov = get_cov(col1, col2);
  const std_1 = get_std(col1);
  const std_2 = get_std(col2);
  return cov / (std_1 * std_2);
}

function init_array(dim1, dim2, val_2_set) {
  let outer_arr = new Array(dim1);
  for(let i=0;i<dim1;i++) {
    if(dim2 == 1){
      outer_arr[i] = val_2_set;
    } else {
      let inner_arr = new Array(dim2);
      for(let j=0;j<dim2;j++) {
        inner_arr[j] = val_2_set;
      }
      outer_arr[i] = inner_arr; 
    }
  }
  return outer_arr;
}

function encoding_n_ary(col, enc_dict) {
  const bin_enc_dict = enc_dict["binary"]
  const nary_enc_dict = enc_dict["nary"]
  
  const bin_enc_col = [];
  const nary_enc_col = new Map();

  for(let i=0;i<col.length;i++) {
    bin_enc_col[i] = bin_enc_dict[col[i]];
  }

  if(nary_enc_dict == null) {
    return {"binary": bin_enc_col, "nary": null};
  } 
  const nary_keys = Object.keys(nary_enc_dict)

  for(let i=0;i<nary_keys.length;i++) {
    nary_enc_col[nary_keys[i]] = init_array(col.length, 1, 0);
  }
  for(let i=0;i<col.length;i++) {
    nary_enc_col[col[i]][i] = 1;
  }
  return {"binary": bin_enc_col, "nary": nary_enc_col};
}

function get_enc_data_dict(dataset, enc_dict) {
  let enc_data_dict = new Map();

  for(let [col_name, val] of Object.entries(enc_dict)) {
    enc_data_dict[col_name] = encoding_n_ary(dataset.map(c => c[col_name]), val);
  }
  return enc_data_dict;
}

class Box {
  constructor(var1, var2, corr_coeff_val) {
    this.var1 = var1;
    this.var2 = var2;
    this.corr_coeff_val = corr_coeff_val;
  }
}

function construct_corr_coef_matrix_V2(data_matrix, var_names) {
  const iterations = var_names.length;
  let corr_coef_matrix = init_array(iterations, iterations, 1);

  for(let i=0;i<iterations;i++) {
    for(let j=0;j<iterations;j++) {
      corr_coef_matrix[i][j] = new Box(var_names[i], var_names[j], get_corr_coef(data_matrix[i], data_matrix[j]))
    }
  }
  return corr_coef_matrix;
}

export function MedicalHeatmap(data, {
  width = 800,
  height = 800,
  margin = {top: 20, right: 20, bottom: 40, left: 80}
} = {}) {
  const processedData = get_enc_data_dict(data, enc_dict);
  
  const data_matrix = [];
  const var_names = [];
  
  for(let [col_name, val] of Object.entries(processedData)) {
    data_matrix.push(val["binary"]);
    var_names.push(col_name);
  }
  
  const binar_map = construct_corr_coef_matrix_V2(data_matrix, var_names);
  
  const layout = {
    height: height,
    width: width,
    inner_offset: 10,
    outer_offset: 10,
    offset: 5,
    box_size: 100
  };

  const cov_matrix = heatmap_layout(binar_map, layout);

  const container = document.createElement("div");
  container.appendChild(draw_heatmap(cov_matrix, layout, processedData));
  
  return container;
}

function heatmap_layout(cov_matrix, layout) {
  const nr_boxes_per_row = cov_matrix.length;
  let box_layout = [];

  let x_top_left = 0;
  let y_top_left = 0;

  const total_heatmap_size = nr_boxes_per_row * layout.box_size + (nr_boxes_per_row - 1) * layout.offset;
  x_top_left = (layout.width / 2) - (total_heatmap_size / 2);
  y_top_left = (layout.height / 2) - (total_heatmap_size / 2);

  for(let i=0;i<nr_boxes_per_row;i++) {
    for(let j=0;j<nr_boxes_per_row;j++) {
      let x_start = x_top_left + i*(layout.box_size + layout.offset);
      let y_start = y_top_left + j*(layout.box_size + layout.offset);

      let box = {x: x_start, y:y_start, width: layout.box_size, height: layout.box_size, box: cov_matrix[i][j]};
      box_layout.push(box);
    }
  }
  return box_layout;
}

function draw_heatmap(cov_matrix, layout, data) {
  function show_tooltip(event, d) {
    tooltip
      .style("visibility", "visible")
      .text(`Corr: ${d.box.corr_coeff_val.toFixed(2)}`);
  }
  
  function display_tooltip(event, d) {
    tooltip
      .style("top", (event.pageY + 10) + "px")
      .style("left", (event.pageX + 10) + "px");
  }
      
  function hide_tooltip(event, d) {
    tooltip.style("visibility", "hidden");
  }
  
  function plot_detailed_heatmap(event, d) {

    let nary_var1 = data[d.box.var1]["nary"];
    let nary_var2 = data[d.box.var2]["nary"];
    
    if(nary_var1 === null && nary_var2 === null) {
      console.log("Not possible to show detailed correlation because neither variable has nary property");
      return;
    }
    
    let naryVar, binaryVar, naryVarName, binaryVarName;
    if(nary_var1 !== null) {
      naryVar = nary_var1;
      naryVarName = d.box.var1;
      binaryVar = data[d.box.var2]["binary"];
      binaryVarName = d.box.var2;
    } else {
      naryVar = nary_var2;
      naryVarName = d.box.var2;
      binaryVar = data[d.box.var1]["binary"];
      binaryVarName = d.box.var1;
    }
    
    const subCategories = Object.keys(naryVar);
    
    const detailedCorrelations = subCategories.map(subCat => ({
      category: subCat,
      correlation: get_corr_coef(binaryVar, naryVar[subCat])
    }));
    
    const detailedData = detailedCorrelations.map((item, index) => ({
      x: 50,
      y: 50 + index * 60,
      width: 120,
      height: 50,
      box: {
        var1: binaryVarName,
        var2: `${naryVarName}: ${item.category}`,
        corr_coeff_val: item.correlation
      }
    }));
    
    d3.select("#detailed-heatmap").remove();
    
    const detailedSvg = d3.select("body").append("div")
      .attr("id", "detailed-heatmap")
      .style("position", "fixed")
      .style("top", "50px")
      .style("right", "50px")
      .style("background", "white")
      .style("border", "2px solid #333")
      .style("padding", "20px")
      .style("border-radius", "10px")
      .style("box-shadow", "0 4px 8px rgba(0,0,0,0.2)")
      .style("z-index", "1000")
      .style("max-height", "90vh")
      .style("overflow", "auto")
      .style("width", "600px");
    
    detailedSvg.append("h3")
      .style("margin", "0 0 15px 0")
      .style("font-size", "14px")
      .text(`Detailed Correlation: ${binaryVarName} vs ${naryVarName}`);
    
    detailedSvg.append("button")
      .style("position", "absolute")
      .style("top", "5px")
      .style("right", "5px")
      .style("background", "none")
      .style("border", "none")
      .style("font-size", "16px")
      .style("cursor", "pointer")
      .text("×")
      .on("click", () => d3.select("#detailed-heatmap").remove());
    
    const detailedSvgElement = detailedSvg.append("svg")
      .attr("width", 500)
      .attr("height", detailedData.length * 60 + 100);
    
    detailedSvgElement.selectAll("rect")
      .data(detailedData)
      .join("rect")
      .attr("x", d => d.x)
      .attr("y", d => d.y)
      .attr("width", d => d.width)
      .attr("height", d => d.height)
      .attr("fill", d => {
        const color = d3.color(heatmap_colors(d.box.corr_coeff_val));
        color.opacity = Math.abs(d.box.corr_coeff_val);
        return color.formatRgb();
      })
      .attr("stroke", "#333")
      .attr("stroke-width", 1);
    
    detailedSvgElement.selectAll("text.corr-value")
      .data(detailedData)
      .join("text")
      .attr("class", "corr-value")
      .text(d => d.box.corr_coeff_val.toFixed(3))
      .attr("x", d => d.x + d.width / 2)
      .attr("y", d => d.y + d.height / 2)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", "black");
    
    detailedSvgElement.selectAll("text.category-label")
      .data(detailedData)
      .join("text")
      .attr("class", "category-label")
      .text(d => d.box.var2)
      .attr("x", d => d.x + d.width + 10)
      .attr("y", d => d.y + d.height / 2)
      .attr("dominant-baseline", "middle")
      .attr("font-size", "12px")
      .attr("fill", "black")
      .attr("text-anchor", "start");

    detailedSvgElement.append("text")
      .attr("x", 100)
      .attr("y", detailedData.length * 60 + 60)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "#333")
      .text(`${binaryVarName}`);
  }

  const heatmap_colors = d3.scaleLinear()
    .domain([-1, 0, 1])
    .range(["blue", "white", "red"]);
  
  const variables = cov_matrix && cov_matrix.length > 0 
    ? [...new Set(cov_matrix
        .filter(d => d && d.box)
        .flatMap(d => [d.box.var1, d.box.var2])
        .filter(v => v != null))] 
    : [];

  const margin = {top: 20, right: 20, bottom: 40, left: 80};
  const plotWidth = layout.width - margin.left - margin.right;
  const plotHeight = layout.height - margin.top - margin.bottom;
  
  const svg = d3.create("svg")
    .attr("width", layout.width)
    .attr("height", layout.height);
    
  const plotArea = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);
  
  const grouped_boxes = plotArea.append("g");
  
  const tooltip = d3.select("body").append("div")
    .style("position", "absolute")
    .style("padding", "4px 8px")
    .style("background", "rgba(0,0,0,0.7)")
    .style("color", "#fff")
    .style("border-radius", "2px")
    .style("visibility", "hidden");

  cov_matrix = cov_matrix.map(d => {
    if (!d.box) {
      d.box = {
        var1: 'unknown_var1',
        var2: 'unknown_var2', 
        corr_coeff_val: 0
      };
    }
    return d;
  });
    
  grouped_boxes.selectAll("rect")
    .data(cov_matrix)
    .join("rect")
    .attr("x", d => d.x)
    .attr("y", d => d.y)
    .attr("width", d => d.width)
    .attr("height", d => d.height)
    .attr("fill", d => {
        const color = d3.color(heatmap_colors(d.box.corr_coeff_val));
        color.opacity = Math.abs(d.box.corr_coeff_val);
        return color.formatRgb();
      })
    .on("mouseover", show_tooltip)
    .on("mousemove", display_tooltip)
    .on("mouseout", hide_tooltip)
    .on("click", plot_detailed_heatmap)
    .style("cursor", "pointer");
    
  grouped_boxes.selectAll("text")
    .data(cov_matrix)
    .join("text")
    .text(d => d.box.corr_coeff_val.toFixed(2))
    .attr("x", d => d.x + (d.width / 5))
    .attr("y", d => d.y + (d.height / 2))
    .attr("font-size", "18px")
    .attr("fill", "black")
    .on("mouseover", show_tooltip)
    .on("mousemove", display_tooltip)
    .on("mouseout", hide_tooltip)
    .on("click", plot_detailed_heatmap)
    .style("cursor", "pointer");
  
  const xPositions = [...new Set(cov_matrix.map(d => d.x))].sort((a, b) => a - b);
  const yPositions = [...new Set(cov_matrix.map(d => d.y))].sort((a, b) => a - b);
  
  plotArea.selectAll(".x-label")
    .data(xPositions)
    .join("text")
    .attr("class", "x-label")
    .attr("x", d => d + (cov_matrix[0].width / 2))
    .attr("y", Math.max(...yPositions) + cov_matrix[0].height + 40)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("font-weight", "bold")
    .text((d, i) => variables[i])
    .style("transform", "rotate(45deg)")
    .style("transform-origin", function(d) {
      const x = d + (cov_matrix[0].width / 2);
      const y = Math.max(...yPositions) + cov_matrix[0].height + 40;
      return `${x}px ${y}px`;
    });
  
  plotArea.selectAll(".y-label")
    .data(yPositions)
    .join("text")
    .attr("class", "y-label")
    .attr("x", Math.min(...xPositions) - 5)
    .attr("y", d => d + (cov_matrix[0].height / 2))
    .attr("text-anchor", "end")
    .attr("dominant-baseline", "middle")
    .attr("font-size", "12px")
    .attr("font-weight", "bold")
    .text((d, i) => variables[i]);
  
  return svg.node();
}