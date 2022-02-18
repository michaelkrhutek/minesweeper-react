import { TileTag } from "../enums/tileTag";
import { TilePosition } from "../types/tilePosition";
import { ReactiveModelBase } from "./reactiveModelBase";

export type TileData = {
  isSweeped: boolean;
  hasBomb: boolean;
  bombsAround: number;
  tag: TileTag;
};

const INITIAL_DATA: TileData = {
  isSweeped: false,
  hasBomb: false,
  bombsAround: 0,
  tag: TileTag.None,
};

export type TileModelOptions = {
  position: TilePosition;
  getSurroundingTiles: (includeDiagonal: boolean) => TileModel[];
  onSweep: (position: TilePosition) => void;
};

export class TileModel extends ReactiveModelBase<TileData> {
  constructor({ position, getSurroundingTiles, onSweep }: TileModelOptions) {
    const initialData = {
      ...INITIAL_DATA,
    };
    super(initialData);
    this.position = position;
    this.getSurroundingTiles = getSurroundingTiles;
    this.onSweep = onSweep;
  }

  readonly position: TilePosition;
  readonly getSurroundingTiles: (includeDiagonal: boolean) => TileModel[];
  private readonly onSweep: (position: TilePosition) => void;

  setTag(tag: TileTag) {
    this.patchReactiveData({ tag });
  }

  sweep() {
    this.onSweep(this.position);
    const data = this.getReactiveDataValue();
    if (!data) return;
    const { isSweeped, bombsAround } = data;
    if (isSweeped) return;
    this.patchReactiveData({ isSweeped: true });
    if (bombsAround) return;
    const surroundingTiles = this.getSurroundingTiles(true);
    surroundingTiles.forEach((tile) => tile.clear());
  }

  clear() {
    const data = this.getReactiveDataValue();
    if (!data) return;
    const { isSweeped, hasBomb, bombsAround } = data;
    if (isSweeped || hasBomb) return;
    this.patchReactiveData({ isSweeped: true });
    if ( bombsAround) return;
    const surroundingTiles = this.getSurroundingTiles(true);
    surroundingTiles.forEach((tile) => tile.clear());
  }

  calculateBombsAround() {
    const surroundingTiles = this.getSurroundingTiles(true);
    const bombsAround = surroundingTiles
      .map((surroundingTile) => surroundingTile.getReactiveDataValue()?.hasBomb)
      .filter((hasBomb) => hasBomb).length;
    this.patchReactiveData({ bombsAround });
  }
}
