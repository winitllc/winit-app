import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function adminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

function userClient(token: string) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function uniqueSlug(admin: ReturnType<typeof adminClient>, base: string): Promise<string> {
  let slug = base;
  let suffix = 0;
  while (true) {
    const { data } = await admin
      .from("professionals")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) return slug;
    suffix++;
    slug = `${base}-${suffix}`;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/pro-auth\/?/, "").replace(/^\//, "");

  // POST /pro-auth/signup
  if (req.method === "POST" && path === "signup") {
    const { email, password, first_name, last_name, title, bio, specialties } = await req.json();
    if (!email || !password || !first_name || !last_name) {
      return json({ error: "email, password, first_name, and last_name are required" }, 400);
    }
    const admin = adminClient();
    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (authErr || !authData?.user) return json({ error: authErr?.message ?? "Signup failed" }, 400);

    const baseSlug = slugify(`${first_name} ${last_name}`);
    const slug = await uniqueSlug(admin, baseSlug);

    const { data: pro, error: proErr } = await admin
      .from("professionals")
      .insert({
        auth_user_id: authData.user.id,
        email,
        name: `${first_name} ${last_name}`,
        title: title ?? null,
        bio: bio ?? null,
        specialties: specialties ?? [],
        slug,
        status: "pending",
      })
      .select()
      .single();
    if (proErr) return json({ error: proErr.message }, 400);

    const { data: session, error: signInErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    // Use password sign-in to get tokens
    const signInRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
      body: JSON.stringify({ email, password }),
    });
    const tokens = await signInRes.json();
    if (!signInRes.ok) return json({ error: tokens.error_description ?? "Auth failed" }, 400);

    return json({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      professional: pro,
    });
  }

  // POST /pro-auth/login
  if (req.method === "POST" && path === "login") {
    const { email, password } = await req.json();
    if (!email || !password) return json({ error: "email and password required" }, 400);

    const signInRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
      body: JSON.stringify({ email, password }),
    });
    const tokens = await signInRes.json();
    if (!signInRes.ok) return json({ error: tokens.error_description ?? "Login failed" }, 401);

    const admin = adminClient();
    const { data: pro, error: proErr } = await admin
      .from("professionals")
      .select("*")
      .eq("auth_user_id", tokens.user.id)
      .maybeSingle();

    if (!pro) return json({ error: "No professional account found for this email" }, 404);

    return json({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      professional: pro,
    });
  }

  // POST /pro-auth/refresh
  if (req.method === "POST" && path === "refresh") {
    const { refresh_token } = await req.json();
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
      body: JSON.stringify({ refresh_token }),
    });
    const data = await res.json();
    if (!res.ok) return json({ error: data.error_description ?? "Refresh failed" }, 401);
    return json({ access_token: data.access_token, refresh_token: data.refresh_token });
  }

  // GET /pro-auth/profile
  if (req.method === "GET" && path === "profile") {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const client = userClient(token);
    const { data: { user }, error: userErr } = await client.auth.getUser();
    if (userErr || !user) return json({ error: "Unauthorized" }, 401);

    const admin = adminClient();
    const { data: pro, error } = await admin
      .from("professionals")
      .select("*")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (error || !pro) return json({ error: "Profile not found" }, 404);

    const { data: stats } = await admin.rpc("get_pro_stats", { p_id: pro.id });
    return json({ ...pro, stats: stats ?? {} });
  }

  // PUT /pro-auth/profile
  if (req.method === "PUT" && path === "profile") {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const client = userClient(token);
    const { data: { user }, error: userErr } = await client.auth.getUser();
    if (userErr || !user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const allowed = ["name", "title", "bio", "specialties", "certifications", "website", "photo_url"];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    const admin = adminClient();
    const { data: pro, error } = await admin
      .from("professionals")
      .update(updates)
      .eq("auth_user_id", user.id)
      .select()
      .single();
    if (error) return json({ error: error.message }, 400);
    return json(pro);
  }

  // GET /pro-auth/public/:slug
  if (req.method === "GET" && path.startsWith("public/")) {
    const slug = path.replace("public/", "");
    const admin = adminClient();
    const { data: pro, error } = await admin
      .from("professionals")
      .select("id, name, title, bio, specialties, certifications, website, photo_url, slug, status")
      .eq("slug", slug)
      .eq("status", "approved")
      .maybeSingle();
    if (error || !pro) return json({ error: "Professional not found" }, 404);

    const { data: plans } = await admin
      .from("meal_plans")
      .select("id, name, description, is_public, created_at")
      .eq("professional_id", pro.id)
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    return json({ ...pro, meal_plans: plans ?? [] });
  }

  return json({ error: "Not found" }, 404);
});
