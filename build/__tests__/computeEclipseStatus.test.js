import { computeEclipseStatus, OverlapState } from '../src/computeEclipseStatus.js';
import { expect, test } from 'vitest';
test('verify eclipse on path of 2024-04-08 event', () => {
    const lat = 33.4489;
    const lon = -96.3782;
    const start = new Date("2024-04-08T17:20:00Z");
    const end = new Date("2024-04-08T20:30:00Z");
    const current = new Date(start);
    let anyOverlap = false;
    const observerLocation = { lat: lat, lon: lon, elevation: 200 };
    while (current <= end) {
        const result = computeEclipseStatus(current, observerLocation);
        const time = current.toISOString().slice(11, 19);
        const percent = (result.illumination * 100).toFixed(2);
        const status = (result.eclipse != OverlapState.NO_OVERLAP) ? "OVERLAP" : "NO OVERLAP";
        console.log(`${time} UTC | ${status} | Sun visible: ${percent}%`);
        if (result.eclipse != OverlapState.NO_OVERLAP)
            anyOverlap = true;
        current.setUTCMinutes(current.getUTCMinutes() + 1);
    }
    if (!anyOverlap) {
        throw new Error("Expected overlap not detected during eclipse interval.");
    }
    expect(anyOverlap).toBe(true);
});
//# sourceMappingURL=computeEclipseStatus.test.js.map