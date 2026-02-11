import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(supabaseUrl, serviceKey);

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const APP_URL = Deno.env.get("APP_URL") ?? "https://casskai.app";

function getBearerToken(req: Request) {
  const h = req.headers.get("Authorization") ?? "";
  return h.startsWith("Bearer ") ? h.slice(7) : h;
}

async function sendInviteEmail(to: string, companyName: string, role: string, inviteUrl: string) {
  if (!RESEND_API_KEY) return { skipped: true };
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "CassKai <noreply@casskai.app>",
      to,
      subject: `Invitation à rejoindre ${companyName || "CassKai"}`,
      html: `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#111">
        <div style="max-width:640px;margin:0 auto;padding:24px">
          <h2>🎉 Invitation</h2>
          <p>Vous êtes invité(e) à rejoindre <strong>${companyName || "une entreprise"}</strong>.</p>
          <p>Rôle attribué : <strong>${role || "member"}</strong></p>
          <p><a href="${inviteUrl}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">Accepter l'invitation</a></p>
          <p style="font-size:13px;color:#555">Si le bouton ne fonctionne pas, utilisez ce lien : ${inviteUrl}</p>
        </div>
      </body></html>`,
    }),
  });
  if (!resp.ok) {
    return { error: await resp.text() };
  }
  return { ok: true };
}

serve(async (req) => {
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: getCorsHeaders(req) });
  try {
    const { companyId, inviteeEmail, role = "member", expiresInDays = 7 } = await req.json();
    if (!companyId || !inviteeEmail) {
      return Response.json({ error: "Missing companyId or inviteeEmail" }, { status: 400, headers: getCorsHeaders(req) });
    }

    const token = getBearerToken(req);
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers: getCorsHeaders(req) });
    }

    const inviterId = userData.user.id;

    const { data: inviterRole } = await admin
      .from("user_companies")
      .select("role")
      .eq("company_id", companyId)
      .eq("user_id", inviterId)
      .eq("is_active", true)
      .maybeSingle();

    if (!inviterRole || !["owner", "admin"].includes(inviterRole.role)) {
      return Response.json({ error: "Insufficient permissions" }, { status: 403, headers: getCorsHeaders(req) });
    }

    const invitationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

    const { data: invite, error } = await admin
      .from("company_invitations")
      .insert({
        company_id: companyId,
        email: inviteeEmail.toLowerCase(),
        role,
        invitation_token: invitationToken,
        status: "pending",
        expires_at: expiresAt,
        invited_by: inviterId,
      })
      .select("id, invitation_token")
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500, headers: getCorsHeaders(req) });
    }

    const { data: company } = await admin.from("companies").select("name").eq("id", companyId).maybeSingle();
    const inviteUrl = `${APP_URL}/invitation?token=${invite.invitation_token}`;

    const emailResult = await sendInviteEmail(inviteeEmail, company?.name ?? "", role, inviteUrl);
    if (emailResult.error) {
      console.error("Invitation email error:", emailResult.error);
    }

    return Response.json({ id: invite.id, token: invite.invitation_token, email_sent: !emailResult.error }, { headers: getCorsHeaders(req) });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500, headers: getCorsHeaders(req) });
  }
});