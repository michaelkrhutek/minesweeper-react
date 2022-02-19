import { BehaviorSubject, combineLatest, map, Observable, Subject } from "rxjs";
import { LocationMarkType } from "../enums/locationMarkType";
import { WorldEventType } from "../enums/worldEventType";
import { Position } from "../types/position";
import { DimensionSize, WorldSize } from "../types/worldSize";
import { createLocationEntity, LocationData, LocationEntity } from "./location";
import { createLocationsMapEntity, LocationsMapEntity } from "./locationsMap";

export type WorldEntity = {
  size: WorldSize;
  getLocations: () => LocationEntity[];
  data$: Observable<WorldData>;
};

export type WorldData = {
  startedTime: Date | null;
  plantedBombsCount: number;
  revealedLocationsCount: number;
  bombMarksCount: number;
  didGameEnded: boolean;
  didAnyBombExploded: boolean;
};

export type WorldEntityConfig = {
  size: WorldSize;
  bombsRatio: number;
};

type WorldEntityFactory = (config: WorldEntityConfig) => WorldEntity;

export const createWorldEntity: WorldEntityFactory = ({
  size: rawSize,
  bombsRatio: rawBombsRatio,
}) => {
  let areBombsPlanted = false;
  const locationsMap = createLocationsMapEntity();
  const size = getValidatedWorldSize(rawSize);
  const worldEventSource = new Subject<WorldEventType>();
  const worldEvent$ = worldEventSource.asObservable();

  const beforeReveal = (position: Position) => {
    if (areBombsPlanted) return;
    const surroundingPositions = locationsMap
      .createSurroundingLocationsGetter(position, 1)()
      .map(({ position }) => position);
    const safePositions: Position[] = [position, ...surroundingPositions];
    plantBombs(locationsMap, rawBombsRatio, safePositions);
    areBombsPlanted = true;
    worldEventSource.next(WorldEventType.AllBombsPlanted);
    worldEventSource.complete();
    const now = new Date();
    startedTimeSource.next(now);
  };

  generateLocations({ locationsMap, size, worldEvent$, beforeReveal });

  const startedTimeSource = new BehaviorSubject<Date | null>(null);
  const startedTime$ = startedTimeSource.asObservable();

  const derivedData$: Observable<Omit<WorldData, "startedTime">> =
    combineLatest(locationsMap.getArray().map(({ data$ }) => data$)).pipe(
      map((locationsDataList) => {
        const data: Omit<WorldData, "startedTime"> = locationsDataList.reduce(
          (previousWorldData, locationData, _i, array) => {
            return locationsDataReducer(
              array.length,
              locationData,
              previousWorldData
            );
          },
          {
            plantedBombsCount: 0,
            revealedLocationsCount: 0,
            bombMarksCount: 0,
            didGameEnded: false,
            didAnyBombExploded: false,
          } as Omit<WorldData, "startedTime">
        );
        return data;
      })
    );

  const data$: Observable<WorldData> = combineLatest([
    startedTime$,
    derivedData$,
  ]).pipe(
    map(([startedTime, derivedData]) => {
      return {
        startedTime,
        ...derivedData,
      };
    })
  );

  return {
    size,
    getLocations: locationsMap.getArray,
    data$,
  };
};

const getValidatedWorldSize = (rawWorldSize: WorldSize): WorldSize => {
  return {
    x: getValidatedDimensionSize(rawWorldSize.x, 10),
    y: getValidatedDimensionSize(rawWorldSize.y, 10),
    z: getValidatedDimensionSize(rawWorldSize.z, 1),
  };
};

const getValidatedDimensionSize = (
  rawDimensionSize: DimensionSize,
  minSize: number
): DimensionSize => {
  const validatedMinSize = minSize > 1 ? minSize : 1;
  const { start, end: rawEnd } = rawDimensionSize;
  if (rawEnd - start >= validatedMinSize) return rawDimensionSize;
  const end = start + validatedMinSize - 1;
  return { start, end };
};

type GenerateLocationsConfig = {
  locationsMap: LocationsMapEntity;
  size: WorldSize;
  worldEvent$: Observable<WorldEventType>;
  beforeReveal: (position: Position) => void;
};

const generateLocations = ({
  locationsMap,
  size,
  worldEvent$,
  beforeReveal,
}: GenerateLocationsConfig) => {
  const list: LocationEntity[] = [];
  for (let x = size.x.start; x <= size.x.end; x++) {
    for (let y = size.y.start; y <= size.y.end; y++) {
      for (let z = size.z.start; z <= size.z.end; z++) {
        const position: Position = { x, y, z };
        const getSurroundingLocations =
          locationsMap.createSurroundingLocationsGetter(position, 1);
        const location = createLocationEntity({
          position,
          getSurroundingLocations,
          worldEvent$,
          beforeReveal,
        });
        list.push(location);
        locationsMap.setLocation(location);
      }
    }
  }
};

const plantBombs = (
  locationsMap: LocationsMapEntity,
  bombsRatio: number,
  safePositions: Position[]
) => {
  const locations = locationsMap.getArray();
  const totalLocations = locations.length;
  const totalBombsToPlant = getBombsCount(totalLocations, bombsRatio);
  const totalUnsafeLocations = totalLocations - totalBombsToPlant;
  let remainingBombsToPlant = totalBombsToPlant;
  locations.forEach((location, index) => {
    let remainingUnsafeLocations = totalUnsafeLocations - index;
    const isSafeLocation = safePositions.some((position) =>
      getIsExactPosition(location.position, position)
    );
    if (isSafeLocation) return;
    const bombProbability = remainingBombsToPlant / remainingUnsafeLocations;
    const willPlantBomb = bombProbability > Math.random();
    if (!willPlantBomb) return;
    location.patchData({ hasBomb: true });
    remainingBombsToPlant--;
  });
};

const getBombsCount = (locationsCount: number, bombsRatio: number): number => {
  let validatedBombsRatio = bombsRatio;
  if (bombsRatio < 0.1) {
    validatedBombsRatio = 0.1;
  }
  if (bombsRatio > 0.4) {
    validatedBombsRatio = 0.4;
  }
  return Math.round(locationsCount * validatedBombsRatio);
};

const locationsDataReducer = (
  totalLocationsCount: number,
  locationData: LocationData,
  worldData: Omit<WorldData, "startedTime">
): Omit<WorldData, "startedTime"> => {
  const plantedBombsCount =
    worldData.plantedBombsCount + (locationData.hasBomb ? 1 : 0);
  const revealedLocationsCount =
    worldData.revealedLocationsCount + (locationData.isRevealed ? 1 : 0);
  const bombMarksCount =
    worldData.bombMarksCount +
    (locationData.mark === LocationMarkType.Bomb ? 1 : 0);
  const didAnyBombExploded =
    worldData.didAnyBombExploded ||
    (locationData.hasBomb && locationData.isRevealed);
  const areAllLocationsWithoutBombRevealed =
    revealedLocationsCount + plantedBombsCount >= totalLocationsCount;
  const didGameEnded = didAnyBombExploded || areAllLocationsWithoutBombRevealed;
  return {
    plantedBombsCount,
    revealedLocationsCount,
    bombMarksCount,
    didGameEnded,
    didAnyBombExploded,
  };
};

const getIsExactPosition = (
  position1: Position,
  position2: Position
): boolean => {
  if (position1.x !== position2.x) return false;
  if (position1.y !== position2.y) return false;
  if (position1.z !== position2.z) return false;
  return true;
};
