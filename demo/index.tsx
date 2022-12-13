import React, { useState } from '../src/teact/teact';
import TeactDOM from '../src/teact/teact-dom';

TeactDOM.render(
  <App/>,
  document.getElementById('root')!,
);

function App() {
  return (
    <div>
      <h1>This is Inside Div <h2>Inside H2</h2></h1>
    </div>
  );
}

function Child() {
  return (
    <div>
      This is your first component.
    </div>
  );
}

function Checkbox() {
  const [isChecked, setIsChecked] = useState(true);

  function handleCheck() {
    setIsChecked((current) => !current);
  }

  return (
    <label>
      <input type="checkbox" checked={isChecked} onChange={handleCheck} />
      This is a controlled form element.
    </label>
  );
}
