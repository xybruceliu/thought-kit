import React from 'react';
import { Text } from '@chakra-ui/react';
import { useSettingsStore } from '../store/settingsStore';

/**
 * A subtle information display in the top left corner
 * Currently shows interface type, but can be expanded to show more app info
 */
const AppInfo: React.FC = () => {
  // Get the current interface type from settings store
  const interfaceType = useSettingsStore(state => state.interfaceType);
  
  return (
    <Text
      position="absolute"
      top="10px"
      left="10px"
      fontSize="xs"
      color="gray.700"
      fontWeight="light"
      opacity="0.7"
      zIndex="10"
      pointerEvents="none"
    >
      Interface {interfaceType}
    </Text>
  );
};

export default AppInfo; 