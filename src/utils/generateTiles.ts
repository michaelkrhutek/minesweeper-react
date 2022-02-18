import { FieldSize } from "../models/fieldModel";
import { TileModel } from "../models/tileModel";
import { TilePosition } from "../types/tilePosition";
import { getTilePositionId } from "./getPositionId";

export const generateTiles = ({
  validatedSize,
  onSweep,
}: {
  validatedSize: FieldSize;
  onSweep: (position: TilePosition) => void;
}): { list: TileModel[], map: Map<string, TileModel> } => {
  const map = new Map<string, TileModel>();
  const list = new Array(validatedSize.width * validatedSize.height)
    .fill(true)
    .map((_v, index) => {
      const x = index % validatedSize.width;
      const y = Math.floor(index / validatedSize.height);
      const position: TilePosition = { x, y };
      const getSurroundingTiles = getSurroundingTilesFnFactory(
        position,
        map
      );
      const tile = new TileModel({ position, getSurroundingTiles, onSweep });
      map.set(getTilePositionId(position), tile);
      return tile;
    });
  return { list, map };
};

const getSurroundingTilesFnFactory =
  (position: TilePosition, tilesMap: Map<string, TileModel>) =>
  (includeDiagonal: boolean): TileModel[] => {
    const positionsAround = calculatePositionAround(position, {
      includeDiagonal,
    });
    const surroundingTiles: TileModel[] = positionsAround
      .map((aroundPosition) => tilesMap.get(getTilePositionId(aroundPosition)))
      .filter((tile) => tile) as TileModel[];
    return surroundingTiles;
  };

const COORDINATE_MODIFIERS = [-1, 0, 1];

const calculatePositionAround = (
  originalPosition: TilePosition,
  options: { includeDiagonal?: boolean } = {}
): TilePosition[] => {
  const { includeDiagonal = false } = options;
  let positionsAround: TilePosition[] = [];
  for (let x = 0; x < COORDINATE_MODIFIERS.length; x++) {
    for (let y = 0; y < COORDINATE_MODIFIERS.length; y++) {
      const xModifier = COORDINATE_MODIFIERS[x];
      const yModifier = COORDINATE_MODIFIERS[y];
      const positionRelation = getPositionRelation(xModifier, yModifier);
      if (positionRelation === POSITION_RELATION.Center) {
        continue;
      }
      if (
        includeDiagonal === false &&
        positionRelation === POSITION_RELATION.Diagonal
      ) {
        continue;
      }
      positionsAround.push({
        x: originalPosition.x + xModifier,
        y: originalPosition.y + yModifier,
      });
    }
  }
  return positionsAround;
};

enum POSITION_RELATION {
  Orthogonal = "orthogonal",
  Diagonal = "diagonal",
  Center = "center",
}

const getPositionRelation = (
  xModifier: number,
  yModifier: number
): POSITION_RELATION => {
  if (xModifier === 0 && yModifier === 0) return POSITION_RELATION.Center;
  if (xModifier === 0 || yModifier === 0) return POSITION_RELATION.Orthogonal;
  return POSITION_RELATION.Diagonal;
};
