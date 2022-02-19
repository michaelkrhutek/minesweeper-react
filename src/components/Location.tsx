import {
  LocationEntity,
  LocationMarkType,
  LocationData,
} from "minesweeper-entity";
import { useObservableState } from "observable-hooks";
import "./Location.css";

export type LocationProps = {
  location: LocationEntity;
  didGameEnded: boolean;
};

export const Location: React.FC<LocationProps> = ({ location, didGameEnded }) => {
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
    <RevealedLocation data={data} even={even} />
  ) : (
    <NotRevealedLocation
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

const NotRevealedLocation: React.FC<{
  data: LocationData;
  even: boolean;
  onLeftClick(): void;
  onRightClick(): void;
}> = ({ data: { mark }, even, onLeftClick, onRightClick }) => {
  return (
    <div
      className={`location ${
        even ? "not-revealed-location-even" : "not-revealed-location-odd"
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

const RevealedLocation: React.FC<{ data: LocationData; even: boolean }> = ({
  data: { hasBomb, surroundingBombs },
  even,
}) => {
  if (hasBomb) return <div className="location bomb">💣</div>;
  return (
    <div
      className={`location ${even ? "revealed-location-even" : "revealed-location-odd"}`}
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
