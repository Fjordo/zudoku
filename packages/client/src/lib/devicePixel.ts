/**
 * The board draws its rules a whole number of device pixels wide, and for that
 * its cell stride has to land on device pixels too: at a fractional ratio — a
 * Windows display at 125%, a zoomed page, most phones — an unsnapped grid puts
 * every line at a different subpixel offset, and the browser rounds some to one
 * pixel and the next to two. The result is a grid whose lines are visibly
 * different weights.
 *
 * CSS cannot read the device pixel ratio, so it is published here as a number
 * and the board rounds its own width against it.
 */
export function publishDevicePixelRatio(): void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

  let watch: MediaQueryList | null = null;

  const apply = () => {
    const ratio = window.devicePixelRatio || 1;
    document.documentElement.style.setProperty('--dpr', String(ratio));
    watch?.removeEventListener('change', apply);
    /*
     * The query matches only this exact ratio, so it stops matching — and
     * fires — the moment the ratio changes. It is then rebuilt around the new
     * one, which is what makes a page zoom or a move to another display land.
     */
    watch = window.matchMedia(`(resolution: ${ratio}dppx)`);
    watch.addEventListener('change', apply);
  };

  apply();
}
