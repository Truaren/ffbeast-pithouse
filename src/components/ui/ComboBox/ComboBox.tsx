import "./style.scss";

import arrow_down from "@assets/down.png";
import React, { useEffect, useRef, useState } from "react";

import { Button } from "../Button";

export interface ItemAction {
  icon: string;
  label: string;
  className?: string;
  onClick: (item: ComboboxItem) => void;
}

export interface ComboboxItem {
  value: string;
  label: string;
  icon?: string;
  className?: string;
  actions?: ItemAction[];
  disabled?: boolean;
}

export interface ComboboxAction {
  label: string;
  icon?: string;
  onClick: () => void;
}

export interface ComboboxProps {
  items: ComboboxItem[];
  placeholder?: string;
  icon?: string;
  actions?: ComboboxAction[];
  onChange: (item: ComboboxItem) => void;
  value?: string;
  disabled?: boolean;
}

export const Combobox: React.FC<ComboboxProps> = ({
  items,
  placeholder = "Select...",
  icon,
  actions = [],
  onChange,
  value,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = items.find((item) => item.value === value);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleItemChange = (item: ComboboxItem) => {
    if (disabled || item.disabled) return;
    onChange(item);
    setIsOpen(false);
  };

  const handleItemAction = (
    e: React.MouseEvent,
    action: ItemAction,
    item: ComboboxItem,
  ) => {
    if (disabled || item.disabled) return;
    e.stopPropagation();
    action.onClick(item);
  };

  const handleAction = (e: React.MouseEvent, action: ComboboxAction) => {
    if (disabled) return;
    e.stopPropagation();
    action.onClick();
    setIsOpen(false);
  };

  return (
    <div
      role="combobox"
      ref={ref}
      className={`combo_box_main ${disabled ? "disabled" : ""}`}
      style={{ position: "relative", cursor: "pointer" }}
      onClick={() => !disabled && setIsOpen(!isOpen)}
    >
      <div className="left">
        {icon && <i className={`icon ${icon}`}></i>}

        <span className="selected_item">
          {selected ? selected.label : placeholder}
        </span>
      </div>
      <img
        src={arrow_down}
        className={`drop_arrow ${isOpen ? "active" : ""}`}
      ></img>
      {isOpen && (
        <div className="combobox">
          {items.map((item, i) => {
            const Icon = item.icon;
            const isSelected = selected?.value === item.value;

            return (
              <div
                key={i}
                className={`combobox_item ${isSelected ? "active" : ""} ${item.disabled ? "disabled" : ""}`}
                onClick={() => handleItemChange(item)}
              >
                {Icon && (
                  <div
                    className="dot"
                    style={{ backgroundColor: "var(--accent)" }}
                  ></div>
                )}
                {item.label}

                <div className="combobox_item_actions">
                  {item.actions?.map((action, i) => (
                    <Button
                      key={i}
                      variant="secondary"
                      icon={action.icon}
                      disabled={item.disabled ?? disabled}
                      onClick={(e) => handleItemAction(e, action, item)}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {actions.length > 0 && (
            <div className="combobox_actions">
              {actions.map((action, i) => (
                <Button
                  key={i}
                  variant="secondary"
                  icon={action.icon}
                  disabled={disabled}
                  onClick={(e) => handleAction(e, action)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
