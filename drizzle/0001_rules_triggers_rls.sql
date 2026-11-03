-- Rules that a plain table definition cannot express: housekeeping triggers, content rules, an append-only audit log, roles, grants and Row Level Security.
-- Written by hand, applied by the same migrator as the generated file. Each statement is separated by a breakpoint so the migrator runs them one at a time.
-- Design: docs/platform/02-database.md and docs/platform/03-security-and-access.md.

-- ---------------------------------------------------------------------------------------------------------------------
-- 1. Housekeeping: updated_at and published_at
-- ---------------------------------------------------------------------------------------------------------------------
CREATE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END
$$;
--> statement-breakpoint
CREATE FUNCTION public.set_published_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at := now();
  END IF;
  RETURN NEW;
END
$$;
--> statement-breakpoint
DO $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT c.table_name FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.column_name = 'updated_at'
    GROUP BY c.table_name
  LOOP
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t.table_name || '_set_updated_at', t.table_name);
  END LOOP;
  FOR t IN
    SELECT c.table_name FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.column_name = 'published_at'
    GROUP BY c.table_name
  LOOP
    EXECUTE format('CREATE TRIGGER %I BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_published_at()', t.table_name || '_set_published_at', t.table_name);
  END LOOP;
END
$$;
--> statement-breakpoint

-- ---------------------------------------------------------------------------------------------------------------------
-- 2. Categories: two levels at most, never their own parent
-- ---------------------------------------------------------------------------------------------------------------------
CREATE FUNCTION public.check_category_depth() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    IF NEW.id IS NOT NULL AND NEW.parent_id = NEW.id THEN
      RAISE EXCEPTION 'a category cannot be its own parent' USING ERRCODE = 'check_violation';
    END IF;
    IF EXISTS (SELECT 1 FROM public.categories p WHERE p.id = NEW.parent_id AND p.parent_id IS NOT NULL) THEN
      RAISE EXCEPTION 'categories are limited to two levels: the parent % is itself a subcategory', NEW.parent_id USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.id IS NOT NULL AND EXISTS (SELECT 1 FROM public.categories c WHERE c.parent_id = NEW.id) THEN
      RAISE EXCEPTION 'category % has subcategories, so it cannot become a subcategory', NEW.id USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END
$$;
--> statement-breakpoint
CREATE TRIGGER categories_depth BEFORE INSERT OR UPDATE OF parent_id ON public.categories FOR EACH ROW EXECUTE FUNCTION public.check_category_depth();
--> statement-breakpoint

-- ---------------------------------------------------------------------------------------------------------------------
-- 3. Tools: the primary category is a top-level category and is listed in tool_categories; the subcategory belongs to it
-- ---------------------------------------------------------------------------------------------------------------------
CREATE FUNCTION public.check_tool_categories(p_tool bigint) RETURNS void LANGUAGE plpgsql AS $$
DECLARE r record;
BEGIN
  SELECT t.primary_category_id, t.subcategory_id INTO r FROM public.tools t WHERE t.id = p_tool;
  IF NOT FOUND THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM public.categories c WHERE c.id = r.primary_category_id AND c.parent_id IS NOT NULL) THEN
    RAISE EXCEPTION 'tool %: the primary category must be a top-level category', p_tool USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.tool_categories tc WHERE tc.tool_id = p_tool AND tc.category_id = r.primary_category_id) THEN
    RAISE EXCEPTION 'tool %: the primary category must also be listed in tool_categories', p_tool USING ERRCODE = 'check_violation';
  END IF;
  IF r.subcategory_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.categories c WHERE c.id = r.subcategory_id AND c.parent_id = r.primary_category_id) THEN
    RAISE EXCEPTION 'tool %: the subcategory must be a child of the primary category', p_tool USING ERRCODE = 'check_violation';
  END IF;
END
$$;
--> statement-breakpoint
CREATE FUNCTION public.tools_category_trigger() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM public.check_tool_categories(NEW.id);
  RETURN NULL;
END
$$;
--> statement-breakpoint
CREATE FUNCTION public.tool_categories_trigger() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM public.check_tool_categories(COALESCE(NEW.tool_id, OLD.tool_id));
  RETURN NULL;
END
$$;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER tools_category_rule AFTER INSERT OR UPDATE OF primary_category_id, subcategory_id ON public.tools DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.tools_category_trigger();
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER tool_categories_rule AFTER DELETE OR UPDATE ON public.tool_categories DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.tool_categories_trigger();
--> statement-breakpoint

-- ---------------------------------------------------------------------------------------------------------------------
-- 4. Reviews: a hands-on label needs a complete testing record; a documentation review never has one (mirrors src/lib/review-trust.ts)
-- ---------------------------------------------------------------------------------------------------------------------
CREATE FUNCTION public.check_review_method(p_review bigint) RETURNS void LANGUAGE plpgsql AS $$
DECLARE r record;
BEGIN
  SELECT rv.method, rv.status, EXISTS (SELECT 1 FROM public.review_testing rt WHERE rt.review_id = rv.id) AS has_testing,
         EXISTS (SELECT 1 FROM public.review_evidence re WHERE re.review_id = rv.id AND re.url IS NOT NULL) AS has_url
    INTO r FROM public.reviews rv WHERE rv.id = p_review;
  IF NOT FOUND THEN RETURN; END IF;
  IF r.method = 'hands-on' AND NOT r.has_testing THEN
    RAISE EXCEPTION 'review %: a hands-on review needs a testing record', p_review USING ERRCODE = 'check_violation';
  END IF;
  IF r.method = 'documentation' AND r.has_testing THEN
    RAISE EXCEPTION 'review %: a documentation review must not carry a testing record', p_review USING ERRCODE = 'check_violation';
  END IF;
  IF r.method = 'hands-on' AND r.status = 'published' AND NOT r.has_url THEN
    RAISE EXCEPTION 'review %: a published hands-on review needs at least one evidence item with an https URL', p_review USING ERRCODE = 'check_violation';
  END IF;
END
$$;
--> statement-breakpoint
CREATE FUNCTION public.reviews_method_trigger() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM public.check_review_method(NEW.id);
  RETURN NULL;
END
$$;
--> statement-breakpoint
CREATE FUNCTION public.review_children_trigger() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM public.check_review_method(COALESCE(NEW.review_id, OLD.review_id));
  RETURN NULL;
END
$$;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER reviews_method_rule AFTER INSERT OR UPDATE OF method, status ON public.reviews DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.reviews_method_trigger();
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER review_testing_rule AFTER INSERT OR UPDATE OR DELETE ON public.review_testing DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.review_children_trigger();
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER review_evidence_rule AFTER INSERT OR UPDATE OR DELETE ON public.review_evidence DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.review_children_trigger();
--> statement-breakpoint
CREATE FUNCTION public.check_review_testing_dates() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.tested_from > current_date OR NEW.tested_to > current_date THEN
    RAISE EXCEPTION 'testing dates cannot be in the future' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$$;
--> statement-breakpoint
CREATE TRIGGER review_testing_dates BEFORE INSERT OR UPDATE ON public.review_testing FOR EACH ROW EXECUTE FUNCTION public.check_review_testing_dates();
--> statement-breakpoint

-- ---------------------------------------------------------------------------------------------------------------------
-- 5. Affiliate: a link may exist only while its programme is approved (mirrors src/lib/affiliate.ts)
-- ---------------------------------------------------------------------------------------------------------------------
CREATE FUNCTION public.check_affiliate_link() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.affiliate_programs p WHERE p.id = NEW.program_id AND p.status = 'approved') THEN
    RAISE EXCEPTION 'an affiliate link can only be stored for an approved programme' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$$;
--> statement-breakpoint
CREATE TRIGGER affiliate_links_need_approval BEFORE INSERT OR UPDATE ON public.affiliate_links FOR EACH ROW EXECUTE FUNCTION public.check_affiliate_link();
--> statement-breakpoint
CREATE FUNCTION public.check_affiliate_status_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'approved' AND NEW.status <> 'approved' AND EXISTS (SELECT 1 FROM public.affiliate_links l WHERE l.program_id = OLD.id) THEN
    RAISE EXCEPTION 'remove the affiliate links before taking a programme out of the approved state' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$$;
--> statement-breakpoint
CREATE TRIGGER affiliate_programs_status_change BEFORE UPDATE OF status ON public.affiliate_programs FOR EACH ROW EXECUTE FUNCTION public.check_affiliate_status_change();
--> statement-breakpoint

-- ---------------------------------------------------------------------------------------------------------------------
-- 6. Audit log: append only, for everybody (the application role also has no UPDATE, DELETE or TRUNCATE grant)
-- ---------------------------------------------------------------------------------------------------------------------
CREATE FUNCTION public.audit_logs_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only' USING ERRCODE = 'insufficient_privilege';
END
$$;
--> statement-breakpoint
CREATE TRIGGER audit_logs_no_change BEFORE UPDATE OR DELETE ON public.audit_logs FOR EACH ROW EXECUTE FUNCTION public.audit_logs_immutable();
--> statement-breakpoint
CREATE TRIGGER audit_logs_no_truncate BEFORE TRUNCATE ON public.audit_logs FOR EACH STATEMENT EXECUTE FUNCTION public.audit_logs_immutable();
--> statement-breakpoint

-- ---------------------------------------------------------------------------------------------------------------------
-- 7. Team: the last active owner can never be removed, demoted or disabled
-- ---------------------------------------------------------------------------------------------------------------------
CREATE FUNCTION public.protect_last_owner() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE was_owner boolean; stays_owner boolean;
BEGIN
  SELECT (r.key = 'owner') INTO was_owner FROM public.roles r WHERE r.id = OLD.role_id;
  IF NOT COALESCE(was_owner, false) OR OLD.status <> 'active' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  stays_owner := false;
  IF TG_OP = 'UPDATE' THEN
    SELECT (r.key = 'owner') AND NEW.status = 'active' INTO stays_owner FROM public.roles r WHERE r.id = NEW.role_id;
  END IF;
  IF NOT COALESCE(stays_owner, false) AND NOT EXISTS (
    SELECT 1 FROM public.team_members m JOIN public.roles r ON r.id = m.role_id
    WHERE r.key = 'owner' AND m.status = 'active' AND m.id <> OLD.id
  ) THEN
    RAISE EXCEPTION 'the last active owner cannot be removed, demoted or disabled' USING ERRCODE = 'check_violation';
  END IF;
  RETURN COALESCE(NEW, OLD);
END
$$;
--> statement-breakpoint
CREATE TRIGGER team_members_keep_an_owner BEFORE UPDATE OR DELETE ON public.team_members FOR EACH ROW EXECUTE FUNCTION public.protect_last_owner();
--> statement-breakpoint

-- ---------------------------------------------------------------------------------------------------------------------
-- 8. Housekeeping function for the rate limiter (called by a scheduled job)
-- ---------------------------------------------------------------------------------------------------------------------
CREATE FUNCTION public.prune_rate_limit_hits(p_older_than interval DEFAULT interval '1 hour') RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE n bigint;
BEGIN
  DELETE FROM public.rate_limit_hits WHERE window_start < now() - p_older_than;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END
$$;
--> statement-breakpoint

-- ---------------------------------------------------------------------------------------------------------------------
-- 9. Roles, grants and Row Level Security
--    anon / authenticated are Supabase's public API roles: they get nothing. "app" is the one role the server connects as (a database
--    administrator gives it a password and LOGIN outside this file; a password never belongs in a migration).
-- ---------------------------------------------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app') THEN CREATE ROLE app NOLOGIN; END IF;
END
$$;
--> statement-breakpoint
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;
--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO app;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app;
--> statement-breakpoint
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app;
--> statement-breakpoint
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO app;
--> statement-breakpoint
REVOKE UPDATE, DELETE, TRUNCATE ON public.audit_logs FROM app;
--> statement-breakpoint
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    IF t.tablename <> 'audit_logs' THEN
      EXECUTE format('CREATE POLICY app_full_access ON public.%I FOR ALL TO app USING (true) WITH CHECK (true)', t.tablename);
    END IF;
  END LOOP;
END
$$;
--> statement-breakpoint
CREATE POLICY app_read ON public.audit_logs FOR SELECT TO app USING (true);
--> statement-breakpoint
CREATE POLICY app_append ON public.audit_logs FOR INSERT TO app WITH CHECK (true);
