import type { NormalizedLocation } from "./types";

const US_STATE_ABBREVIATIONS: Record<string, string> = {
  "al": "Alabama", "ak": "Alaska", "az": "Arizona", "ar": "Arkansas", "ca": "California",
  "co": "Colorado", "ct": "Connecticut", "de": "Delaware", "fl": "Florida", "ga": "Georgia",
  "hi": "Hawaii", "id": "Idaho", "il": "Illinois", "in": "Indiana", "ia": "Iowa",
  "ks": "Kansas", "ky": "Kentucky", "la": "Louisiana", "me": "Maine", "md": "Maryland",
  "ma": "Massachusetts", "mi": "Michigan", "mn": "Minnesota", "ms": "Mississippi", "mo": "Missouri",
  "mt": "Montana", "ne": "Nebraska", "nv": "Nevada", "nh": "New Hampshire", "nj": "New Jersey",
  "nm": "New Mexico", "ny": "New York", "nc": "North Carolina", "nd": "North Dakota", "oh": "Ohio",
  "ok": "Oklahoma", "or": "Oregon", "pa": "Pennsylvania", "ri": "Rhode Island", "sc": "South Carolina",
  "sd": "South Dakota", "tn": "Tennessee", "tx": "Texas", "ut": "Utah", "vt": "Vermont",
  "va": "Virginia", "wa": "Washington", "wv": "West Virginia", "wi": "Wisconsin", "wy": "Wyoming",
  "dc": "District of Columbia"
};

const STATE_TO_ABBREVIATION: Record<string, string> = Object.fromEntries(
  Object.entries(US_STATE_ABBREVIATIONS).map(([abbr, name]) => [name.toLowerCase(), abbr.toUpperCase()])
);

const MAJOR_US_CITIES: Record<string, { state: string; stateAbbr: string }> = {
  "new york": { state: "New York", stateAbbr: "NY" },
  "new york city": { state: "New York", stateAbbr: "NY" },
  "nyc": { state: "New York", stateAbbr: "NY" },
  "los angeles": { state: "California", stateAbbr: "CA" },
  "la": { state: "California", stateAbbr: "CA" },
  "chicago": { state: "Illinois", stateAbbr: "IL" },
  "houston": { state: "Texas", stateAbbr: "TX" },
  "phoenix": { state: "Arizona", stateAbbr: "AZ" },
  "philadelphia": { state: "Pennsylvania", stateAbbr: "PA" },
  "san antonio": { state: "Texas", stateAbbr: "TX" },
  "san diego": { state: "California", stateAbbr: "CA" },
  "dallas": { state: "Texas", stateAbbr: "TX" },
  "san jose": { state: "California", stateAbbr: "CA" },
  "austin": { state: "Texas", stateAbbr: "TX" },
  "jacksonville": { state: "Florida", stateAbbr: "FL" },
  "fort worth": { state: "Texas", stateAbbr: "TX" },
  "columbus": { state: "Ohio", stateAbbr: "OH" },
  "charlotte": { state: "North Carolina", stateAbbr: "NC" },
  "san francisco": { state: "California", stateAbbr: "CA" },
  "sf": { state: "California", stateAbbr: "CA" },
  "indianapolis": { state: "Indiana", stateAbbr: "IN" },
  "seattle": { state: "Washington", stateAbbr: "WA" },
  "denver": { state: "Colorado", stateAbbr: "CO" },
  "washington": { state: "District of Columbia", stateAbbr: "DC" },
  "boston": { state: "Massachusetts", stateAbbr: "MA" },
  "el paso": { state: "Texas", stateAbbr: "TX" },
  "nashville": { state: "Tennessee", stateAbbr: "TN" },
  "detroit": { state: "Michigan", stateAbbr: "MI" },
  "oklahoma city": { state: "Oklahoma", stateAbbr: "OK" },
  "portland": { state: "Oregon", stateAbbr: "OR" },
  "las vegas": { state: "Nevada", stateAbbr: "NV" },
  "vegas": { state: "Nevada", stateAbbr: "NV" },
  "memphis": { state: "Tennessee", stateAbbr: "TN" },
  "louisville": { state: "Kentucky", stateAbbr: "KY" },
  "baltimore": { state: "Maryland", stateAbbr: "MD" },
  "milwaukee": { state: "Wisconsin", stateAbbr: "WI" },
  "albuquerque": { state: "New Mexico", stateAbbr: "NM" },
  "tucson": { state: "Arizona", stateAbbr: "AZ" },
  "fresno": { state: "California", stateAbbr: "CA" },
  "mesa": { state: "Arizona", stateAbbr: "AZ" },
  "sacramento": { state: "California", stateAbbr: "CA" },
  "atlanta": { state: "Georgia", stateAbbr: "GA" },
  "kansas city": { state: "Missouri", stateAbbr: "MO" },
  "colorado springs": { state: "Colorado", stateAbbr: "CO" },
  "miami": { state: "Florida", stateAbbr: "FL" },
  "raleigh": { state: "North Carolina", stateAbbr: "NC" },
  "omaha": { state: "Nebraska", stateAbbr: "NE" },
  "long beach": { state: "California", stateAbbr: "CA" },
  "virginia beach": { state: "Virginia", stateAbbr: "VA" },
  "oakland": { state: "California", stateAbbr: "CA" },
  "minneapolis": { state: "Minnesota", stateAbbr: "MN" },
  "tulsa": { state: "Oklahoma", stateAbbr: "OK" },
  "tampa": { state: "Florida", stateAbbr: "FL" },
  "arlington": { state: "Texas", stateAbbr: "TX" },
  "new orleans": { state: "Louisiana", stateAbbr: "LA" },
  "wichita": { state: "Kansas", stateAbbr: "KS" },
  "cleveland": { state: "Ohio", stateAbbr: "OH" },
  "bakersfield": { state: "California", stateAbbr: "CA" },
  "aurora": { state: "Colorado", stateAbbr: "CO" },
  "anaheim": { state: "California", stateAbbr: "CA" },
  "honolulu": { state: "Hawaii", stateAbbr: "HI" },
  "santa ana": { state: "California", stateAbbr: "CA" },
  "riverside": { state: "California", stateAbbr: "CA" },
  "corpus christi": { state: "Texas", stateAbbr: "TX" },
  "lexington": { state: "Kentucky", stateAbbr: "KY" },
  "stockton": { state: "California", stateAbbr: "CA" },
  "henderson": { state: "Nevada", stateAbbr: "NV" },
  "saint paul": { state: "Minnesota", stateAbbr: "MN" },
  "st paul": { state: "Minnesota", stateAbbr: "MN" },
  "st louis": { state: "Missouri", stateAbbr: "MO" },
  "saint louis": { state: "Missouri", stateAbbr: "MO" },
  "cincinnati": { state: "Ohio", stateAbbr: "OH" },
  "pittsburgh": { state: "Pennsylvania", stateAbbr: "PA" },
  "greensboro": { state: "North Carolina", stateAbbr: "NC" },
  "anchorage": { state: "Alaska", stateAbbr: "AK" },
  "plano": { state: "Texas", stateAbbr: "TX" },
  "lincoln": { state: "Nebraska", stateAbbr: "NE" },
  "orlando": { state: "Florida", stateAbbr: "FL" },
  "irvine": { state: "California", stateAbbr: "CA" },
  "newark": { state: "New Jersey", stateAbbr: "NJ" },
  "toledo": { state: "Ohio", stateAbbr: "OH" },
  "durham": { state: "North Carolina", stateAbbr: "NC" },
  "chula vista": { state: "California", stateAbbr: "CA" },
  "fort wayne": { state: "Indiana", stateAbbr: "IN" },
  "jersey city": { state: "New Jersey", stateAbbr: "NJ" },
  "st. petersburg": { state: "Florida", stateAbbr: "FL" },
  "saint petersburg": { state: "Florida", stateAbbr: "FL" },
  "laredo": { state: "Texas", stateAbbr: "TX" },
  "scottsdale": { state: "Arizona", stateAbbr: "AZ" },
  "chandler": { state: "Arizona", stateAbbr: "AZ" },
  "gilbert": { state: "Arizona", stateAbbr: "AZ" },
  "madison": { state: "Wisconsin", stateAbbr: "WI" },
  "lubbock": { state: "Texas", stateAbbr: "TX" },
  "reno": { state: "Nevada", stateAbbr: "NV" },
  "buffalo": { state: "New York", stateAbbr: "NY" },
  "glendale": { state: "Arizona", stateAbbr: "AZ" },
  "north las vegas": { state: "Nevada", stateAbbr: "NV" },
  "baton rouge": { state: "Louisiana", stateAbbr: "LA" },
  "richmond": { state: "Virginia", stateAbbr: "VA" },
  "winston-salem": { state: "North Carolina", stateAbbr: "NC" },
  "chesapeake": { state: "Virginia", stateAbbr: "VA" },
  "norfolk": { state: "Virginia", stateAbbr: "VA" },
  "fremont": { state: "California", stateAbbr: "CA" },
  "boise": { state: "Idaho", stateAbbr: "ID" },
  "salt lake city": { state: "Utah", stateAbbr: "UT" },
  "silicon valley": { state: "California", stateAbbr: "CA" },
};

const COUNTRY_ALIASES: Record<string, string> = {
  "usa": "United States",
  "us": "United States",
  "u.s.": "United States",
  "u.s.a.": "United States",
  "america": "United States",
  "united states of america": "United States",
  "uk": "United Kingdom",
  "u.k.": "United Kingdom",
  "great britain": "United Kingdom",
  "britain": "United Kingdom",
  "england": "United Kingdom",
};

export function normalizeLocation(locationStr: string): NormalizedLocation {
  const original = locationStr.trim();
  const normalized = original.toLowerCase().replace(/[.,]/g, '').trim();
  
  const countryAlias = COUNTRY_ALIASES[normalized];
  if (countryAlias) {
    return {
      original,
      country: countryAlias,
      apolloFormat: countryAlias
    };
  }
  
  const stateFromAbbr = US_STATE_ABBREVIATIONS[normalized];
  if (stateFromAbbr) {
    return {
      original,
      state: stateFromAbbr,
      country: "United States",
      apolloFormat: `${stateFromAbbr}, United States`
    };
  }
  
  const stateAbbr = STATE_TO_ABBREVIATION[normalized];
  if (stateAbbr) {
    const fullStateName = US_STATE_ABBREVIATIONS[stateAbbr.toLowerCase()];
    return {
      original,
      state: fullStateName,
      country: "United States",
      apolloFormat: `${fullStateName}, United States`
    };
  }
  
  const cityInfo = MAJOR_US_CITIES[normalized];
  if (cityInfo) {
    const properCityName = original.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    return {
      original,
      city: properCityName,
      state: cityInfo.state,
      country: "United States",
      apolloFormat: `${properCityName}, ${cityInfo.state}, United States`
    };
  }
  
  const parts = normalized.split(/[,\s]+/).filter(Boolean);
  if (parts.length >= 2) {
    const lastPart = parts[parts.length - 1];
    const secondLastPart = parts.length >= 2 ? parts[parts.length - 2] : null;
    
    const stateFromLastAbbr = US_STATE_ABBREVIATIONS[lastPart];
    if (stateFromLastAbbr) {
      const cityParts = parts.slice(0, -1);
      const cityName = cityParts.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return {
        original,
        city: cityName,
        state: stateFromLastAbbr,
        country: "United States",
        apolloFormat: `${cityName}, ${stateFromLastAbbr}, United States`
      };
    }
    
    if (secondLastPart && (COUNTRY_ALIASES[lastPart] || lastPart === 'united states')) {
      const stateFromSecond = US_STATE_ABBREVIATIONS[secondLastPart] || 
                              (STATE_TO_ABBREVIATION[secondLastPart] && US_STATE_ABBREVIATIONS[STATE_TO_ABBREVIATION[secondLastPart].toLowerCase()]);
      if (stateFromSecond) {
        const cityParts = parts.slice(0, -2);
        if (cityParts.length > 0) {
          const cityName = cityParts.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          return {
            original,
            city: cityName,
            state: stateFromSecond,
            country: "United States",
            apolloFormat: `${cityName}, ${stateFromSecond}, United States`
          };
        }
        return {
          original,
          state: stateFromSecond,
          country: "United States",
          apolloFormat: `${stateFromSecond}, United States`
        };
      }
    }
  }
  
  return {
    original,
    apolloFormat: original
  };
}

export function getApolloLocationFormats(normalizedLoc: NormalizedLocation): string[] {
  const formats: string[] = [];
  
  if (normalizedLoc.city && normalizedLoc.state) {
    formats.push(`${normalizedLoc.city}, ${normalizedLoc.state}, United States`);
    formats.push(`${normalizedLoc.city}, ${normalizedLoc.state}`);
    if (normalizedLoc.state) {
      const abbr = STATE_TO_ABBREVIATION[normalizedLoc.state.toLowerCase()];
      if (abbr) {
        formats.push(`${normalizedLoc.city}, ${abbr}`);
      }
    }
  }
  
  if (normalizedLoc.state && !normalizedLoc.city) {
    formats.push(`${normalizedLoc.state}, United States`);
    formats.push(normalizedLoc.state);
    const abbr = STATE_TO_ABBREVIATION[normalizedLoc.state.toLowerCase()];
    if (abbr) {
      formats.push(abbr);
    }
  }
  
  if (normalizedLoc.country && !normalizedLoc.state && !normalizedLoc.city) {
    formats.push(normalizedLoc.country);
  }
  
  if (formats.length === 0) {
    formats.push(normalizedLoc.apolloFormat);
  }
  
  return [...new Set(formats)];
}

export function broadenLocation(normalizedLoc: NormalizedLocation): NormalizedLocation | null {
  if (normalizedLoc.city && normalizedLoc.state) {
    return {
      original: normalizedLoc.state,
      state: normalizedLoc.state,
      country: "United States",
      apolloFormat: `${normalizedLoc.state}, United States`
    };
  }
  
  if (normalizedLoc.state && !normalizedLoc.city) {
    return {
      original: "United States",
      country: "United States",
      apolloFormat: "United States"
    };
  }
  
  return null;
}
