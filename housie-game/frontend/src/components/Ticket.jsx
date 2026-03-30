import React from 'react';
import './Ticket.css';

const Ticket = ({ ticket = [], markedNumbers = [], onMarkNumber }) => {

  const isValidTicket =
    Array.isArray(ticket) &&
    ticket.length === 3 &&
    ticket.some(row => row.some(cell => cell !== null && cell !== 0));

  if (!isValidTicket) {
    return (
      <div className="ticket-placeholder">
        <p>Waiting for ticket...</p>
      </div>
    );
  }

  const handleClick = (num) => {
    if (!num) return;
    if (typeof onMarkNumber === 'function') {
      onMarkNumber(num);
    }
  };

  return (
    <div className="ticket-container">
      <div className="ticket-gradient-top"></div>

      <div className="ticket-grid">
        {ticket.map((row, rowIndex) => (
          <div key={rowIndex} className="ticket-row">
            {row.map((cell, colIndex) => {
              const isNumber = cell !== null && cell !== 0;
              const isMarked = isNumber && markedNumbers.includes(cell);

              let cellClass = 'ticket-cell';
              if (!isNumber) cellClass += ' empty';
              else if (isMarked) cellClass += ' marked';
              else cellClass += ' available';

              return (
                <button
                  key={colIndex}
                  disabled={!isNumber}
                  onClick={() => handleClick(cell)}
                  className={cellClass}
                >
                  {isNumber ? cell : ''}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="ticket-footer">
        <span>Housie Ticket</span>
        <span>
          ID: {JSON.stringify(ticket).length.toString(36).toUpperCase()}
        </span>
      </div>
    </div>
  );
};

export default Ticket;