import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { Canvas } from './components';

const App: React.FC = () => {
  return (
    <ChakraProvider>
      <Canvas />
    </ChakraProvider>
  );
};

export default App;
