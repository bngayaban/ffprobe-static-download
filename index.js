const axios = require('axios');
const fs = require('fs');
const os = require('os');
const path = require('path');
const tarxz = require('decompress-tarxz');
const unzip = require('decompress-unzip');
const decompress = require('decompress');
const mvdir = require('mvdir');

const platform = os.platform();
const arch = os.arch();

const platformPath = path.join(__dirname, 'bin', platform, arch);

(async() => {

    if(require.main !== module) {
        return;
    }

    const archivePath = path.join(platformPath, 'ffprobeArchive');
    const url = generateUrl(platform, arch);

    if(url === 'Not Supported') {
        console.log('Unsupported platform and architecture:', platform, arch);
        process.exit();
    }

    try {
        await download(url, archivePath);
        console.log('Done downloading.')
        
        const ffprobeArchivePath = await extract(archivePath, platformPath);
        console.log('Done extracting.');
        
        await moveBinary(ffprobeArchivePath, platformPath);
        console.log('Moved binary');
        
        await cleanUp(ffprobeArchivePath, platformPath);
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

    return supportedPlatforms[platform] && supportedPlatforms[platform][arch] || 'Not Supported';
}

// downloads the compressed folder into the respective platform/arch directory
async function download(url, filePath) {
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

// extracts and returns the file path for the ffprobe binary
async function extract(source, destination) {
    let files;
    try {
        files = await decompress(source, destination, {
            plugins: [
                (platform === 'linux') ? tarxz() : unzip()
            ],
            filter: file => path.basename(file.path, '.exe') === 'ffprobe'
        })
    } catch (e) {
        console.log(e);
    }

    return files[0].path;
}

//moves ffprobe to the head of its respective directory
async function moveBinary(ffprobeArchivePath, destination) {
    const source = path.join(destination, ffprobeArchivePath);
    try {
        await mvdir(source, destination)
    } catch (e) {
        console.log(e)
    }
}

// deletes the downloaded tar/zip file and the uncompressed contents
async function cleanUp(ffprobeArchivePath, directory){
    const zip = path.join(directory, 'ffprobeArchive');
    const folder = path.join(directory, getHeadDirectory(ffprobeArchivePath));
    fs.unlinkSync(zip);
    fs.rmdirSync(folder, {recursive: true});

    //sometimes the binary is 2+ folders down so we need to get upper most directory
    function getHeadDirectory(ffPath) {
        let prev = ffPath;
        let itr = 0
        while(ffPath !== '.') {
            prev = ffPath;
            ffPath = path.dirname(ffPath);
        }
        return prev;
    }
}

const ffprobeDlPath = path.join(
    platformPath, 
    platform === 'win32' ? 'ffprobe.exe' : 'ffprobe'
);

exports.path = ffprobeDlPath; 