import { TilePosition } from "../types/tilePosition";

export const getTilePositionId = (position: TilePosition) => {
  return `x${position.x}y${position.y}`;
};
