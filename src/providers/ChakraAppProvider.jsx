import React from 'react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';

export function ChakraAppProvider({ children }) {
  return <ChakraProvider value={defaultSystem}>{children}</ChakraProvider>;
}
