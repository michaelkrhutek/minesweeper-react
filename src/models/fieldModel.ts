import { Observable, combineLatest, map } from "rxjs";
import { Tile } from "../components/Tile";
import { TileTag } from "../enums/tileTag";
import { TilePosition } from "../types/tilePosition";
import { generateTiles } from "../utils/generateTiles";
import { getTilePositionId } from "../utils/getPositionId";
import { TileModel } from "./tileModel";

export interface FieldSize {
  width: number;
  height: number;
}

export type FieldModelOptions = {
  size: FieldSize;
  bombs: number;
};

export class FieldModel {
  constructor({ size, bombs }: FieldModelOptions) {
    const validatedSize = FieldModel.getValidatedSize(size);
    this.size = validatedSize;
    const validatedBombs = FieldModel.getValidatedBombs(bombs, size);
    this.bombs = validatedBombs;
    const onSweep = (position: TilePosition) => {
      const sweepedTile = this.getTile(position);
      if (!sweepedTile) return;
      this.sweepsCount++;
      if (this.sweepsCount > 1) return;
      this.plantBombs(sweepedTile);
    };
    const { list: tilesList, map: tilesMap } = generateTiles({
      validatedSize,
      onSweep,
    });
    this.tiles = tilesList;
    this.getTile = (position: TilePosition) => {
      return tilesMap.get(getTilePositionId(position)) || null;
    };
    this.didAnyBombExploded$ = combineLatest(
      tilesList.map(({ reactiveData$ }) =>
        reactiveData$.pipe(
          map(({ hasBomb, isSweeped }) => hasBomb && isSweeped)
        )
      )
    ).pipe(
      map((didExplodedList) =>
        didExplodedList.some((didExpoloded) => didExpoloded)
      )
    );
    this.remainingTilesToSweep$ = combineLatest(
      tilesList.map(({ reactiveData$ }) =>
        reactiveData$.pipe(map(({ isSweeped }) => isSweeped))
      )
    ).pipe(
      map(
        (isSweepedList) =>
          this.tiles.length -
          isSweepedList.reduce((sweepedTilesCount, isSweeped) => {
            const addition = isSweeped ? 1 : 0;
            return sweepedTilesCount + addition;
          }, this.bombs)
      )
    );
    this.remainingBombMarks$ = combineLatest(
      tilesList.map(({ reactiveData$ }) =>
        reactiveData$.pipe(map(({ tag }) => tag === TileTag.Bomb))
      )
    ).pipe(
      map(
        (didExplodedList) =>
          this.bombs -
          didExplodedList.filter((isMarkedAsBomb) => isMarkedAsBomb).length
      )
    );
  }

  private sweepsCount: number = 0;

  readonly size: FieldSize;
  readonly bombs: number;
  readonly tiles: TileModel[];
  readonly getTile: (position: TilePosition) => TileModel | null;
  readonly didAnyBombExploded$: Observable<boolean>;
  readonly remainingTilesToSweep$: Observable<number>;
  readonly remainingBombMarks$: Observable<number>;

  getDidGameStarted(): boolean {
    return !!this.sweepsCount;
  }

  plantBombs(firstSweepedTile: TileModel) {
    const surroundingPositions: TilePosition[] = firstSweepedTile
      .getSurroundingTiles(true)
      .map((tile) => tile.position);
    const positionsWithoutBomb = [
      firstSweepedTile.position,
      ...surroundingPositions,
    ];
    const areaForBombs = this.tiles.length - positionsWithoutBomb.length;
    let remainingBombs = this.bombs;
    this.tiles.forEach((tile, index) => {
      if (
        positionsWithoutBomb.some(
          ({ x, y }) => tile.position.x === x && tile.position.y === y
        )
      ) {
        return;
      }
      const remainingArea = areaForBombs - index;
      const probability = remainingBombs / remainingArea;
      const numberBetweenZeroAndOne = Math.random();
      const willSetBomb = numberBetweenZeroAndOne < probability;
      if (!willSetBomb) return;
      tile.patchReactiveData({ hasBomb: true });
      remainingBombs--;
    });
    this.tiles.forEach((tile) => tile.calculateBombsAround());
  }

  static MINIMAL_SIZE_VALUE = 4;

  static getValidatedSize(size: FieldSize): FieldSize {
    const width =
      size.width > FieldModel.MINIMAL_SIZE_VALUE
        ? size.width
        : FieldModel.MINIMAL_SIZE_VALUE;
    const height =
      size.height > FieldModel.MINIMAL_SIZE_VALUE
        ? size.height
        : FieldModel.MINIMAL_SIZE_VALUE;
    return { width, height };
  }

  static MIN_BOMBS_TO_AREA_RATIO = 0.1;
  static MAX_BOMBS_TO_AREA_RATIO = 0.4;

  static getValidatedBombs(bombs: number, size: FieldSize): number {
    const area = size.width * size.height;
    const ratio = bombs / area;
    if (FieldModel.MIN_BOMBS_TO_AREA_RATIO > ratio) {
      return Math.round(area * FieldModel.MIN_BOMBS_TO_AREA_RATIO);
    }
    if (FieldModel.MAX_BOMBS_TO_AREA_RATIO < ratio) {
      return Math.round(area * FieldModel.MAX_BOMBS_TO_AREA_RATIO);
    }
    return bombs;
  }
}
