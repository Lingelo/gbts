const fs = require("fs");
const https = require("https");
const AdmZip = require("adm-zip");
const { execSync } = require("child_process");

const dir = process.cwd() + "/bin";

// Simple logger replacement for modern ora compatibility
const logger = {
    start: (msg) => console.log(`🔄 ${msg}`),
    succeed: (msg) => console.log(`✅ ${msg}`),
    fail: (msg) => console.log(`❌ ${msg}`)
};

async function main() {
    try {
        await checkAndInstallSDCC();
        await download();
        await extract();
        await deleteZIP();
        await fixGBDKScripts();
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


async function checkAndInstallSDCC() {
    logger.start("Checking SDCC compiler installation");
    
    try {
        // Check if SDCC is already installed
        execSync('which sdcc', { stdio: 'ignore' });
        logger.succeed("SDCC already installed");
        return;
    } catch (error) {
        // SDCC not found, try to install it
        logger.start("SDCC not found - installing via Homebrew");
        
        try {
            // Check if Homebrew is installed
            execSync('which brew', { stdio: 'ignore' });
            
            // Install SDCC with Homebrew
            logger.start("Installing SDCC (Small Device C Compiler) - this may take a few minutes");
            execSync('brew install sdcc', { stdio: 'inherit' });
            logger.succeed("SDCC installed successfully");
        } catch (brewError) {
            // Homebrew not available
            logger.fail("Homebrew not found. Please install SDCC manually:");
            logger.fail("1. Install Homebrew: https://brew.sh");
            logger.fail("2. Run: brew install sdcc");
            logger.fail("Or install SDCC from: http://sdcc.sourceforge.net");
            throw new Error("SDCC installation required for GameBoy development");
        }
    }
}

async function fixGBDKScripts() {
    logger.start("Updating GBDK scripts for modern SDCC compatibility");
    
    const gbdkPath = `${process.cwd()}/bin/gbdk-n-master`;
    
    try {
        // Fix compile script
        const compileScript = `${gbdkPath}/bin/gbdk-n-compile.sh`;
        if (fs.existsSync(compileScript)) {
            let content = fs.readFileSync(compileScript, 'utf8');
            content = content.replace('-mgbz80', '-msm83');
            fs.writeFileSync(compileScript, content);
        }
        
        // Fix link script
        const linkScript = `${gbdkPath}/bin/gbdk-n-link.sh`;
        if (fs.existsSync(linkScript)) {
            let content = fs.readFileSync(linkScript, 'utf8');
            content = content.replace('-mgbz80', '-msm83');
            fs.writeFileSync(linkScript, content);
        }
        
        logger.succeed("GBDK scripts updated for modern SDCC");
    } catch (error) {
        logger.fail(`Error updating GBDK scripts: ${error.message}`);
        throw error;
    }
}

main();
