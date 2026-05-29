import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();

    // Admin client (service role) — bypasses RLS for profile operations
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // ── POST /winit-auth/signup ────────────────────────────────────────────────
    if (action === "signup" && req.method === "POST") {
      const { email, password, first_name, last_name } = await req.json();
      if (!email || !password || !first_name || !last_name) {
        return json({ error: "email, password, first_name and last_name are required" }, 400);
      }

      const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
        user_metadata: { first_name, last_name },
      });
      if (authErr) return json({ error: authErr.message }, 400);

      const userId = authData.user!.id;
      const display_name = `${first_name} ${last_name}`.trim();

      const { error: profileErr } = await adminClient.from("winit_profiles").insert({
        id: userId,
        email,
        first_name,
        last_name,
        display_name,
      });
      if (profileErr) {
        // Roll back the auth user if profile insert fails
        await adminClient.auth.admin.deleteUser(userId);
        return json({ error: profileErr.message }, 500);
      }

      // Sign in immediately to return a session
      const anonClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!
      );
      const { data: sessionData, error: signInErr } = await anonClient.auth.signInWithPassword({ email, password });
      if (signInErr) return json({ error: signInErr.message }, 400);

      return json({
        access_token: sessionData.session!.access_token,
        refresh_token: sessionData.session!.refresh_token,
        user: { id: userId, email, first_name, last_name, display_name },
      });
    }

    // ── POST /winit-auth/login ─────────────────────────────────────────────────
    if (action === "login" && req.method === "POST") {
      const { email, password } = await req.json();
      if (!email || !password) return json({ error: "email and password required" }, 400);

      const anonClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!
      );
      const { data, error } = await anonClient.auth.signInWithPassword({ email, password });
      if (error) return json({ error: error.message }, 401);

      const userId = data.user!.id;
      const { data: profile } = await adminClient
        .from("winit_profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      return json({
        access_token: data.session!.access_token,
        refresh_token: data.session!.refresh_token,
        user: profile ?? { id: userId, email },
      });
    }

    // ── POST /winit-auth/refresh ───────────────────────────────────────────────
    if (action === "refresh" && req.method === "POST") {
      const { refresh_token } = await req.json();
      if (!refresh_token) return json({ error: "refresh_token required" }, 400);

      const anonClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!
      );
      const { data, error } = await anonClient.auth.refreshSession({ refresh_token });
      if (error) return json({ error: error.message }, 401);

      return json({
        access_token: data.session!.access_token,
        refresh_token: data.session!.refresh_token,
      });
    }

    // ── POST /winit-auth/reset-password ───────────────────────────────────────
    if (action === "reset-password" && req.method === "POST") {
      const { email } = await req.json();
      if (!email) return json({ error: "email required" }, 400);

      const anonClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!
      );
      await anonClient.auth.resetPasswordForEmail(email, {
        redirectTo: "winit://reset-password",
      });
      // Always return success to avoid email enumeration
      return json({ message: "If that email exists, a reset link was sent." });
    }

    // ── GET /winit-auth/profile ────────────────────────────────────────────────
    if (action === "profile" && req.method === "GET") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) return json({ error: "Authorization header required" }, 401);

      const userClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user }, error: userErr } = await userClient.auth.getUser();
      if (userErr || !user) return json({ error: "Unauthorized" }, 401);

      const [profile, allergies, diets, conditions] = await Promise.all([
        adminClient.from("winit_profiles").select("*").eq("id", user.id).maybeSingle(),
        adminClient.from("winit_user_allergies").select("allergy_id").eq("user_id", user.id),
        adminClient.from("winit_user_diets").select("diet_id").eq("user_id", user.id),
        adminClient.from("winit_user_conditions").select("condition_id").eq("user_id", user.id),
      ]);

      return json({
        ...(profile.data ?? {}),
        allergy_ids: (allergies.data ?? []).map((r: { allergy_id: string }) => r.allergy_id),
        diet_ids: (diets.data ?? []).map((r: { diet_id: string }) => r.diet_id),
        condition_ids: (conditions.data ?? []).map((r: { condition_id: string }) => r.condition_id),
      });
    }

    // ── PUT /winit-auth/profile ────────────────────────────────────────────────
    if (action === "profile" && req.method === "PUT") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) return json({ error: "Authorization header required" }, 401);

      const userClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user }, error: userErr } = await userClient.auth.getUser();
      if (userErr || !user) return json({ error: "Unauthorized" }, 401);

      const body = await req.json();
      const { allergy_ids, diet_ids, condition_ids, ...profileFields } = body;

      // Permitted profile fields only
      const allowed = ["first_name", "last_name", "display_name", "avatar_url", "onboarding_completed"];
      const update: Record<string, unknown> = {};
      for (const k of allowed) {
        if (k in profileFields) update[k] = profileFields[k];
      }
      if (Object.keys(update).length) {
        await adminClient.from("winit_profiles").update(update).eq("id", user.id);
      }

      // Replace health selections atomically
      if (Array.isArray(allergy_ids)) {
        await adminClient.from("winit_user_allergies").delete().eq("user_id", user.id);
        if (allergy_ids.length) {
          await adminClient.from("winit_user_allergies").insert(
            allergy_ids.map((id: string) => ({ user_id: user.id, allergy_id: id }))
          );
        }
      }
      if (Array.isArray(diet_ids)) {
        await adminClient.from("winit_user_diets").delete().eq("user_id", user.id);
        if (diet_ids.length) {
          await adminClient.from("winit_user_diets").insert(
            diet_ids.map((id: string) => ({ user_id: user.id, diet_id: id }))
          );
        }
      }
      if (Array.isArray(condition_ids)) {
        await adminClient.from("winit_user_conditions").delete().eq("user_id", user.id);
        if (condition_ids.length) {
          await adminClient.from("winit_user_conditions").insert(
            condition_ids.map((id: string) => ({ user_id: user.id, condition_id: id }))
          );
        }
      }

      return json({ success: true });
    }

    return json({ error: "Not found" }, 404);

  } catch (e) {
    console.error("winit-auth error:", e);
    return json({ error: String(e) }, 500);
  }
});
