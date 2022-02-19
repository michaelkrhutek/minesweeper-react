import { BehaviorSubject, Observable } from "rxjs";
import { LocationMarkType } from "../enums/locationMarkType";
import { WorldEventType } from "../enums/worldEventType";
import { Position } from "../types/position";

export type LocationEntityConfig = {
  position: Position;
  getSurroundingLocations: () => LocationEntity[];
  worldEvent$: Observable<WorldEventType>;
  beforeReveal: (position: Position) => void;
};

export type LocationData = {
  isRevealed: boolean;
  hasBomb: boolean;
  mark: LocationMarkType;
  surroundingBombs: number;
};

export type LocationEntity = {
  position: Position;
  data$: Observable<LocationData>;
  getCurrentData: () => LocationData;
  patchData: (patches: Partial<LocationData>) => void;
  reveal: () => void;
  setMark: (mark: LocationMarkType) => void;
};

type LocationEntityFactory = (config: LocationEntityConfig) => LocationEntity;

export const createLocationEntity: LocationEntityFactory = ({
  position,
  getSurroundingLocations,
  worldEvent$,
  beforeReveal,
}) => {
  const source = new BehaviorSubject<LocationData>({
    isRevealed: false,
    hasBomb: false,
    mark: LocationMarkType.None,
    surroundingBombs: 0,
  });

  const data$ = source.asObservable();

  const getCurrentData = () => source.getValue();

  const patchData = (patches: Partial<LocationData>) => {
    const currentData = getCurrentData();
    source.next({ ...currentData, ...patches });
  };

  const reveal: LocationEntity["reveal"] = () => {
    const { isRevealed, hasBomb, surroundingBombs } = getCurrentData();
    if (isRevealed) return;
    beforeReveal(position);
    patchData({ isRevealed: true });
    if (hasBomb || surroundingBombs > 0) return;
    getSurroundingLocations().forEach((location) => location.reveal());
  };

  const setMark: LocationEntity["setMark"] = (mark: LocationMarkType) => {
    patchData({ mark });
  };

  worldEvent$.subscribe((event) => {
    if (event === WorldEventType.AllBombsPlanted) {
      const surroundingBombs = getSurroundingLocations().filter(
        ({ getCurrentData }) => getCurrentData().hasBomb
      ).length;
      patchData({ surroundingBombs });
    }
  });

  return Object.freeze({
    position,
    data$,
    getCurrentData,
    patchData,
    reveal,
    setMark,
  });
};
