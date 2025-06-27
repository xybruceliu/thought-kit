import React from 'react';
import { 
  Box, 
  IconButton, 
  Popover, 
  PopoverTrigger, 
  PopoverContent, 
  PopoverHeader, 
  PopoverBody, 
  PopoverCloseButton,
  Flex,
  Text,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Divider,
  Switch,
  FormControl,
  FormLabel,
  keyframes,
  VStack,
  Link
} from '@chakra-ui/react';
import { Settings as SettingsIcon, Info } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { useBoundsStore } from '../store/boundsStore';

interface SettingsProps {}

const Settings: React.FC<SettingsProps> = () => {
  // Get values and setters from the settings store
  const { 
    interfaceType,
    maxThoughtCount, 
    debugMode,
    showThoughtPills,
    clearThoughtsOnSubmit,
    setInterfaceType, 
    setMaxThoughtCount,
    setDebugMode,
    setShowThoughtPills,
    setClearThoughtsOnSubmit
  } = useSettingsStore();

  const { setShowBounds } = useBoundsStore();

  const handleInterfaceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newInterface = parseInt(e.target.value);
    setInterfaceType(newInterface);
  };

  const handleMaxThoughtsChange = (valueAsString: string, valueAsNumber: number) => {
    setMaxThoughtCount(valueAsNumber);
  };

  const handleDebugToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isEnabled = e.target.checked;
    setDebugMode(isEnabled);
    setShowBounds(isEnabled);
  };

  const handleThoughtPillsToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowThoughtPills(e.target.checked);
  };
  
  const handleClearThoughtsToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClearThoughtsOnSubmit(e.target.checked);
  };

  return (
    <Box 
      position="absolute" 
      bottom="10px" 
      left="10px" 
      zIndex="10"
      bg="gray.100" 
      borderRadius="lg" 
      boxShadow="md"
      p="0"
    >
      <Flex direction="column" alignItems="center" gap={2}>
        <Popover placement="right-start" strategy="fixed" gutter={2}>
          <PopoverTrigger>
            <IconButton
              aria-label="Information"
              icon={<Info className="lucide lucide-md"/>}
              size="md"
              variant="ghost"
              colorScheme="gray"
              _hover={{
                bg: "gray.200"
              }}
            />
          </PopoverTrigger>
          <PopoverContent 
            width="280px"
            bg="gray.50"
            borderRadius="lg"
          >
            <PopoverHeader fontWeight="semibold">About</PopoverHeader>
            <PopoverCloseButton />
            <PopoverBody>
              <VStack align="start" spacing={3}>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>Overview</Text>
                  <Text fontSize="xs" color="gray.600">
                    An augmented LLM chat interface that allows users to see and interact with the "thoughtlets" 💭 of the LLM.
                  </Text>
                </Box>
                
                <Divider />
                
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>Author</Text>
                  <Text fontSize="xs" color="gray.600">Bruce Liu</Text>
                </Box>
                
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>Contact</Text>
                  <Link 
                    href="mailto:xingyuliu@ucla.edu" 
                    fontSize="xs" 
                    color="blue.500"
                    _hover={{ textDecoration: "underline" }}
                  >
                    xingyuliu@ucla.edu
                  </Link>
                </Box>
                
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>Version</Text>
                  <Text fontSize="xs" color="gray.600">0.1.0</Text>
                </Box>
              </VStack>
            </PopoverBody>
          </PopoverContent>
        </Popover>
        
        <Popover placement="right-start" strategy="fixed" gutter={2}>
          <PopoverTrigger>
            <IconButton
              aria-label="Settings"
              icon={<SettingsIcon className="lucide lucide-md"/>}
              size="md"
              variant="ghost"
              colorScheme="gray"
              _hover={{
                bg: "gray.200"
              }}
            />
          </PopoverTrigger>
          <PopoverContent 
            width="150px"
            bg="gray.50"
            borderRadius="lg"
          >
            <PopoverHeader fontWeight="semibold">Settings</PopoverHeader>
            <PopoverCloseButton />
            <PopoverBody>
              <Flex direction="column" gap={3}>
               
                  {/* <Text mb={1} fontSize="sm">Interface</Text> */}
                  <Select 
                    size="sm" 
                    value={interfaceType} 
                    onChange={handleInterfaceChange}
                  >
                    <option value={1}>Interface 1</option>
                    <option value={2}>Interface 2</option>
                  </Select>
              
                
                <Box>
                  <Text mb={1} fontSize="sm">Max Thoughts</Text>
                  <NumberInput 
                    size="sm" 
                    min={1} 
                    max={100} 
                    value={maxThoughtCount} 
                    onChange={handleMaxThoughtsChange}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </Box>

                <FormControl display='flex' alignItems='center' mt={1}>
                  <FormLabel htmlFor='show-thought-pills' mb='0' fontSize="sm">
                    Thought History
                  </FormLabel>
                  <Switch 
                    id='show-thought-pills' 
                    size='sm' 
                    isChecked={showThoughtPills}
                    onChange={handleThoughtPillsToggle}
                  />
                </FormControl>


                <FormControl display='flex' alignItems='center' mt={1}>
                  <FormLabel htmlFor='clear-thoughts-on-submit' mb='0' fontSize="sm">
                    Clear on Submit
                  </FormLabel>
                  <Switch 
                    id='clear-thoughts-on-submit' 
                    size='sm' 
                    isChecked={clearThoughtsOnSubmit}
                    onChange={handleClearThoughtsToggle}
                  />
                </FormControl>


                <FormControl display='flex' alignItems='center' mt={1}>
                  <FormLabel htmlFor='debug-mode' mb='0' fontSize="sm">
                    Debug Mode
                  </FormLabel>
                  <Switch 
                    id='debug-mode' 
                    size='sm' 
                    isChecked={debugMode}
                    onChange={handleDebugToggle}
                  />
                </FormControl>

                

              </Flex>
            </PopoverBody>
          </PopoverContent>
        </Popover>
      </Flex>
    </Box>
  );
};

export default Settings; 