// context/NavigationContext.js
import React, { createContext, useState, useContext } from "react";

const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
  const [selectedTab, setSelectedTab] = useState("home");

  return (
    <NavigationContext.Provider value={{ selectedTab, setSelectedTab }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigationContext = () => useContext(NavigationContext);