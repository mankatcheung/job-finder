import { fetch } from 'expo/fetch';

// Default export (rather than re-exporting the named `fetch` binding) so
// this module mocks reliably in tests — Jest's interop with a re-exported
// named binding from a package subpath ('expo/fetch') was returning an
// object whose `.fetch` property didn't reflect the mock factory's value.
export default fetch;
