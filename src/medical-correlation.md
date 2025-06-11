<style>
  main {
    max-width: 1400px !important;
    margin: 0 auto;
    padding: 0 2rem;
  }

  p {
    font-size: 18px;
    line-height: 1.6;
  }

  li {
    font-size: 18px;
    line-height: 1.8;
    margin-bottom: 0.5rem;
  }

  .observablehq {
    max-width: 100% !important;
  }

  h2 {
    font-size: 32px;
    margin-top: 2rem;
  }
  
  h3 {
    font-size: 24px;
  }
</style>

# Heatmap with Medical Data Correlation
<br></br>
## Introduction
This heatmap examines the correlations between various medical conditions, such as:
1. Heart Attack
2. Angina
3. Skin Cancer
4. Stroke
5. Smoking Status
## Findings and Correlations:
1. **Cardiovascular Conditions Relationship**
   - Heart Attack and Angina show a strong positive correlation (0.44), suggesting these condtions often co-occur;
   - Heart Attack and Stroke also demonstrates a moderate positive correlation (0.21)
2. **Smoking Status Relationship**
   - Smoker Status with the Hard Attack shows the strongest correlation (0.08), indicating it plays a role in forming a heart attack
      - Former smokers have the strongest correlation of 0.071, whereas the current-daily smokers have a correlation of 0.069
3. **Skin Cancer Relationship**
   - Skin cancer shows relatively weak correlation with other conditions

```js
import { MedicalHeatmap } from "./components/medical-heatmap.js";
const medicalData = await FileAttachment("data/heart_2022_preprocessed_small.csv").csv();

const heatmapContainer = MedicalHeatmap(medicalData, {
  width: 850,
  height: 850,
  margin: {top: 50, right: 50, bottom: 100, left: 3000}
});
display(heatmapContainer);