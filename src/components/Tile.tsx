import { useObservableState } from "observable-hooks";
import { TileData, TileModel } from "../models/tileModel";
import { getNextTag } from "../utils/getNextTag";
import "./Tile.css"

enum TileTag {
  None = "none",
  Bomb = "bomb",
  QuestionMark = "question_mark",
}

export type TileProps = {
  tile: TileModel;
};

export const Tile: React.FC<TileProps> = ({ tile }) => {
  const data = useObservableState(tile.reactiveData$);
  if (!data) return null;
  const { isSweeped, tag } = data;
  const even = (tile.position.x + tile.position.y) % 2 === 0;
  const onLeftClick = () => {
    if (data.tag !== TileTag.None) return;
    tile.sweep();
  };
  const onRightClick = () => {
    const nextTag = getNextTag(tag);
    tile.setTag(nextTag);
  };
  return isSweeped ? (
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

const TILE_TAG_ICON: Record<TileTag, string> = {
  [TileTag.None]: "",
  [TileTag.Bomb]: "🚩",
  [TileTag.QuestionMark]: "❓",
};

const NotSweepedTile: React.FC<{
  data: TileData;
  even: boolean;
  onLeftClick(): void;
  onRightClick(): void;
}> = ({ data: { tag }, even, onLeftClick, onRightClick }) => {
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
      {TILE_TAG_ICON[tag]}
    </div>
  );
};

const SweepedTile: React.FC<{ data: TileData; even: boolean }> = ({
  data: { hasBomb, bombsAround },
  even,
}) => {
  if (hasBomb) return <div className="tile bomb">💣</div>;
  return (
    <div
      className={`tile ${even ? "sweeped-tile-even" : "sweeped-tile-odd"}`}
      style={{ color: getBombsAroundFontColor(bombsAround) }}
    >
      {bombsAround || ""}
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
