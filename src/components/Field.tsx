import React, { useEffect, useMemo, useState } from "react";
import { Tile } from "./Tile";
import "./Field.css";
import { useObservableState } from "observable-hooks";
import { Timer } from "./Timer";
import {
  WorldEntityConfig,
  WorldEntity,
  createWorldEntity,
  Position,
} from "../engine";

export type FieldProps = {};

const WORLD_CONFIG: WorldEntityConfig = {
  size: {
    x: { start: 0, end: 9 },
    y: { start: 0, end: 9 },
    z: { start: 0, end: 0 },
  },
  bombsRatio: 0.1,
};

const TILE_CONTAINER_CSS_SIZE = {
  width: 2.5,
  height: 2.5,
  unit: "rem",
};

const MemoizedTile = React.memo(Tile);

export const Field = () => {
  const [world, setWorld] = useState<WorldEntity>(
    createWorldEntity(WORLD_CONFIG)
  );

  const restart = () => {
    const newWorld = createWorldEntity(WORLD_CONFIG);
    setWorld(newWorld);
  };

  const styles = useMemo<React.CSSProperties>(() => {
    const widthValue =
      (world.size.x.end - world.size.x.start) * TILE_CONTAINER_CSS_SIZE.width;
    const heightValue =
      (world.size.y.end - world.size.y.start) * TILE_CONTAINER_CSS_SIZE.height;
    return {
      width: `${widthValue}${TILE_CONTAINER_CSS_SIZE.unit}`,
      height: `${heightValue}${TILE_CONTAINER_CSS_SIZE.unit}`,
    };
  }, []);
  const locations = world.getLocations();
  const data = useObservableState(world.data$);

  const endGameText = useMemo<string>(() => {
    if (!data || !data.didGameEnded) return "";
    return data.didAnyBombExploded ? "You lost" : "You won";
  }, [data?.didGameEnded, data?.didAnyBombExploded]);

  if (!data) return null;
  return (
    <>
      <div>
        <button onClick={restart}>Restart</button>
      </div>

      <div className="game-info-container">
        {data.startedTime ? (
          <>
            <Timer
              startedTime={data.startedTime}
              didEnded={data.didGameEnded}
            />
            <div>
              Remaining bombs: {data.plantedBombsCount - data.bombMarksCount}
            </div>
            <div>{endGameText}</div>
          </>
        ) : null}
      </div>
      <div className="field" style={styles}>
        {locations.map((location) => (
          <TileContainer
            key={`x${location.position.x}y${location.position.y}z${location.position.z}`}
            position={location.position}
          >
            <MemoizedTile
              location={location}
              didGameEnded={data.didGameEnded}
            />
          </TileContainer>
        ))}
      </div>
    </>
  );
};

const TileContainer: React.FC<{ position: Position }> = ({
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
