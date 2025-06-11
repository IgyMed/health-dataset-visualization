import { csvParse } from "d3-dsv";
import { readFile } from "fs/promises";

const csvData = await readFile("./src/data/heart_2022_preprocessed_small.csv", "utf-8");
const data = csvParse(csvData);

process.stdout.write(JSON.stringify(data));