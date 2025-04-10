import React from "react";

const TestC = ({ header }) => {
  const renderLines = () => {
    return Array.from({ length: 5 }, (_, i) => (
      <div key={i}>
        <p>This is line {i}</p>
        <p>{i % 2 === 0 ? "Even number" : "Odd number"}</p>
        <p>Current iteration: {i}</p>
      </div>
    ));
  };

  return (
    <div>
      <h3>{header}</h3>
      {renderLines()}
      <p>End of TestC</p>
    </div>
  );
};

export default TestC;