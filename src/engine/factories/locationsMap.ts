import { Position } from "../types/position";
import { LocationEntity } from "./location";

export type LocationsMapEntity = {
  setLocation: (location: LocationEntity) => void;
  getLocation: (position: Position) => LocationEntity | undefined;
  createSurroundingLocationsGetter: (
    position: Position,
    maxDistance: number
  ) => () => LocationEntity[];
  getArray: () => LocationEntity[];
};

export const createLocationsMapEntity = (): LocationsMapEntity => {
  const map = new Map<string, LocationEntity>();

  const setLocation: LocationsMapEntity["setLocation"] = (location) => {
    const key = transformPositionToKeyString(location.position);
    map.set(key, location);
  };

  const getLocation: LocationsMapEntity["getLocation"] = (position) => {
    const key = transformPositionToKeyString(position);
    return map.get(key);
  };

  const createSurroundingLocationsGetter: LocationsMapEntity["createSurroundingLocationsGetter"] =
    (position, maxDistance) => () => {
      const surroundingLocations: LocationEntity[] = [];
      getSurroundingPositions(position, maxDistance).forEach((position) => {
        const location = getLocation(position);
        if (!location) return;
        surroundingLocations.push(location);
      });
      return surroundingLocations;
    };

  const getArray = () => Array.from(map.values());

  return {
    setLocation,
    getLocation,
    createSurroundingLocationsGetter,
    getArray,
  };
};

const transformPositionToKeyString = (position: Position): string => {
  const { x, y, z } = position;
  return `x${x}y${y}z${z}`;
};

const getSurroundingPositions = (
  position: Position,
  maxDistance: number
): Position[] => {
  const roundedMaxDistance = Math.round(maxDistance);
  const validatedMaxDistance = roundedMaxDistance > 0 ? roundedMaxDistance : 1;
  const surroundingPositions: Position[] = [];
  for (
    let xModifier = -validatedMaxDistance;
    xModifier <= validatedMaxDistance;
    xModifier++
  ) {
    for (
      let yModifier = -validatedMaxDistance;
      yModifier <= validatedMaxDistance;
      yModifier++
    ) {
      for (
        let zModifier = -validatedMaxDistance;
        zModifier <= validatedMaxDistance;
        zModifier++
      ) {
        if (!xModifier && !yModifier && !zModifier) continue;
        surroundingPositions.push({
          x: position.x + xModifier,
          y: position.y + yModifier,
          z: position.z + zModifier,
        });
      }
    }
  }
  return surroundingPositions;
};
