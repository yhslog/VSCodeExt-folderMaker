/**
 * Case conversion utilities
 * Provides transformation functions for different naming conventions
 */

/**
 * Converts a string to kebab-case
 *
 * @param input - Input string in any case format
 * @returns Lowercase string with hyphens between words
 *
 * @example
 * toKebab('UserProfile')     // 'user-profile'
 * toKebab('XMLHttpRequest')  // 'xml-http-request'
 * toKebab('user_profile')    // 'user-profile'
 */
export function toKebab(input: string): string {
  return input
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .toLowerCase();
}

/**
 * Converts a string to camelCase
 *
 * @param input - Input string in any case format
 * @returns camelCase string with first letter lowercase
 *
 * @example
 * toCamel('user-profile')     // 'userProfile'
 * toCamel('UserProfile')      // 'userProfile'
 * toCamel('user_profile')     // 'userProfile'
 */
export function toCamel(input: string): string {
  return input
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
    .replace(/^(.)/, (m) => m.toLowerCase());
}

/**
 * Converts a string to PascalCase
 *
 * @param input - Input string in any case format
 * @returns PascalCase string with first letter uppercase
 *
 * @example
 * toPascal('user-profile')    // 'UserProfile'
 * toPascal('userProfile')     // 'UserProfile'
 * toPascal('user_profile')    // 'UserProfile'
 */
export function toPascal(input: string): string {
  if (!input) return "";

  const trimmed = input.replace(/^[-_\s]+|[-_\s]+$/g, "");
  if (!trimmed) return "";

  return trimmed
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
    .replace(/^(.)/, (m) => m.toUpperCase());
}
