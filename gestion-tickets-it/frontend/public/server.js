const express = require('express');
const path = require('path');

const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// All routes go to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Frontend server running on port ${PORT}`));