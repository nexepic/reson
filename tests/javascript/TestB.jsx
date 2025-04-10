import React from "react";

const TestB = ({ title }) => {
  const renderLines = () => {
    return Array.from({ length: 5 }, (_, i) => (
      <div key={i}>
        <p>This is line {i}</p>
        <p>{i % 2 === 0 ? "Even number" : "Odd number"}</p>
      </div>
    ));
  };

  return (
    <div>
      <h2>{title}</h2>
      {renderLines()}
      <p>End of TestB</p>
    </div>
  );
};

export default TestB;