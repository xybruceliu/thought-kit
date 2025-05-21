/**
 * String diff utilities for detecting new content in text input
 */

/**
 * Find the longest common prefix between two strings
 */
export const findLongestCommonPrefix = (str1: string, str2: string): string => {
  let i = 0;
  while (i < str1.length && i < str2.length && str1[i] === str2[i]) {
    i++;
  }
  return str1.substring(0, i);
};

/**
 * Find the longest common suffix between two strings, starting after the common prefix
 */
export const findLongestCommonSuffix = (str1: string, str2: string, prefixLength: number): string => {
  let i = 0;
  while (
    i < str1.length - prefixLength && 
    i < str2.length - prefixLength && 
    str1[str1.length - 1 - i] === str2[str2.length - 1 - i]
  ) {
    i++;
  }
  return str1.substring(str1.length - i);
};

/**
 * Detect what content is new between old and new input strings
 * Uses a simple diff algorithm to identify added or modified content
 * 
 * @param oldInput - The previous input string
 * @param newInput - The current input string
 * @returns A string containing what appears to be newly added content
 */
export const detectNewContent = (oldInput: string, newInput: string): string => {
  // Simple case: if starting fresh or old input is empty
  if (!oldInput) return newInput;
  
  // Simple case: just appending to the end
  if (newInput.startsWith(oldInput)) {
    return newInput.slice(oldInput.length);
  }
  
  // For more complex edits, attempt to identify what's new
  const prefix = findLongestCommonPrefix(oldInput, newInput);
  const prefixLength = prefix.length;
  
  // If they share a prefix, then check for a common suffix
  const suffix = findLongestCommonSuffix(oldInput, newInput, prefixLength);
  
  // If we found both prefix and suffix, what's in the middle is likely new
  if (prefixLength > 0 || suffix.length > 0) {
    // Get the middle part from the new input
    const newMiddle = newInput.substring(
      prefixLength,
      newInput.length - suffix.length
    );
    
    // Get the middle part from the old input
    const oldMiddle = oldInput.substring(
      prefixLength, 
      oldInput.length - suffix.length
    );
    
    // If the new middle is longer, it likely contains new content
    if (newMiddle.length > oldMiddle.length) {
      return newMiddle;
    }
    
    // If the new input is shorter (user deleted something)
    if (newInput.length < oldInput.length) {
      return "[User deleted content]";
    }
  }
  
  // Fallback: just return the new input if we can't determine what changed
  return newInput;
};
