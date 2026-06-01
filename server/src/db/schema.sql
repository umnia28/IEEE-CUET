CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nid_hash TEXT UNIQUE,
  birth_date DATE,
  photo_url TEXT,
  gender TEXT
    CHECK (gender IN ('female', 'male', 'other')),
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  profile_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relation TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE police_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  district TEXT NOT NULL,
  thana TEXT NOT NULL,
  address TEXT,
  latitude NUMERIC(9,6) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude NUMERIC(9,6) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended')),
  availability_status TEXT NOT NULL DEFAULT 'offline'
    CHECK (availability_status IN ('online', 'offline', 'busy')),
  reliability_score NUMERIC(5,2) NOT NULL DEFAULT 0
    CHECK (reliability_score BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE volunteer_locations (
    volunteer_id UUID PRIMARY KEY
        REFERENCES volunteers(id)
        ON DELETE CASCADE,

    latitude NUMERIC(9,6) NOT NULL
        CHECK (latitude BETWEEN -90 AND 90),

    longitude NUMERIC(9,6) NOT NULL
        CHECK (longitude BETWEEN -180 AND 180),

    accuracy_meters NUMERIC(6,2),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  incident_type TEXT NOT NULL
    CHECK (incident_type IN (
      'harassment',
      'stalking',
      'violence',
      'kidnapping',
      'suspicious_activity',
      'rape'
    )),
  description TEXT,
  latitude NUMERIC(9,6) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude NUMERIC(9,6) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  severity INT NOT NULL CHECK (severity BETWEEN 1 AND 5),
  image_url TEXT,
  verified_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verified_status IN ('pending', 'verified', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE risk_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  latitude NUMERIC(9,6) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude NUMERIC(9,6) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  time_of_day TEXT NOT NULL
    CHECK (time_of_day IN ('morning', 'afternoon', 'evening', 'night')),
  risk_score NUMERIC(5,2) NOT NULL CHECK (risk_score BETWEEN 0 AND 100),

  risk_level TEXT NOT NULL
    CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sos_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL
    CHECK (trigger_type IN ('button', 'voice')),
  latitude NUMERIC(9,6) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude NUMERIC(9,6) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  risk_score NUMERIC(5,2) CHECK (risk_score BETWEEN 0 AND 100),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'resolved', 'false_alarm')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  CHECK (
    status = 'active' OR resolved_at IS NOT NULL
  )
);


CREATE TABLE sos_location_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sos_alert_id UUID NOT NULL REFERENCES sos_alerts(id) ON DELETE CASCADE,
  latitude NUMERIC(9,6) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude NUMERIC(9,6) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE evidence_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sos_alert_id UUID NOT NULL REFERENCES sos_alerts(id) ON DELETE CASCADE,
  image_url TEXT,
  persons_detected INT NOT NULL DEFAULT 0 CHECK (persons_detected >= 0),
  vehicles_detected INT NOT NULL DEFAULT 0 CHECK (vehicles_detected >= 0),
  objects_detected JSONB,
  ai_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE voice_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  codeword TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
