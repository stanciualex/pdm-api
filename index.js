const express = require('express');
const bodyParser = require('body-parser');
const http = require('http')
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const port = 8000;

const defaultData = require('./src/defaultData');

const cars = defaultData;
let lastId = cars && cars.length ? cars[cars.length - 1].id : 0;

app.use(bodyParser.json());
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

const addCar = ({ manufacturer, model, fabricationDate, horsePower, isElectric }) => {
    lastId++;
    const newCar = {
        id: lastId,
        manufacturer,
        model,
        fabricationDate,
        horsePower,
        isElectric
    };

    cars.push(newCar);
    return newCar;
};

const getCar = (id) => cars.find(car => car.id === id);

const updateCar = ({ id, manufacturer, model, fabricationDate, horsePower, isElectric }) => {
    const index = cars.findIndex(car => car.id === id);
    const car = cars[index];

    const updatedCar = {
        ...car,
        manufacturer: manufacturer || car.manufacturer,
        model: model || car.model,
        fabricationDate: fabricationDate ? new Date(fabricationDate) : car.fabricationDate,
        horsePower: horsePower || car.horsePower,
        isElectric: isElectric !== undefined ? isElectric : car.isElectric,
    };

    cars[index] = updatedCar;
    return updatedCar;
};

const deleteCar = (id) => {
    const index = cars.findIndex(car => car.id === id);

    if (index === -1) {
        return;
    }

    cars.splice(index, 1);
};

const sendNotification = (data) => {
    wss.clients.forEach(client => {
       if (client.readyState === WebSocket.OPEN) {
           client.send(JSON.stringify(data));
       }
    });
};

app.get('/car', (req, res) => {
    res.status(200).send({
        success: true,
        data: cars || [],
    });
});

app.get('/car/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const car = getCar(id);

    if (!car) {
        return res.send({
            success: false,
            error: `Car with id ${id} not found.`,
        });
    }

    res.status(200).send({
        success: true,
        data: car,
    });
});

app.post('/car', (req, res) => {
    if (
        !req.body.manufacturer ||
        !req.body.model ||
        !req.body.fabricationDate ||
        !req.body.horsePower ||
        req.body.isElectric === undefined
    ) {
        return res.send({
            success: false,
            error: "The following fields are required: 'manufacturer', 'model', 'fabricationDate', 'horsePower', 'isElectric'.",
        });
    }

    const addedCar = addCar({
        manufacturer: req.body.manufacturer,
        model: req.body.model,
        fabricationDate: new Date(req.body.fabricationDate),
        horsePower: req.body.horsePower,
        isElectric: req.body.isElectric,
    })
    sendNotification({ action: 'create', payload: { car: addedCar }});
    res.status(201).send({
        success: true,
        data: addedCar,
    });
});

app.put('/car/:id', (req, res) => {
    if (parseInt(req.params.id) !== req.body.id) {
        return res.status(400).send({
            success: false,
            error: 'Params id and body id have to be the same.',
        });
    }

    const { id } = req.body;
    const car = getCar(id);

    if (!car) {
        return res.send({
            success: false,
            error: `The car with id ${id} does not exist.`,
        });
    }

    const updatedCar = updateCar({
        id,
        manufacturer: req.body.manufacturer,
        model: req.body.model,
        fabricationDate: req.body.fabricationDate,
        horsePower: req.body.horsePower,
        isElectric: req.body.isElectric,
    })
    sendNotification({ action: 'update', payload: { car: updatedCar }});
    res.status(200).send({
        success: true,
        data: updatedCar,
    });
});

app.delete('/car/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const car = getCar(id);

    if (!car) {
        return res.status(404).send({
            success: false,
            error: `Car with id ${id} not found.`,
        });
    }

    deleteCar(id);
    sendNotification({ action: 'delete', payload: { car }});
    res.status(200).send({
        success: true,
    });
});


server.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`)
});