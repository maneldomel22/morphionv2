import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ForceLogoutRequest {
  user_id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Verify that the requesting user is an admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Check if user is admin
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from("admins")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (adminError || !adminData) {
      return new Response(
        JSON.stringify({ error: "Acesso negado. Apenas administradores podem forçar logout." }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Parse request body
    const { user_id }: ForceLogoutRequest = await req.json();

    // Validate inputs
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id é obrigatório" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Get user email for logging
    const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(user_id);

    // Revoke all sessions by deleting refresh tokens from auth.sessions table
    // This forces the user to log in again on all devices
    const { error: sessionsError } = await supabaseAdmin.rpc('delete_user_sessions', {
      target_user_id: user_id
    });

    // If the RPC doesn't exist, try direct SQL query as fallback
    if (sessionsError && sessionsError.code === 'PGRST202') {
      const { error: directError } = await supabaseAdmin
        .from('sessions')
        .delete()
        .eq('user_id', user_id);

      if (directError) {
        console.error("Error deleting sessions:", directError);
        return new Response(
          JSON.stringify({ error: "Erro ao deslogar usuário: " + directError.message }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }
    } else if (sessionsError) {
      console.error("Error calling delete_user_sessions:", sessionsError);
      return new Response(
        JSON.stringify({ error: "Erro ao deslogar usuário: " + sessionsError.message }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Log the force logout action
    await supabaseAdmin
      .from("credits_history")
      .insert({
        user_id: user_id,
        amount: 0,
        balance_after: 0,
        type: "admin_action",
        description: `Logout forçado por admin ${user.email}`,
        metadata: {
          admin_id: user.id,
          action: "force_logout",
          target_user_email: targetUser?.user?.email || "unknown",
          timestamp: new Date().toISOString(),
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Usuário deslogado com sucesso de todas as sessões"
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error("Error in admin-force-logout:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
