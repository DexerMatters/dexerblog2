"use client";
import FloatingContainer from "./floating";
import MoveTransition from "./move-transition";
import { useEffect, useRef, useState } from "react";

export interface ListItem {
  name: string;
  [key: string]: any;
}

interface ListProps {
  items: ListItem[];
  className?: string;
  onItemClick?: (item: ListItem, rect: DOMRect) => void;
}

export default function List({ items, className = "", onItemClick }: ListProps) {
  const prevItemsRef = useRef<ListItem[]>([]);
  const [itemStates, setItemStates] = useState<{ [key: string]: 'enter' | 'exit' }>({});

  useEffect(() => {
    const prevItems = prevItemsRef.current;
    const newStates: { [key: string]: 'enter' | 'exit' } = {};

    // Mark all items as entering
    items.forEach(item => {
      newStates[item.name] = 'enter';
    });

    // Mark removed items as exiting
    prevItems.forEach(item => {
      if (!items.find(newItem => newItem.name === item.name)) {
        newStates[item.name] = 'exit';
      }
    });

    setItemStates(newStates);
    prevItemsRef.current = items;

    // Clean up exited items after animation completes
    const timer = setTimeout(() => {
      setItemStates(prev => {
        const cleaned = { ...prev };
        Object.keys(cleaned).forEach(key => {
          if (cleaned[key] === 'exit') {
            delete cleaned[key];
          }
        });
        return cleaned;
      });
    }, 300); // Match animation duration

    return () => clearTimeout(timer);
  }, [items]);

  const displayItems = [
    ...items,
    ...Object.keys(itemStates)
      .filter(key => itemStates[key] === 'exit')
      .map(name => prevItemsRef.current.find(item => item.name === name))
      .filter((item): item is ListItem => item !== undefined)
  ];

  return (
    <div className={`flex flex-col gap-4 items-start ${className}`} style={{ pointerEvents: 'auto', transformStyle: 'preserve-3d' }}>
      {displayItems.map((item, index) => {
        const state = itemStates[item.name] || 'enter';
        return (
          <FloatingContainer key={`${item.name}-${index}`}>
            <MoveTransition
              direction={state === 'exit' ? 'out-down' : 'in-up'}
              duration={300}
              delay={index * 40}
              display="block"
            >
              <div
                className="bg-white text-black text-sm font-mono px-3 py-2 shadow-lg cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={(e) => onItemClick && onItemClick(item, e.currentTarget.getBoundingClientRect())}
              >
                {item.name}
              </div>
            </MoveTransition>
          </FloatingContainer>
        );
      })}
    </div>
  );
}
