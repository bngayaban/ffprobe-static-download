# ffprobe-static-download

This downloads the appropriate ffprobe binary for your system.

Based off of <https://github.com/joshwnj/ffprobe-static>

## Usage

```javascript
var ffprobe = require('ffprobe-static-download');
console.log(ffprobe.path);
```

## Version Notes

Currently supports Mac OS X(64 bit), Windows(32 and 64 bit), and Linux(32, 64, ARM, and ARM64 bit).

Downloads ffprobe 4.3.1 from the following websites.

* [64 bit Mac OSX](https://evermeet.cx/ffmpeg/)

* [64 bit Windows](https://ffmpeg.zeranoe.com/builds/)

* [32 bit Windows](https://ffmpeg.zeranoe.com/builds/)

* [32 bit Linux](https://johnvansickle.com/ffmpeg/)*

* [64 bit Linux](https://johnvansickle.com/ffmpeg/)*

* [ARM Linux](https://johnvansickle.com/ffmpeg/)*

* [ARM 64 bit Linux](https://johnvansickle.com/ffmpeg/>)*

\* At time of publishing, there is no direct url to version 4.3.1 of ffprobe for Linux, so in the future it may download a newer version of it. Check the release version on the website to know which version it will download. In the future, FFprobe-static-download will more than likely be updated with the direct link.

## Sources

Special thanks to [joshwnj](https://github.com/joshwnj) for <https://github.com/joshwnj/ffprobe-static> for which this project is based off of.
