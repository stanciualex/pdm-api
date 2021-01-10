const dataStore = require('nedb-promise');

class CarStore {
    constructor(props) {
        const { filename, autoload } = props;

        console.log('props', props);
        this.store = dataStore({ filename, autoload });
    }

    async find(props) {
        return this.store.find(props);
    }

    async findOne(props) {
        return this.store.findOne(props);
    }

    async insert(car) {
        if (
            !car.manufacturer ||
            !car.model ||
            !car.fabricationDate ||
            !car.horsePower ||
            car.isElectric === undefined
        ) {
            throw new Error("The following fields are required: 'manufacturer', 'model', 'fabricationDate', 'horsePower', 'isElectric'.");
        }

        car.version = 1;

        return this.store.insert(car);
    }

    async update(props, car) {
        const version = car.version || 1;
        car.version = version + 1;
        return this.store.update(props, car);
    }

    async remove(props) {
        return this.store.remove(props);
    }
}

module.exports = new CarStore({
    filename: './db/cars.json',
    autoload: true,
});