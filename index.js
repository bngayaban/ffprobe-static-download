const axios = require('axios');
const fs = require('fs');
const os = require('os');
const path = require('path');
const zip = require('extract-zip');
const mvdir = require('mvdir');


const platform = os.platform();
const arch = os.arch();

const link = 'https://ffmpeg.zeranoe.com/builds/win64/static/ffmpeg-latest-win64-static.zip'


const binPath = path.join(__dirname, 'bin', platform, arch, 'ffmpeg-latest-win64-static.zip');
const binDirectory =  path.join(__dirname, 'bin', platform, arch);

console.log(binPath);
(async() => {
    try {
        await Download(link, binPath);
        console.log('Done downloading.')
        await Extract(binPath, path.dirname(binPath));
        console.log('Done extracting.');
        await moveBinary(binDirectory);
        console.log('Moved binary');
        await cleanUp(binDirectory);
        console.log('Done Cleaning');
    } catch (e) {
        console.error(e);
        console.log(e);
        process.exit();
    }
    
})();

async function Download(url, filePath) {
    const writer = fs.createWriteStream(filePath);
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });
    
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    })
}

async function Extract(source, output) {
    try{
        await zip(source, {dir: output});
    } catch(e) {
        console.log(e);
    }
}

async function moveBinary(destination) {
    const source = path.join(destination, 'ffmpeg-latest-win64-static', 'bin', 'ffprobe.exe');
    console.log(source)
    try {
        await mvdir(source, destination)
    } catch (e) {
        console.log(e)
    }
}

async function cleanUp(directory){
    const zip = path.join(directory, 'ffmpeg-latest-win64-static.zip');
    const folder = path.join(directory, 'ffmpeg-latest-win64-static');
    fs.unlinkSync(zip);
    fs.rmdirSync(folder, {recursive: true});
}