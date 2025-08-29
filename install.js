const fs = require("fs");
const https = require("https");
const AdmZip = require("adm-zip");

const dir = process.cwd() + "/bin";

// Simple logger replacement for modern ora compatibility
const logger = {
    start: (msg) => console.log(`🔄 ${msg}`),
    succeed: (msg) => console.log(`✅ ${msg}`),
    fail: (msg) => console.log(`❌ ${msg}`)
};

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


        function downloadFile(url, file, callback) {
            https.get(url, (response) => {
                // Handle redirects
                if (response.statusCode === 301 || response.statusCode === 302) {
                    return downloadFile(response.headers.location, file, callback);
                }
                
                if (response.statusCode !== 200) {
                    callback(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                    return;
                }
                
                response.pipe(file);
                
                file.on("finish", function () {
                    file.close();
                    callback(null);
                });
                
                file.on("error", callback);
            }).on('error', callback);
        }

        downloadFile('https://github.com/andreasjhkarlsson/gbdk-n/archive/master.zip', file, (error) => {
            if (error) {
                fs.unlink(process.cwd() + "/bin/gbdk-n-master.zip", () => {});
                logger.fail(`Download error: ${error.message}`);
                return reject(error);
            }
            
            logger.succeed("File downloaded.");
            return resolve();
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
