import { getCountry, getLocales, getTimeZone } from 'react-native-localize';
import { BP_GUIDELINES, BP_UNITS, type BPGuideline, type BPUnit } from '../config/settings';

export type RegionSettings = {
  guideline: BPGuideline;
  unit: BPUnit;
};

const EUROPEAN_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
  'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK',
  'SI', 'ES', 'SE', 'GB', 'NO', 'IS', 'LI', 'CH', 'AL', 'BA', 'ME', 'MK',
  'RS', 'XK', 'MD', 'UA', 'BY', 'TR',
]);

const AMERICAS_COUNTRIES = new Set([
  'US', 'CA', 'MX', 'BR', 'AR', 'CL', 'CO', 'PE', 'VE', 'EC', 'BO', 'PY',
  'UY', 'GY', 'SR', 'PA', 'CR', 'GT', 'HN', 'SV', 'NI', 'BZ', 'CU', 'DO',
  'HT', 'JM', 'TT', 'PR',
]);

/**
 * IANA timezone → ISO 3166-1 alpha-2 country code.
 * Used as the primary detection signal because the OS keeps the timezone
 * in sync with the device's physical location automatically.
 */
const TIMEZONE_COUNTRY_MAP: Record<string, string> = {
  // Japan
  'Asia/Tokyo': 'JP',

  // Europe
  'Europe/Vienna': 'AT',
  'Europe/Brussels': 'BE',
  'Europe/Sofia': 'BG',
  'Europe/Zagreb': 'HR',
  'Asia/Nicosia': 'CY', 'Europe/Nicosia': 'CY',
  'Europe/Prague': 'CZ',
  'Europe/Copenhagen': 'DK',
  'Europe/Tallinn': 'EE',
  'Europe/Helsinki': 'FI',
  'Europe/Paris': 'FR',
  'Europe/Berlin': 'DE',
  'Europe/Athens': 'GR',
  'Europe/Budapest': 'HU',
  'Europe/Dublin': 'IE',
  'Europe/Rome': 'IT',
  'Europe/Riga': 'LV',
  'Europe/Vilnius': 'LT',
  'Europe/Luxembourg': 'LU',
  'Europe/Malta': 'MT',
  'Europe/Amsterdam': 'NL',
  'Europe/Warsaw': 'PL',
  'Europe/Lisbon': 'PT', 'Atlantic/Azores': 'PT', 'Atlantic/Madeira': 'PT',
  'Europe/Bucharest': 'RO',
  'Europe/Bratislava': 'SK',
  'Europe/Ljubljana': 'SI',
  'Europe/Madrid': 'ES', 'Africa/Ceuta': 'ES', 'Atlantic/Canary': 'ES',
  'Europe/Stockholm': 'SE',
  'Europe/London': 'GB',
  'Europe/Oslo': 'NO',
  'Atlantic/Reykjavik': 'IS',
  'Europe/Vaduz': 'LI',
  'Europe/Zurich': 'CH',
  'Europe/Tirana': 'AL',
  'Europe/Sarajevo': 'BA',
  'Europe/Podgorica': 'ME',
  'Europe/Skopje': 'MK',
  'Europe/Belgrade': 'RS',
  'Europe/Pristina': 'XK',
  'Europe/Chisinau': 'MD',
  'Europe/Kiev': 'UA', 'Europe/Kyiv': 'UA',
  'Europe/Minsk': 'BY',
  'Europe/Istanbul': 'TR', 'Asia/Istanbul': 'TR',

  // Americas
  'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US',
  'America/Los_Angeles': 'US', 'America/Phoenix': 'US', 'America/Anchorage': 'US',
  'Pacific/Honolulu': 'US', 'America/Detroit': 'US',
  'America/Indiana/Indianapolis': 'US', 'America/Kentucky/Louisville': 'US',
  'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Winnipeg': 'CA',
  'America/Edmonton': 'CA', 'America/Halifax': 'CA', 'America/St_Johns': 'CA',
  'America/Mexico_City': 'MX', 'America/Cancun': 'MX', 'America/Monterrey': 'MX',
  'America/Sao_Paulo': 'BR', 'America/Manaus': 'BR', 'America/Belem': 'BR',
  'America/Fortaleza': 'BR', 'America/Recife': 'BR', 'America/Bahia': 'BR',
  'America/Buenos_Aires': 'AR', 'America/Argentina/Buenos_Aires': 'AR',
  'America/Cordoba': 'AR', 'America/Argentina/Cordoba': 'AR',
  'America/Santiago': 'CL',
  'America/Bogota': 'CO',
  'America/Lima': 'PE',
  'America/Caracas': 'VE',
  'America/Guayaquil': 'EC',
  'America/La_Paz': 'BO',
  'America/Asuncion': 'PY',
  'America/Montevideo': 'UY',
  'America/Guyana': 'GY',
  'America/Paramaribo': 'SR',
  'America/Panama': 'PA',
  'America/Costa_Rica': 'CR',
  'America/Guatemala': 'GT',
  'America/Tegucigalpa': 'HN',
  'America/El_Salvador': 'SV',
  'America/Managua': 'NI',
  'America/Belize': 'BZ',
  'America/Havana': 'CU',
  'America/Santo_Domingo': 'DO',
  'America/Port-au-Prince': 'HT',
  'America/Jamaica': 'JM',
  'America/Port_of_Spain': 'TT',
  'America/Puerto_Rico': 'PR',

  // Asia
  'Asia/Shanghai': 'CN', 'Asia/Chongqing': 'CN', 'Asia/Harbin': 'CN', 'Asia/Urumqi': 'CN',
  'Asia/Hong_Kong': 'HK',
  'Asia/Seoul': 'KR',
  'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN',
  'Asia/Singapore': 'SG',
  'Asia/Kuala_Lumpur': 'MY', 'Asia/Kuching': 'MY',
  'Asia/Jakarta': 'ID', 'Asia/Makassar': 'ID', 'Asia/Jayapura': 'ID',
  'Asia/Manila': 'PH',
  'Asia/Bangkok': 'TH',
  'Asia/Ho_Chi_Minh': 'VN', 'Asia/Saigon': 'VN', 'Asia/Hanoi': 'VN',
  'Asia/Karachi': 'PK',
  'Asia/Dhaka': 'BD',
  'Asia/Colombo': 'LK',
  'Asia/Kathmandu': 'NP',
  'Asia/Yangon': 'MM', 'Asia/Rangoon': 'MM',
  'Asia/Phnom_Penh': 'KH',
  'Asia/Vientiane': 'LA',
  'Asia/Dubai': 'AE',
  'Asia/Riyadh': 'SA',
  'Asia/Baghdad': 'IQ',
  'Asia/Tehran': 'IR',
  'Asia/Beirut': 'LB',
  'Asia/Amman': 'JO',
  'Asia/Damascus': 'SY',
  'Asia/Jerusalem': 'IL', 'Asia/Tel_Aviv': 'IL',
  'Asia/Gaza': 'PS', 'Asia/Hebron': 'PS',
  'Asia/Kuwait': 'KW',
  'Asia/Bahrain': 'BH',
  'Asia/Qatar': 'QA',
  'Asia/Muscat': 'OM',
  'Asia/Aden': 'YE',
  'Asia/Tbilisi': 'GE',
  'Asia/Yerevan': 'AM',
  'Asia/Baku': 'AZ',
  'Asia/Almaty': 'KZ', 'Asia/Qyzylorda': 'KZ',
  'Asia/Tashkent': 'UZ',
  'Asia/Ashgabat': 'TM',
  'Asia/Dushanbe': 'TJ',
  'Asia/Bishkek': 'KG',
  'Asia/Kabul': 'AF',
  'Asia/Ulaanbaatar': 'MN',
  'Asia/Taipei': 'TW',

  // Africa
  'Africa/Cairo': 'EG',
  'Africa/Lagos': 'NG',
  'Africa/Johannesburg': 'ZA',
  'Africa/Nairobi': 'KE',
  'Africa/Addis_Ababa': 'ET',
  'Africa/Accra': 'GH',
  'Africa/Dar_es_Salaam': 'TZ',
  'Africa/Khartoum': 'SD',
  'Africa/Casablanca': 'MA',
  'Africa/Tunis': 'TN',
  'Africa/Algiers': 'DZ',
  'Africa/Tripoli': 'LY',
  'Africa/Abidjan': 'CI',
  'Africa/Dakar': 'SN',
  'Africa/Kampala': 'UG',
  'Africa/Lusaka': 'ZM',
  'Africa/Harare': 'ZW',
  'Africa/Maputo': 'MZ',

  // Oceania
  'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Australia/Brisbane': 'AU',
  'Australia/Perth': 'AU', 'Australia/Adelaide': 'AU', 'Australia/Darwin': 'AU',
  'Pacific/Auckland': 'NZ', 'Pacific/Chatham': 'NZ',

  // Russia
  'Europe/Moscow': 'RU', 'Europe/Kaliningrad': 'RU', 'Europe/Samara': 'RU',
  'Asia/Yekaterinburg': 'RU', 'Asia/Novosibirsk': 'RU', 'Asia/Krasnoyarsk': 'RU',
  'Asia/Irkutsk': 'RU', 'Asia/Yakutsk': 'RU', 'Asia/Vladivostok': 'RU',
  'Asia/Magadan': 'RU', 'Asia/Kamchatka': 'RU',
};

/**
 * Detects the device's country code using three signals in priority order:
 * 1. IANA timezone (most reliable — OS keeps this in sync with physical location)
 * 2. getCountry() — device region setting / SIM card
 * 3. getLocales()[0].countryCode — language locale (least reliable, language ≠ location)
 */
export function detectCountryCode(): string {
  // 1. Timezone — most reliable for physical location
  const timezone = getTimeZone();
  const tzCountry = TIMEZONE_COUNTRY_MAP[timezone];
  if (tzCountry) {
    return tzCountry;
  }

  // 2. Device region / SIM card
  const country = getCountry();
  if (country) {
    return country;
  }

  // 3. Language locale fallback
  return getLocales()[0]?.countryCode ?? '';
}

/**
 * Maps an ISO 3166-1 alpha-2 country code to the recommended
 * BP classification guideline and measurement unit.
 */
export function getSettingsForRegion(countryCode: string): RegionSettings {
  const code = countryCode.toUpperCase();

  // Japan → JSH guideline
  if (code === 'JP') {
    return { guideline: BP_GUIDELINES.JSH, unit: BP_UNITS.MMHG };
  }

  // Europe & nearby → ESC/ESH guideline
  if (EUROPEAN_COUNTRIES.has(code)) {
    return { guideline: BP_GUIDELINES.ESC_ESH, unit: BP_UNITS.MMHG };
  }

  // Americas → AHA/ACC guideline
  if (AMERICAS_COUNTRIES.has(code)) {
    return { guideline: BP_GUIDELINES.AHA_ACC, unit: BP_UNITS.MMHG };
  }

  // Rest of world → WHO/ISH (most internationally neutral)
  return { guideline: BP_GUIDELINES.AHA_ACC, unit: BP_UNITS.MMHG };
}
