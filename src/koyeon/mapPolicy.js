// HomePage.jsx initialBound and minZoom, with campus boundaries enabled.
export const CAMPUS_BOUNDS={south:37.58,west:127.02,north:37.60,east:127.04};
export const MIN_ZOOM=13.3;
export function isWithinCampus(latitude,longitude){
  return Number.isFinite(latitude)&&Number.isFinite(longitude)&&latitude>=CAMPUS_BOUNDS.south&&latitude<=CAMPUS_BOUNDS.north&&longitude>=CAMPUS_BOUNDS.west&&longitude<=CAMPUS_BOUNDS.east;
}
