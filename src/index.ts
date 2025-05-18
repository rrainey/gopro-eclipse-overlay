import fs from 'fs';
import path from 'path';
import { GPMFExtract } from 'gpmf-extract';
import { goProTelemetry } from 'gopro-telemetry';
import { computeEclipseStatus, OverlapState } from "./computeEclipseStatus.js";
import { exec } from 'child_process';

const executeOverlayMerge = false;

function findSecondIndexOf(str : string, target : string): number {
  const firstIndex = str.indexOf(target);
  if (firstIndex === -1) {
    return -1;
  }
  return str.indexOf(target, firstIndex + 1);
}

const inputFile = process.argv[2] || 'input.mp4';
const overlayFile = 'overlay.txt';
const buffer = fs.readFileSync(inputFile);

if (fs.existsSync(overlayFile)) {
  fs.unlinkSync(overlayFile);
}

GPMFExtract(buffer)
  .then((extracted)  => {
    goProTelemetry(extracted, {}, (telemetry) => {

    //const gpsSamples = data['1']?.streams?.GPS5?.samples || [];
    const gpsStream = telemetry['1']?.streams?.GPS5.samples;
    const output: string[] = [];

    gpsStream.forEach((sample, i: number) => {
      const timestamp = new Date(sample.date);
      const location = { lat: sample.value[0], lon: sample.value[1] };
      //console.log(`Sample ${i}: ${timestamp.toISOString()} - Lat: ${location.lat}, Lon: ${location.lon}`);
      const eclipseInfo = computeEclipseStatus(timestamp, location);
      //console.log(`Eclipse Info: ${JSON.stringify(eclipseInfo)}`);
      const totalityPercentage  = (1.0 - eclipseInfo.illumination) * 100;

      const s = timestamp.toLocaleTimeString("en-US", {timeZone: "America/Chicago"});
      const printedTimeHHMM = s.slice(0,findSecondIndexOf(s,":"));

      let totalityString = "";
      if (eclipseInfo.eclipse === OverlapState.HIDDEN || totalityPercentage > 99.0) {
        totalityString = "totality";
      }
      else {
        totalityString = `${totalityPercentage.toFixed(0)}%`;
      }
      const label = `Time: ${printedTimeHHMM}  |  ${totalityString}`;

      output.push(
        `drawtext=fontfile=./DejaVu_Sans/DejaVuSans-Bold.ttf:expansion=none:text='${label}':` +
        `enable='between(t,${i},${i + 1})':x=50:y=h-th-80:fontsize=64:fontcolor=white:box=1:boxcolor=black@0.5`
      );
    });

    fs.writeFileSync(overlayFile, output.join(',\n'), 'utf-8');
    console.log(`Overlay written to ${overlayFile}`);

    // The stock Windows ffmpeg doesn't execute properly, so this step
    // is done in WSL.
    if (executeOverlayMerge) {
      
      //const command = `dir`;
      const outFile = path.basename(inputFile, ".MP4") + "-with-overlay.mp4";

      const command = `wsl ffmpeg -i "${inputFile}" -vf "drawtext=textfile=${overlayFile}" -c:a copy "${outFile}"`;
      console.log(`Executing command: ${command}`);

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing ffmpeg: ${error.message}`);
          console.error(`${stderr}`);

          return;
        }

        console.log(`${stdout}`);
        if (stderr) {
          console.error(`ffmpeg errors: ${stderr}`);
        }
      });
    }
  });

  /*
  if (fs.existsSync(overlayFile)) {
    fs.unlinkSync(overlayFile);
  }
  */
}

);
