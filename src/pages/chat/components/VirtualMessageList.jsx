import React from 'react';

export function VirtualMessageList({
  items,
  renderItem,
  className = '',
  innerClassName = '',
  bottomRef = null,
}) {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <div className={className}>
      <div className={innerClassName}>
        {safeItems.map((item, index) => (
          <div key={item?.key ?? index}>
            {renderItem(item, index)}
          </div>
        ))}
        {bottomRef ? <div ref={bottomRef} className="h-px w-full" /> : null}
      </div>
    </div>
  );
}
