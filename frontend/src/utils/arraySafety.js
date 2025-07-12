/**
 * Array Safety Utilities
 * 
 * This module provides safe array operations to prevent common errors
 * like "map is not a function" and "filter is not a function"
 */

/**
 * Safely check if a value is an array
 * @param {any} value - The value to check
 * @returns {boolean} - True if the value is an array
 */
export const isArray = (value) => {
  return Array.isArray(value);
};

/**
 * Safely get an array, returning empty array if not an array
 * @param {any} value - The value to convert to array
 * @returns {Array} - The array or empty array
 */
export const safeArray = (value) => {
  return isArray(value) ? value : [];
};

/**
 * Safely map over an array
 * @param {any} array - The array to map over
 * @param {Function} callback - The mapping function
 * @returns {Array} - The mapped array or empty array
 */
export const safeMap = (array, callback) => {
  const safeArr = safeArray(array);
  return safeArr.map(callback);
};

/**
 * Safely filter an array
 * @param {any} array - The array to filter
 * @param {Function} callback - The filter function
 * @returns {Array} - The filtered array or empty array
 */
export const safeFilter = (array, callback) => {
  const safeArr = safeArray(array);
  return safeArr.filter(callback);
};

/**
 * Safely find an element in an array
 * @param {any} array - The array to search
 * @param {Function} callback - The find function
 * @returns {any} - The found element or undefined
 */
export const safeFind = (array, callback) => {
  const safeArr = safeArray(array);
  return safeArr.find(callback);
};

/**
 * Safely check if array includes a value
 * @param {any} array - The array to check
 * @param {any} value - The value to check for
 * @returns {boolean} - True if the value is in the array
 */
export const safeIncludes = (array, value) => {
  const safeArr = safeArray(array);
  return safeArr.includes(value);
};

/**
 * Safely get array length
 * @param {any} array - The array to get length of
 * @returns {number} - The length or 0
 */
export const safeLength = (array) => {
  const safeArr = safeArray(array);
  return safeArr.length;
};

/**
 * Safely slice an array
 * @param {any} array - The array to slice
 * @param {number} start - Start index
 * @param {number} end - End index
 * @returns {Array} - The sliced array or empty array
 */
export const safeSlice = (array, start, end) => {
  const safeArr = safeArray(array);
  return safeArr.slice(start, end);
};

/**
 * Safely reduce an array
 * @param {any} array - The array to reduce
 * @param {Function} callback - The reduce function
 * @param {any} initialValue - The initial value
 * @returns {any} - The reduced value or initial value
 */
export const safeReduce = (array, callback, initialValue) => {
  const safeArr = safeArray(array);
  return safeArr.reduce(callback, initialValue);
};

/**
 * Safely sort an array
 * @param {any} array - The array to sort
 * @param {Function} compareFunction - The compare function
 * @returns {Array} - The sorted array or empty array
 */
export const safeSort = (array, compareFunction) => {
  const safeArr = safeArray(array);
  return [...safeArr].sort(compareFunction);
};

/**
 * Safely join array elements
 * @param {any} array - The array to join
 * @param {string} separator - The separator string
 * @returns {string} - The joined string or empty string
 */
export const safeJoin = (array, separator = ',') => {
  const safeArr = safeArray(array);
  return safeArr.join(separator);
};

/**
 * Safely get the first element of an array
 * @param {any} array - The array to get first element from
 * @returns {any} - The first element or undefined
 */
export const safeFirst = (array) => {
  const safeArr = safeArray(array);
  return safeArr[0];
};

/**
 * Safely get the last element of an array
 * @param {any} array - The array to get last element from
 * @returns {any} - The last element or undefined
 */
export const safeLast = (array) => {
  const safeArr = safeArray(array);
  return safeArr[safeArr.length - 1];
};

/**
 * Safely get an element at a specific index
 * @param {any} array - The array to get element from
 * @param {number} index - The index to get
 * @returns {any} - The element at index or undefined
 */
export const safeGet = (array, index) => {
  const safeArr = safeArray(array);
  return safeArr[index];
};

/**
 * Safely check if array is empty
 * @param {any} array - The array to check
 * @returns {boolean} - True if array is empty or not an array
 */
export const safeIsEmpty = (array) => {
  return safeLength(array) === 0;
};

/**
 * Safely check if array has elements
 * @param {any} array - The array to check
 * @returns {boolean} - True if array has elements
 */
export const safeHasElements = (array) => {
  return safeLength(array) > 0;
};

/**
 * Safely flatten an array
 * @param {any} array - The array to flatten
 * @param {number} depth - The depth to flatten to
 * @returns {Array} - The flattened array or empty array
 */
export const safeFlatten = (array, depth = 1) => {
  const safeArr = safeArray(array);
  return safeArr.flat(depth);
};

/**
 * Safely get unique values from an array
 * @param {any} array - The array to get unique values from
 * @returns {Array} - Array with unique values or empty array
 */
export const safeUnique = (array) => {
  const safeArr = safeArray(array);
  return [...new Set(safeArr)];
};

/**
 * Safely reverse an array
 * @param {any} array - The array to reverse
 * @returns {Array} - The reversed array or empty array
 */
export const safeReverse = (array) => {
  const safeArr = safeArray(array);
  return [...safeArr].reverse();
};

/**
 * Safely concatenate arrays
 * @param {...any} arrays - The arrays to concatenate
 * @returns {Array} - The concatenated array
 */
export const safeConcat = (...arrays) => {
  return arrays.reduce((result, array) => {
    const safeArr = safeArray(array);
    return result.concat(safeArr);
  }, []);
};

/**
 * Safely check if all elements in array pass a test
 * @param {any} array - The array to test
 * @param {Function} callback - The test function
 * @returns {boolean} - True if all elements pass the test
 */
export const safeEvery = (array, callback) => {
  const safeArr = safeArray(array);
  return safeArr.every(callback);
};

/**
 * Safely check if any element in array passes a test
 * @param {any} array - The array to test
 * @param {Function} callback - The test function
 * @returns {boolean} - True if any element passes the test
 */
export const safeSome = (array, callback) => {
  const safeArr = safeArray(array);
  return safeArr.some(callback);
};

/**
 * Safely get the index of an element in an array
 * @param {any} array - The array to search
 * @param {any} value - The value to find
 * @param {number} fromIndex - The index to start from
 * @returns {number} - The index or -1 if not found
 */
export const safeIndexOf = (array, value, fromIndex = 0) => {
  const safeArr = safeArray(array);
  return safeArr.indexOf(value, fromIndex);
};

/**
 * Safely get the last index of an element in an array
 * @param {any} array - The array to search
 * @param {any} value - The value to find
 * @param {number} fromIndex - The index to start from
 * @returns {number} - The last index or -1 if not found
 */
export const safeLastIndexOf = (array, value, fromIndex = -1) => {
  const safeArr = safeArray(array);
  return safeArr.lastIndexOf(value, fromIndex);
};

export default {
  isArray,
  safeArray,
  safeMap,
  safeFilter,
  safeFind,
  safeIncludes,
  safeLength,
  safeSlice,
  safeReduce,
  safeSort,
  safeJoin,
  safeFirst,
  safeLast,
  safeGet,
  safeIsEmpty,
  safeHasElements,
  safeFlatten,
  safeUnique,
  safeReverse,
  safeConcat,
  safeEvery,
  safeSome,
  safeIndexOf,
  safeLastIndexOf
}; 