import { TileTag } from "../enums/tileTag";

const TAGS_LIST: TileTag[] = [TileTag.None, TileTag.Bomb, TileTag.QuestionMark];

export const getNextTag = (currentTag: TileTag) => {
  const currentIndex = TAGS_LIST.findIndex((tag) => tag === currentTag);
  const nextTag = TAGS_LIST[currentIndex + 1];
  return nextTag || TAGS_LIST[0];
};
