export default {
  title: "Medical Data Analysis",
  
  pages: [
    {name: "Medical Correlation Analysis", path: "/medical-correlation"}
  ],
  
  theme: "light",
  
    head: `
    <link rel="icon" href="observable.png" type="image/png" sizes="32x32">
    <style>
      body {
        font-size: 25px;
      }
    </style>
  `,
  root: "src",
  
  interpreters: {
    ".py": ["python"]
  }
};