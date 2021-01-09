const router = require('express').Router();

const carStore = require('./store');
const { sendNotification } = require('../utils/wss');

const getAll = async (req, res) => {
    const { user } = req;
    const { page: pageString, limit: limitString, search } = req.query;
    const page = parseInt(pageString);
    const limit = parseInt(limitString);
    const searchValue = search && search.toLowerCase();

    const cars = await carStore.find({ userId: user._id });

    if (page && limit) {
        const offset = (page - 1) * limit;

        return res.status(200).send({
            items: cars.slice(offset, offset + limit),
            totalPages: Math.ceil(cars.length / limit),
        })
    }

    if (search) {
        return res.status(200).send({
            items: cars.filter(car => (
                car.manufacturer.toLowerCase().includes(searchValue) ||
                car.model.toLowerCase().includes(searchValue)
            )),
            totalPages: 1
        })
    }

    res.status(200).send({
        items: cars,
        totalPages: 1,
    });
};

const getById = async (req, res) => {
    const { user } = req;
    const { id } = req.params;

    const car = await carStore.findOne({ _id: id });

    if (car) {
        if (car.userId === user._id) {
            res.status(200).send(car);
        } else {
            res.status(403).send({ message: 'Access forbidden.' })
        }
    } else {
        res.status(404).send({ message: `Car with id ${id} not found.`});
    }
};

const create = async (req, res) => {
    const { user } = req;
    const { id } = req.params;
    const car = req.body;

    car.userId = user._id;
    try {
        const addedCar = await carStore.insert(car);
        sendNotification(user._id, { action: 'create', payload: { car: addedCar }});
        res.status(201).send(addedCar);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
};

const update = async (req, res) => {
    const { user } = req;
    const { id } = req.params;
    const car = req.body;

    if (car._id && car._id !== id) {
        return res.status(400).send({
            message: 'Params id and body id have to be the same.',
        });
    }

    if (!user._id) {
        return await create(req, res);
    }

    car.userId = user._id;
    const updatedCount = await carStore.update({ _id: id }, car);

    if (updatedCount === 1) {
        sendNotification(user._id, { action: 'update', payload: { car }});
        res.status(200).send(car);
    } else {
        res.status(400).error({ message: 'Resource no longer exists' });
    }
};

const remove = async (req, res) => {
    const { user } = req;
    const { id } = req.params;

    const car = await carStore.findOne({ _id: id });

    if (car && car.userId === user._id) {
        await carStore.remove({ _id: id });
        sendNotification(user._id, { action: 'delete', payload: { car }});
        res.status(204).send("Deleted");
    } else {
        res.status(403).send({ message: 'Access forbidden.' })
    }
};


router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = {
    router
}