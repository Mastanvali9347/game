import React from 'react';
import './NumberBoard.css';

function NumberBoard({ calledNumbers = [], currentNumber }) {
  const calledSet = new Set(calledNumbers); // ✅ faster lookup

  return (
    <div className="number-board">
      
      {/* Header */}
      <div className="board-header">
        <h3 className="board-title">
          Number Board
        </h3>
        <span className="board-range">
          1 – 90
        </span>
      </div>

      {/* Grid */}
      <div className="number-grid">
        {Array.from({ length: 90 }, (_, i) => {
          const num = i + 1;
          const isCalled = calledSet.has(num);
          const isCurrent = currentNumber === num;

          return (
            <div
              key={num}
              className={`number-cell ${isCurrent ? 'is-current' : ''} ${isCalled ? 'is-called' : ''}`}
            >
              {num}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default NumberBoard;