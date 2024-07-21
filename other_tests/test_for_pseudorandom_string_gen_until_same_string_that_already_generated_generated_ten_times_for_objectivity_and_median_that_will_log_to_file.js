const fs = require('fs');
const path = require('path');
const os = require('os');

const generateRandomString = (length) => {
    const characters =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;

    for (let i = 0; i < length; i++) {
        result += characters.charAt(
            Math.floor(Math.random() * charactersLength)
        );
    }

    return result;
};

const formatNumberWithSpaces = (number) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const findDuplicateString = (stringLength, runNumber) => {
    const logFile = path.join(
        os.tmpdir(),
        `generatedStrings_run_${runNumber}.log`
    );
    const startTime = Date.now();
    let counter = 0;

    if (!fs.existsSync(logFile)) {
        fs.writeFileSync(logFile, '');
    }

    while (true) {
        const randomString = generateRandomString(stringLength);
        counter++;
        console.log(
            `Run #${runNumber}: Generated #${formatNumberWithSpaces(counter)}: ${randomString}`
        );

        const fileContents = fs.readFileSync(logFile, 'utf8');
        if (fileContents.includes(randomString)) {
            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000;
            return duration;
        }

        fs.appendFileSync(logFile, `${randomString}\n`);
    }
};

const runMultipleTimes = (iterations, stringLength) => {
    const times = [];
    console.log(`Running the function ${iterations} times...`);

    for (let i = 0; i < iterations; i++) {
        console.log(`Run #${i + 1}:`);
        const duration = findDuplicateString(stringLength, i + 1);
        times.push(duration);
        console.log(`Duration: ${duration} seconds`);
    }

    const median = calculateMedian(times);
    console.log(`Median time: ${median.toFixed(6)} seconds`);

    const deviations = calculateDeviations(times, median);
    deviations.forEach((deviation, index) => {
        console.log(
            `Deviation for run #${index + 1}: ${deviation.toFixed(6)} seconds`
        );
    });
};

const calculateMedian = (times) => {
    const sortedTimes = times.slice().sort((a, b) => a - b);
    const mid = Math.floor(sortedTimes.length / 2);

    return sortedTimes.length % 2 !== 0
        ? sortedTimes[mid]
        : (sortedTimes[mid - 1] + sortedTimes[mid]) / 2;
};

const calculateDeviations = (times, median) => {
    return times.map((time) => time - median);
};

runMultipleTimes(10, 10);
