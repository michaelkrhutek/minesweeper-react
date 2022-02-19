import { useEffect, useRef, useState } from "react";

export type TimerProps = {
  startedTime: Date | null;
  didEnded: boolean;
};

export const Timer: React.FC<TimerProps> = ({ startedTime, didEnded }) => {
  const intervalRef = useRef<any>();
  const [_, set_] = useState<{}>({});
  const refresh = () => set_({});

  useEffect(() => {
    intervalRef.current = setInterval(() => refresh(), 1000 / 30);
    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (!didEnded) return;
    clearInterval(intervalRef.current);
  }, [didEnded]);

  const time = getTimeFromStart(startedTime);
  const roundedTime = Math.round(time / 100) / 10;

  return <div>Time: {roundedTime}</div>;
};

const getTimeFromStart = (startedTime: Date | null): number => {
  if (!startedTime) return 0;
  const now = new Date();
  return now.getTime() - startedTime.getTime();
};
