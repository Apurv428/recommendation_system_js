const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const csvParser = require('csv-parser');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors());

// Load data from CSV
const df = [];
fs.createReadStream('./data/udemy_course_data.csv')
    .pipe(csvParser())
    .on('data', (row) => {
        // console.log(row)
        df.push(row);
    })
    .on('end', () => {
        console.log('CSV file successfully processed');
    });
// Define a function to calculate similarity between two strings (titles)
function calculateSimilarity(str1, str2) {
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    return intersection.length / union.length;
}

// Define recommendation route
app.post('/recommend', (req, res) => {
    console.log(df[0])
    const { search_term, num_of_rec } = req.body;
    console.log(search_term)

    if (!search_term) {
        return res.status(400).json({ error: "Search term not provided" });
    }

    try {
        // Calculate similarity scores
        const similarityScores = df.map(course => ({
            course,
            similarity: calculateSimilarity(course.course_title, search_term)
        }));

        // Sort by similarity scores in descending order
        similarityScores.sort((a, b) => b.similarity - a.similarity);

        // Select top recommendations
        const selectedCourses = similarityScores.slice(0, num_of_rec).map(item => item.course);

        return res.json(selectedCourses);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});