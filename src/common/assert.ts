/**
 * Throws an error with the provided message if the provided value does not evaluate to a true Javascript value.
 */
export function ok(value?: any, message?: string): void {
  if (!value) {
    throw new Error(
      message ? 'Assertion failed (' + message + ')' : 'Assertion Failed'
    );
  }
}
