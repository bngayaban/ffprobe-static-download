const axios = require('axios');
const {promises:fs, createWriteStream:fsCreateWriteStream} = require('fs');
const os = require('os');
const path = require('path');
const tarxz = require('decompress-tarxz');
const unzip = require('decompress-unzip');
const decompress = require('decompress');
const mvdir = require('mvdir');

const platform = os.platform();
const arch = os.arch();
const platformPath = path.join(__dirname, 'bin', platform, arch);

//check for post install and platform support
(async () => {
    if(require.main !== module) {
        return;
    }

    if(getUrl(platform, arch) === 'Not Supported') {
        console.log('Unsupported platform and architecture:', platform, arch);
        process.exit();
    }

    await getFFProbe(platform, arch);
})(platform, arch);

// installs the appropriate ffprobe
async function getFFProbe(platform, arch) {
    const archivePath = path.join(platformPath, 'ffprobeArchive');
    const url = getUrl(platform, arch);

    try {
        await downloadArchive(url, archivePath);
        console.log('Done downloading.')
        
        const ffprobeArchivePath = await extractArchive(archivePath, platformPath, platform);
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
}

// return the appropriate url for the platform/arch or not supported if not found
function getUrl(platform, arch) {
    const supportedPlatforms = {
        win32: {
            x64: 'https://ffmpeg.zeranoe.com/builds/win64/static/ffmpeg-4.3-win64-static.zip',//'https://ffmpeg.zeranoe.com/builds/win64/static/ffmpeg-latest-win64-static.zip',
            ia32: 'https://ffmpeg.zeranoe.com/builds/win32/static/ffmpeg-4.3-win32-static.zip'//'https://ffmpeg.zeranoe.com/builds/win32/static/ffmpeg-latest-win32-static.zip'
        },
        linux: {
            arm: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-armhf-static.tar.xz',//'https://johnvansickle.com/ffmpeg/builds/ffmpeg-git-armhf-static.tar.xz',
            arm64: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-arm64-static.tar.xz',//'https://johnvansickle.com/ffmpeg/builds/ffmpeg-git-arm64-static.tar.xz',
            ia32: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-i686-static.tar.xz',//'https://johnvansickle.com/ffmpeg/builds/ffmpeg-git-i686-static.tar.xz',
            x64: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz'//'https://johnvansickle.com/ffmpeg/builds/ffmpeg-git-amd64-static.tar.xz',
        },
        darwin : {
            x64: 'https://evermeet.cx/ffmpeg/ffprobe-4.3.1.zip',//'https://evermeet.cx/ffmpeg/get/zip',
        }
    };

    return supportedPlatforms[platform] && supportedPlatforms[platform][arch] || 'Not Supported';
}

// downloads the compressed folder into the respective platform/arch directory
async function downloadArchive(url, filePath) {
    const writer = fsCreateWriteStream(filePath);
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
async function extractArchive(source, destination, platform) {
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

    //Darwin has ffprobe as the only item, so need to check if folder before removing
    if((await fs.lstat(folder)).isDirectory()) {
        await fs.rmdir(folder, {recursive: true});
    }

    await fs.unlink(zip);
    
    //sometimes the binary is 2+ folders down so we need to get upper most directory
    function getHeadDirectory(ffPath) {

        let prev = ffPath;
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