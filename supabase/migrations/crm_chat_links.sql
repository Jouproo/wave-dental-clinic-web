-- Links to the lead's existing conversations (WhatsApp chat, Meta Business
-- Suite inbox thread) so staff can jump to the chat and back. Safe to re-run.
alter table leads add column if not exists whatsapp_chat_url text;
alter table leads add column if not exists meta_chat_url text;
