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
  FormLabel
} from '@chakra-ui/react';
import { SettingsIcon, createIcon } from '@chakra-ui/icons';
import { useSettingsStore } from '../store/settingsStore';
import { useBoundsStore } from '../store/boundsStore';

// Create custom microphone icon
const MicrophoneIcon = createIcon({
  displayName: 'MicrophoneIcon',
  viewBox: '0 0 24 24',
  path: (
    <path
      fill="currentColor"
      d="M12,2C10.34,2 9,3.34 9,5V11C9,12.66 10.34,14 12,14C13.66,14 15,12.66 15,11V5C15,3.34 13.66,2 12,2M12,4C12.55,4 13,4.45 13,5V11C13,11.55 12.55,12 12,12C11.45,12 11,11.55 11,11V5C11,4.45 11.45,4 12,4M19,10V12C19,15.87 15.87,19 12,19C8.13,19 5,15.87 5,12V10H3V12C3,16.25 6.09,19.78 10,20.73V23H14V20.73C17.91,19.78 21,16.25 21,12V10H19Z"
    />
  ),
});

interface SettingsProps {
  onMicrophoneClick: () => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  onMicrophoneClick 
}) => {
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
        <IconButton
          aria-label="Microphone"
          icon={<MicrophoneIcon />}
          size="md"
          variant="ghost"
          onClick={onMicrophoneClick}
          colorScheme="gray"
        />
        
        <Popover placement="right-start" strategy="fixed" gutter={2}>
          <PopoverTrigger>
            <IconButton
              aria-label="Settings"
              icon={<SettingsIcon />}
              size="md"
              variant="ghost"
              colorScheme="gray"
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
                    Clear Thoughts on Submit
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