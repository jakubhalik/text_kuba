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

const findDuplicateString = (stringLength) => {
    const logFile = path.join(os.tmpdir(), 'generatedStrings.log');
    const startTime = Date.now();
    let counter = 0;

    if (!fs.existsSync(logFile)) {
        fs.writeFileSync(logFile, '');
    }

    while (true) {
        const randomString = generateRandomString(stringLength);
        counter++;
        console.log(
            `Generated #${formatNumberWithSpaces(counter)}: ${randomString}`
        );

        const fileContents = fs.readFileSync(logFile, 'utf8');
        if (fileContents.includes(randomString)) {
            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000; // convert milliseconds to seconds
            console.log(`Duplicate found: ${randomString}`);
            console.log(`Total time: ${duration} seconds`);
            break;
        }

        fs.appendFileSync(logFile, `${randomString}\n`);
    }
};

findDuplicateString(10);
