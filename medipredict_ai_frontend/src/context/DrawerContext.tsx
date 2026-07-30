import React, { createContext, useContext, useState, useRef } from 'react';
import { Animated, Dimensions, Easing } from 'react-native';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(width * 0.82, 320);

interface DrawerContextType {
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  animValue: Animated.Value;
  drawerWidth: number;
}

const DrawerContext = createContext<DrawerContextType>({
  isOpen: false,
  openDrawer: () => {},
  closeDrawer: () => {},
  toggleDrawer: () => {},
  animValue: new Animated.Value(0),
  drawerWidth: DRAWER_WIDTH,
});

export const DrawerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const animValue = useRef(new Animated.Value(0)).current;

  const openDrawer = () => {
    setIsOpen(true);
    Animated.timing(animValue, {
      toValue: 1,
      duration: 250,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(animValue, {
      toValue: 0,
      duration: 220,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => setIsOpen(false));
  };

  const toggleDrawer = () => {
    if (isOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  };

  return (
    <DrawerContext.Provider
      value={{
        isOpen,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        animValue,
        drawerWidth: DRAWER_WIDTH,
      }}
    >
      {children}
    </DrawerContext.Provider>
  );
};

export const useDrawer = () => useContext(DrawerContext);
