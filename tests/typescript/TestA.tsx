import React from "react";

type TestAProps = {
  message: string;
};

const TestA: React.FC<TestAProps> = ({ message }) => {
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
      <h1>{message}</h1>
      {renderLines()}
    </div>
  );
};

export default TestA;