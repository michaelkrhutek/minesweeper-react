import { useObservableState } from "observable-hooks";
import React, { useEffect, useMemo } from "react";
import { FieldModel, FieldModelOptions } from "../models/fieldModel";
import { TilePosition } from "../types/tilePosition";
import { getTilePositionId } from "../utils/getPositionId";
import { Tile } from "./Tile";
import "./Field.css";

export type FieldProps = {};

const FIELD_MODEL_OPTIONS: FieldModelOptions = {
  size: { width: 15, height: 15 },
  bombs: 40,
};

const TILE_CONTAINER_CSS_SIZE = {
  width: 2.5,
  height: 2.5,
  unit: "rem",
};

export const Field = () => {
  const options = FIELD_MODEL_OPTIONS;
  const field = useMemo(() => new FieldModel(options), []);
  const didAnyBombExploded = useObservableState(field.didAnyBombExploded$);
  const remainingBombMarks = useObservableState(field.remainingBombMarks$);
  const remainingTilesToSweep = useObservableState(field.remainingTilesToSweep$);
  const styles = useMemo<React.CSSProperties>(() => {
    const widthValue = field.size.width * TILE_CONTAINER_CSS_SIZE.width;
    const heightValue = field.size.height * TILE_CONTAINER_CSS_SIZE.height;
    return {
      width: `${widthValue}${TILE_CONTAINER_CSS_SIZE.unit}`,
      height: `${heightValue}${TILE_CONTAINER_CSS_SIZE.unit}`,
    };
  }, [field]);
  useEffect(() => {
    if (!didAnyBombExploded) return;
    alert('You lost!');
  }, [didAnyBombExploded]);
  useEffect(() => {
    if (!field.getDidGameStarted()) return;
    if (remainingTilesToSweep) return;
    alert('You won!');
  }, [remainingTilesToSweep])
  return (
    <>
      <div>{didAnyBombExploded ? "ANO" : "NE"}</div>
      <div>Remaining tiles to sweep: {remainingTilesToSweep}</div>
      <div>Remaining bombs: {remainingBombMarks}</div>
      <div className="field" style={styles}>
        {field.tiles.map((tile) => (
          <TileContainer
            key={getTilePositionId(tile.position)}
            position={tile.position}
          >
            <Tile tile={tile} />
          </TileContainer>
        ))}
      </div>
    </>
  );
};

const TileContainer: React.FC<{ position: TilePosition }> = ({
  position,
  children,
}) => {
  const styles = useMemo<React.CSSProperties>(() => {
    const topValue: number = position.y * TILE_CONTAINER_CSS_SIZE.height;
    const leftValue: number = position.x * TILE_CONTAINER_CSS_SIZE.width;
    return {
      width: `${TILE_CONTAINER_CSS_SIZE.width}${TILE_CONTAINER_CSS_SIZE.unit}`,
      height: `${TILE_CONTAINER_CSS_SIZE.height}${TILE_CONTAINER_CSS_SIZE.unit}`,
      top: `${topValue}${TILE_CONTAINER_CSS_SIZE.unit}`,
      left: `${leftValue}${TILE_CONTAINER_CSS_SIZE.unit}`,
    };
  }, [position.x, position.y]);
  return (
    <div className="tile-container" style={styles}>
      {children}
    </div>
  );
};
