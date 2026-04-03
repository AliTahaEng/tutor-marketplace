-- Structured audit log for all important business events
CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  TEXT NOT NULL,
  actor_id    UUID,
  entity_type TEXT,
  entity_id   UUID,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX audit_log_event_idx ON audit_log (event_type, created_at DESC);
CREATE INDEX audit_log_entity_idx ON audit_log (entity_type, entity_id, created_at DESC);
CREATE INDEX audit_log_actor_idx ON audit_log (actor_id, created_at DESC);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_admin_only"
  ON audit_log FOR SELECT
  USING (get_user_role() = 'admin');

CREATE POLICY "audit_log_system_insert"
  ON audit_log FOR INSERT
  WITH CHECK (true);

-- Convenience function for logging
CREATE OR REPLACE FUNCTION log_audit_event(
  p_event_type TEXT,
  p_actor_id UUID,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_metadata JSONB DEFAULT '{}'
) RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_log (event_type, actor_id, entity_type, entity_id, metadata)
  VALUES (p_event_type, p_actor_id, p_entity_type, p_entity_id, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-log tutor approval events
CREATE OR REPLACE FUNCTION audit_tutor_verification()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.verification_status IS DISTINCT FROM NEW.verification_status THEN
    PERFORM log_audit_event(
      'tutor.verification.' || NEW.verification_status,
      NULL,
      'tutor_profile',
      NEW.id,
      jsonb_build_object(
        'from_status', OLD.verification_status,
        'to_status', NEW.verification_status,
        'rejection_reason', NEW.rejection_reason
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tutor_verification_audit
  AFTER UPDATE ON tutor_profiles
  FOR EACH ROW EXECUTE FUNCTION audit_tutor_verification();
