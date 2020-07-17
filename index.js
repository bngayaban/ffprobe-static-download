const axios = require('axios');
const fs = require('fs');
const os = require('os');
const path = require('path');
const zip = require('extract-zip');
const mvdir = require('mvdir');


const platform = os.platform();
const arch = os.arch();


const binPath = path.join(__dirname, 'bin', platform, arch, 'ffprobeBinary.compressed');
const binDirectory =  path.join(__dirname, 'bin', platform, arch);

const url = generateUrl(platform, arch);

(async() => {
    try {
        await Download(url, binPath);
        console.log('Done downloading.')
        await Extract(binPath, binDirectory);
        console.log('Done extracting.');
        await moveBinary(binDirectory);
        console.log('Moved binary');
        //await cleanUp(binDirectory);
        console.log('Done Cleaning');
    } catch (e) {
        console.error(e);
        console.log(e);
        process.exit();
    }
    
})();

function generateUrl(platform, arch) {
    const supportedPlatforms = {
        win32: {
            x64: 'https://ffmpeg.zeranoe.com/builds/win64/static/ffmpeg-latest-win64-static.zip',
            ia32: 'https://ffmpeg.zeranoe.com/builds/win32/static/ffmpeg-latest-win32-static.zip'
        },
        linux: {
            arm: 'https://johnvansickle.com/ffmpeg/builds/ffmpeg-git-armhf-static.tar.xz',
            arm64: 'https://johnvansickle.com/ffmpeg/builds/ffmpeg-git-arm64-static.tar.xz',
            ia32: 'https://johnvansickle.com/ffmpeg/builds/ffmpeg-git-i686-static.tar.xz',
            x64: 'https://johnvansickle.com/ffmpeg/builds/ffmpeg-git-amd64-static.tar.xz',
        },
        darwin : {
            x64: 'https://evermeet.cx/ffmpeg/get/zip',
        }
    }

    return supportedPlatforms[platform][arch] || 'Not Supported';
}

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

async function Extract(source, destination) {
    try{
        await zip(source, {dir: destination});
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
    const zip = path.join(directory, 'ffprobeBinary.compressed');
    const folder = path.join(directory, 'ffmpeg-latest-win64-static');
    fs.unlinkSync(zip);
    fs.rmdirSync(folder, {recursive: true});
}