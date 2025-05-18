import { Observer, Body, Equator, Horizon } from 'astronomy-engine';

export enum OverlapState {
  NO_OVERLAP = 'NO_OVERLAP',
  OVERLAP = 'OVERLAP',
  HIDDEN = 'HIDDEN'
}

export interface OverlapResult {
  area: number;
  state: OverlapState;
}

export interface ObserverLocation {
  lat: number;
  lon: number;
  elevation?: number;
}

export interface EclipseResult {
  eclipse: OverlapState;
  illumination: number;
  sun: { azimuth: number; altitude: number };
  moon: { azimuth: number; altitude: number };
}

/* 

source: https://aa.usno.navy.mil/calculated/eclipse/solar?eclipse=12024&lat=33.4489&lon=-96.3781&label=&height=100&submit=Get+Data

Solar Eclipse of 2024 April 08
Delta T: 72.8s
Sun in Total Eclipse at this Location

33.4489° N, 96.3781° W
Height 100m
     Phenomenon	Day	Time (UT1)  Sun's Altitude (°)	Sun's Azimuth (°)	Position Angle (°)	Vertex Angle (°)
 Eclipse Begins	8	  17:25:05.5	  60.4	                147.5	            226.0	            253.1
Totality Begins	8	  18:42:49.1	  63.9	                188.9	            359.3	            352.2
Maximum Eclipse	8	  18:44:15.5	  63.8	                189.7		
 Totality Ends	8	  18:45:43.8	  63.8	                190.5	            275.8	            267.4
 Eclipse Ends	  8	  20:03:58.9	  55.8	                226.4	            49.9	            12.6
 
            Duration	2h 38m 53.3s
Duration of Totality	2m 54.7s
           Magnitude	1.007
         Obscuration	100.0%

*/

/**
 * Computes the area of overlap between two circles and classifies the overlap state.
 * @param r1 Radius of the larger (top) circle
 * @param r2 Radius of the smaller (bottom) circle
 * @param d Distance between the centers of the circles
 */
export function computeCircleOverlap(r1: number, r2: number, d: number): OverlapResult {
  const PI = Math.PI;

  if (d >= r1 + r2) {
    return { area: 0, state: OverlapState.NO_OVERLAP };
  }

  if (d <= Math.abs(r1 - r2)) {
    return { area: PI * r2 * r2, state: OverlapState.HIDDEN };
  }

  // Calculate partial overlap
  // see https://mathworld.wolfram.com/Circle-CircleIntersection.html
  const r1sq = r1 * r1;
  const r2sq = r2 * r2;

  const term1 = r1sq * Math.acos((d * d + r1sq - r2sq) / (2 * d * r1));
  const term2 = r2sq * Math.acos((d * d + r2sq - r1sq) / (2 * d * r2)) ;
  const term3 = 0.5 * Math.sqrt((-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2));

  return {
    area: term1 + term2 - term3,
    state: OverlapState.OVERLAP
  };
}

export function computeEclipseStatus(
  date: Date,
  location: ObserverLocation
): EclipseResult {
  const observer = new Observer(location.lat, location.lon, location.elevation || 0);
  const equSun = Equator(Body.Sun, date, observer, true, true);
  const equMoon = Equator(Body.Moon, date, observer, true, true);
  const horSun = Horizon(date, observer, equSun.ra, equSun.dec, 'normal');
  const horMoon = Horizon(date, observer, equMoon.ra, equMoon.dec, 'normal');

  const deg2rad = Math.PI / 180;

  const x1 = Math.cos(horMoon.altitude * deg2rad) * Math.cos(horMoon.azimuth * deg2rad);
  const y1 = Math.cos(horMoon.altitude * deg2rad) * Math.sin(horMoon.azimuth * deg2rad);
  const z1 = Math.sin(horMoon.altitude * deg2rad);

  const x2 = Math.cos(horSun.altitude * deg2rad) * Math.cos(horSun.azimuth * deg2rad);
  const y2 = Math.cos(horSun.altitude * deg2rad) * Math.sin(horSun.azimuth * deg2rad);
  const z2 = Math.sin(horSun.altitude * deg2rad);

  const dot = x1 * x2 + y1 * y2 + z1 * z2;
  const angularDist_rad = Math.acos(Math.max(-1, Math.min(1, dot)));

  const sunRadius_rad = 0.0093 / 2;

  // Angular size of moon in radians on the date of the eclipse (apparent diameter: 0 deg 33')
  const moonRadius_rad = 0.00959931 / 2;

  const ov = computeCircleOverlap(moonRadius_rad, sunRadius_rad, angularDist_rad);

  let illumination = 1.0;

  if (ov.state === OverlapState.HIDDEN) {
    illumination = 0.0;
  }
  else if (ov.state === OverlapState.NO_OVERLAP) {
    illumination = 1.0;
  }
  else  { // ov.state === OverlapState.OVERLAP 
    illumination = 1.0 - (ov.area / (Math.PI * sunRadius_rad * sunRadius_rad));
  }

  return {
    eclipse: ov.state,
    illumination: illumination,
    sun: { azimuth: horSun.azimuth, altitude: horSun.altitude },
    moon: { azimuth: horMoon.azimuth, altitude: horMoon.altitude }
  };
}
