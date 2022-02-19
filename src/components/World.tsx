import React, { useMemo, useState } from "react";
import { Location } from "./Location";
import "./World.css";
import { useObservableState } from "observable-hooks";
import { Timer } from "./Timer";
import {
  WorldEntityConfig,
  WorldEntity,
  createWorldEntity,
  Position,
} from "minesweeper-entity";

export type WorldProps = {};

const WORLD_CONFIG: WorldEntityConfig = {
  size: {
    x: { start: 0, end: 9 },
    y: { start: 0, end: 9 },
    z: { start: 0, end: 0 },
  },
  bombsRatio: 0.1,
};

const LOCATION_CONTAINER_CSS_SIZE = {
  width: 2.5,
  height: 2.5,
  unit: "rem",
};

const MemoizedLocation = React.memo(Location);

export const World = () => {
  const [world, setWorld] = useState<WorldEntity>(
    createWorldEntity(WORLD_CONFIG)
  );

  const restart = () => {
    const newWorld = createWorldEntity(WORLD_CONFIG);
    setWorld(newWorld);
  };

  const styles = useMemo<React.CSSProperties>(() => {
    const widthValue =
      (world.size.x.end - world.size.x.start) *
      LOCATION_CONTAINER_CSS_SIZE.width;
    const heightValue =
      (world.size.y.end - world.size.y.start) *
      LOCATION_CONTAINER_CSS_SIZE.height;
    return {
      width: `${widthValue}${LOCATION_CONTAINER_CSS_SIZE.unit}`,
      height: `${heightValue}${LOCATION_CONTAINER_CSS_SIZE.unit}`,
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
      <div className="world" style={styles}>
        {locations.map((location) => (
          <LocationContainer
            key={`x${location.position.x}y${location.position.y}z${location.position.z}`}
            position={location.position}
          >
            <MemoizedLocation
              location={location}
              didGameEnded={data.didGameEnded}
            />
          </LocationContainer>
        ))}
      </div>
    </>
  );
};

const LocationContainer: React.FC<{ position: Position }> = ({
  position,
  children,
}) => {
  const styles = useMemo<React.CSSProperties>(() => {
    const topValue: number = position.y * LOCATION_CONTAINER_CSS_SIZE.height;
    const leftValue: number = position.x * LOCATION_CONTAINER_CSS_SIZE.width;
    return {
      width: `${LOCATION_CONTAINER_CSS_SIZE.width}${LOCATION_CONTAINER_CSS_SIZE.unit}`,
      height: `${LOCATION_CONTAINER_CSS_SIZE.height}${LOCATION_CONTAINER_CSS_SIZE.unit}`,
      top: `${topValue}${LOCATION_CONTAINER_CSS_SIZE.unit}`,
      left: `${leftValue}${LOCATION_CONTAINER_CSS_SIZE.unit}`,
    };
  }, [position.x, position.y]);
  return (
    <div className="location-container" style={styles}>
      {children}
    </div>
  );
};
