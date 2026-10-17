// Regression fixture from the review of Ajaxy/teact#7 (oss-plan evidence, VSvgClass): `className` of an SVG element
// rendered by a component inside <svg>
import { useState } from '@teact/core';

const Inner = ({ isOn }: { isOn: boolean }) => (
  <rect data-testid="class-rect" className={isOn ? 'on' : 'off'} width="10" height="10" />
);

export default function ReviewSvgClass() {
  const [isOn, setIsOn] = useState(false);

  return (
    <div>
      <button id="class-toggle" onClick={() => setIsOn((current) => !current)}>toggle</button>
      <svg width="20" height="20"><Inner isOn={isOn} /></svg>
      <span data-testid="class-state">{String(isOn)}</span>
    </div>
  );
}
