import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { customer_id, user_id } = await req.json();

    if (!customer_id || !user_id) {
      return new Response(
        JSON.stringify({ error: 'customer_id and user_id are required' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    console.log(`Attempting to link customer ${customer_id} to user ${user_id}`);

    // 1. Validar que o customer existe no Stripe
    let stripeCustomer: Stripe.Customer;
    try {
      stripeCustomer = await stripe.customers.retrieve(customer_id) as Stripe.Customer;
      if (stripeCustomer.deleted) {
        return new Response(
          JSON.stringify({ error: 'Customer has been deleted in Stripe' }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }
    } catch (error: any) {
      console.error('Error retrieving Stripe customer:', error);
      return new Response(
        JSON.stringify({ error: `Customer not found in Stripe: ${error.message}` }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // 2. Validar que o user existe em profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, credits')
      .eq('id', user_id)
      .maybeSingle();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'User not found in database' }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // 3. Verificar se o customer já está vinculado
    const { data: existingLink } = await supabase
      .from('stripe_customers')
      .select('user_id')
      .eq('customer_id', customer_id)
      .maybeSingle();

    if (existingLink) {
      return new Response(
        JSON.stringify({
          error: 'Customer is already linked to a user',
          linked_user_id: existingLink.user_id,
        }),
        {
          status: 409,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // 4. Inserir em stripe_customers
    const { error: insertError } = await supabase
      .from('stripe_customers')
      .insert({
        user_id: user_id,
        customer_id: customer_id,
      });

    if (insertError) {
      console.error('Error inserting into stripe_customers:', insertError);
      return new Response(
        JSON.stringify({ error: `Failed to link in database: ${insertError.message}` }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // 5. Atualizar metadata no Stripe
    try {
      await stripe.customers.update(customer_id, {
        metadata: { user_id: user_id }
      });
      console.log(`Updated Stripe customer ${customer_id} metadata with user_id ${user_id}`);
    } catch (stripeError: any) {
      console.error('Failed to update Stripe metadata:', stripeError.message);
      // Não falhar a operação se apenas a atualização de metadata falhar
    }

    // 6. Registrar em credits_history
    const { error: historyError } = await supabase
      .from('credits_history')
      .insert({
        user_id: user_id,
        amount: 0,
        balance_after: profile.credits,
        type: 'stripe_manual_link',
        description: `Manually linked Stripe customer ${customer_id} (${stripeCustomer.email || 'no email'})`,
      });

    if (historyError) {
      console.error('Error recording in credits_history:', historyError);
      // Não falhar a operação se apenas o log falhar
    }

    console.log(`Successfully linked customer ${customer_id} to user ${user_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Customer successfully linked',
        customer_id,
        user_id,
        user_email: profile.email,
        stripe_email: stripeCustomer.email,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Error linking customer:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
