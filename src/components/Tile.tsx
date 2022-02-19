import { useObservableState } from "observable-hooks";
import { LocationData, LocationEntity } from "../engine";
import { LocationMarkType } from "../engine/enums/locationMarkType";
import "./Tile.css";

export type TileProps = {
  location: LocationEntity;
  didGameEnded: boolean;
};

export const Tile: React.FC<TileProps> = ({ location, didGameEnded }) => {
  const data = useObservableState(location.data$);
  if (!data) return null;
  const { isRevealed, mark } = data;
  const even = (location.position.x + location.position.y) % 2 === 0;
  const onLeftClick = () => {
    if (didGameEnded) return;
    if (data.mark !== LocationMarkType.None) return;
    location.reveal();
  };
  const onRightClick = () => {
    if (didGameEnded) return;
    const nextMark =
      mark === LocationMarkType.None
        ? LocationMarkType.Bomb
        : LocationMarkType.None;
    location.setMark(nextMark);
  };
  return isRevealed ? (
    <SweepedTile data={data} even={even} />
  ) : (
    <NotSweepedTile
      data={data}
      even={even}
      onLeftClick={onLeftClick}
      onRightClick={onRightClick}
    />
  );
};

const LocationMarkIcon: Record<LocationMarkType, string> = {
  [LocationMarkType.None]: "",
  [LocationMarkType.Bomb]: "🚩",
};

const NotSweepedTile: React.FC<{
  data: LocationData;
  even: boolean;
  onLeftClick(): void;
  onRightClick(): void;
}> = ({ data: { mark }, even, onLeftClick, onRightClick }) => {
  return (
    <div
      className={`tile ${
        even ? "not-sweeped-tile-even" : "not-sweeped-tile-odd"
      }`}
      onClick={onLeftClick}
      onContextMenu={(event) => {
        event.preventDefault();
        onRightClick();
      }}
    >
      {LocationMarkIcon[mark]}
    </div>
  );
};

const SweepedTile: React.FC<{ data: LocationData; even: boolean }> = ({
  data: { hasBomb, surroundingBombs },
  even,
}) => {
  if (hasBomb) return <div className="tile bomb">💣</div>;
  return (
    <div
      className={`tile ${even ? "sweeped-tile-even" : "sweeped-tile-odd"}`}
      style={{ color: getBombsAroundFontColor(surroundingBombs) }}
    >
      {surroundingBombs || ""}
    </div>
  );
};

const getBombsAroundFontColor = (value: number): string => {
  if (value === 0) return "black";
  if (value === 1) return "blue";
  if (value === 2) return "green";
  if (value === 3) return "orange";
  return "red";
};
