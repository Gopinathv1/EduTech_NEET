/**
 * Location option data for the registration form.
 *
 * Target users are Tamil Nadu students, so Tamil Nadu is the default state and
 * its 38 districts are fully enumerated. Other states are offered but fall back
 * to a generic district option — full district lists can be added later without
 * touching the form code.
 */

export const DEFAULT_STATE = 'Tamil Nadu';

// A pragmatic list of Indian states (Tamil Nadu first so it is the default).
export const STATES: string[] = [
  'Tamil Nadu',
  'Andhra Pradesh',
  'Karnataka',
  'Kerala',
  'Telangana',
  'Maharashtra',
  'Delhi',
  'Puducherry',
  'Other',
];

// All 38 districts of Tamil Nadu.
export const TN_DISTRICTS: string[] = [
  'Ariyalur',
  'Chengalpattu',
  'Chennai',
  'Coimbatore',
  'Cuddalore',
  'Dharmapuri',
  'Dindigul',
  'Erode',
  'Kallakurichi',
  'Kanchipuram',
  'Kanyakumari',
  'Karur',
  'Krishnagiri',
  'Madurai',
  'Mayiladuthurai',
  'Nagapattinam',
  'Namakkal',
  'Nilgiris',
  'Perambalur',
  'Pudukkottai',
  'Ramanathapuram',
  'Ranipet',
  'Salem',
  'Sivaganga',
  'Tenkasi',
  'Thanjavur',
  'Theni',
  'Thoothukudi',
  'Tiruchirappalli',
  'Tirunelveli',
  'Tirupathur',
  'Tiruppur',
  'Tiruvallur',
  'Tiruvannamalai',
  'Tiruvarur',
  'Vellore',
  'Viluppuram',
  'Virudhunagar',
];

/** Districts to offer for a given state. Tamil Nadu is fully populated. */
export function districtsForState(state: string): string[] {
  if (state === 'Tamil Nadu') return TN_DISTRICTS;
  return ['Other'];
}

// Fixed option sets. Values are stored in the DB; labels are localised in the
// UI via the `auth.options.*` message keys.
export const CLASS_OPTIONS = ['11', '12', 'Repeater'] as const;
export const BOARD_OPTIONS = ['State Board', 'CBSE', 'Other'] as const;

export type ClassOption = (typeof CLASS_OPTIONS)[number];
export type BoardOption = (typeof BOARD_OPTIONS)[number];
