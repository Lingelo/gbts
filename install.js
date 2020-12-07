const fs = require("fs");
const request = require("request");
const ora = require("ora");
const AdmZip = require("adm-zip");

const dir = process.cwd() + "/bin";

const logger = ora({
    color: 'yellow',
    spinner: {
        frames: ['···', '•··', '••·', '•••'],
        interval: 250
    }
});

async function main() {
    try {
        await download();
        await extract();
        await deleteZIP();
    } catch (error) {
        logger.fail(error);
    }
}


async function download() {

    logger.start("Downloading GBDK (GameBoy Development Kit)");

    return new Promise(function (resolve, reject) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }

        const file = fs.createWriteStream(process.cwd() + "/bin/gbdk-n-master.zip");


        request.get({
            uri: 'https://github.com/andreasjhkarlsson/gbdk-n/archive/master.zip'
        })
            .pipe(file)
            .on("finish", function () {
                logger.succeed("File downloaded.");
                return resolve();
            })
            .on("error", function (error) {
                logger.fail(`Impossible to download file${error}`);
                return reject();
            })
    });


}

async function extract() {

    logger.start("Unzipping GBDK");

    return new Promise(function (resolve, reject) {

        try {
            fs.readdirSync(`${process.cwd()}/bin/`, (err, files) => {
                files.forEach(file => {
                    console.log(file);
                });
            });

            const zip = new AdmZip(`${process.cwd()}/bin/gbdk-n-master.zip`);
            zip.extractAllTo( `${process.cwd()}/bin`);

            logger.succeed("GBDK unzipped.")

            return resolve();
        }catch(error) {
            return reject(`Error while Unzipping GBDK : ${error}.`);
        }

    });
}

async function deleteZIP() {

    logger.start("Deleting GBDK zip.");

    return new Promise(function (resolve, reject) {

        try {
            fs.unlinkSync(process.cwd() + "/bin/gbdk-n-master.zip");
            logger.succeed("GBDK zip deleted.")
            resolve();
        }catch (error) {
            return reject(`Error while deleting GBDK zip file : ${error}.`);
        }
    });
}


main();
