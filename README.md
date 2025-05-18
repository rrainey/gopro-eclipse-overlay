# gopro-eclipse-overlay

A module to extract GPS information embedded in a GoPro 5 or later MP4 file. Optimized to show data associated with the April 8, 2024 eclipse.

## Background

I had the opportunity to make a skydive during the 2024 total eclipse in North America.  I filmed the event using my GoPro 9.  

GoPro 5 and later has a GPS feature which, when enabled, will log your GPS position along with other hidden data into the recorded MP4 file.  As I watched an early draft of my video, I could see things get darker as the plane climbed to jump altitude, but I felt like some important context was missing. 

So, I had the idea to extract that data and use it to add an overlay on the video which would show the extent of the moon's eclipsing of the sun during the entire video.

## Installation

```
$ git clone https://github.com/rrainey/gopro-eclipse-overlay
$ cd gopro-eclipse-overlay
$ npm install
$ npm run build
```

For the final step of the pipeline, ```ffmpeg``` will need to be installed on your system.  The Windows version of the standard distribution seems to have an issue with font processing - and I'm on Windows. To get around that issue, I installed ffmpeg under WSL and run it there.

### Running

If you are on Windows, I suggest running everything inside WSL.

```
$ npm run start <mp4-file-pathname>
$ ffmpeg -i <input mp4 pathname> -filter_complex_script overlay.txt -c:a copy <output mp4 pathname>>
```
The ```npm run``` step will inspect the GoPro video and generate from that a set of drawing directives in a file named ```overlay.txt``` file.  The second step takes that file as ```ffmpeg``` input to generate a new MP4 which adds the overlay to the original video.