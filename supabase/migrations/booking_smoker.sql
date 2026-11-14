-- Implant diagnosis form: optional "are you a smoker?" answer.
-- NULL = patient didn't answer (kept distinct from an explicit "no").
-- Safe to re-run.
alter table booking_requests add column if not exists is_smoker boolean;
