// Bring in the dependencies
const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const multer = require('multer');
const {
    TesseractWorker
} = require('tesseract.js');


// Initialise TesseractWorker
const worker = new TesseractWorker();

// Initialise express server
const app = express();

// Handlebars Middleware
app.engine("handlebars", exphbs({
    defaultLayout: "main"
}));
app.set("view engine", "handlebars");

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

// Set static folder
app.use(express.static(`${__dirname}/public`));

// Multer storage
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, './uploads');
    },
    filename: (req, file, callback) => {
        callback(null, file.originalname);
    }
});

const upload = multer({
    storage: storage
}).single('image');

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.post('/upload', (req, res) => {
    upload(req, res, err => {
        // read the file uploaded and analyse it with tesseract
        fs.readFile(`./uploads/${req.file.originalname}`, (err, data) => {
            if (err) throw err;

            worker.recognize(data, "eng", {
                    tessjs_create_pdf: "1"
                })
                .progress(progress => {
                    console.log(progress);
                })
                .then(result => {
                    res.redirect('/downloads');
                })
                .finally(() => {
                    worker.terminate();
                })
        });
    })
});

app.get('/downloads', (req, res) => {
    const fileName = `${__dirname}/tesseract.js-ocr-result.pdf`;
    res.download(fileName);
})

// Listen to server
const PORT = 5000 || process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});