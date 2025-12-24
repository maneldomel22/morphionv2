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

// Mapeamento de price_id do Stripe para quantidade de créditos
const STRIPE_PRICE_TO_CREDITS: Record<string, number> = {
  'price_1ScWyDKTMfsEL5TJRLQjgB7z': 750,   // Starter
  'price_1ScWyiKTMfsEL5TJiGf4nGaZ': 4000,  // Creator
  'price_1ScWzMKTMfsEL5TJcVktB0qq': 8000,  // Pro
  'price_1SRKxLKTMfsEL5TJwMTW4NOg': 750,   // Starter Antigo
  'price_1SRL0dKTMfsEL5TJ7wQQb8eR': 4000,  // Creator Antigo
};

interface OrphanMatch {
  userId: string;
  userEmail: string;
  creditsAdded: number;
  addedAt: string;
  timeDiffMinutes: number;
  score: number;
  autoLinked: boolean;
  reason?: string;
}

interface OrphanedCustomer {
  customerId: string;
  email: string | null;
  name: string | null;
  subscriptionDate: string;
  priceId: string;
  expectedCredits: number | null;
  reason: string;
  possibleMatches?: OrphanMatch[];
}

/**
 * Calcula score de confiança para um match entre órfão e adição de créditos
 */
function calculateMatchScore(
  timeDiffMinutes: number,
  creditsMatch: boolean,
  emailSimilar: boolean
): number {
  let score = 0;

  // Pontos por match exato de créditos
  if (creditsMatch) {
    score += 40;
  }

  // Pontos por proximidade temporal
  if (timeDiffMinutes <= 60) {
    score += 40; // < 1 hora
  } else if (timeDiffMinutes <= 1440) {
    score += 30; // < 1 dia
  } else if (timeDiffMinutes <= 2880) {
    score += 20; // < 2 dias
  }

  // Pontos por email similar
  if (emailSimilar) {
    score += 20;
  }

  return score;
}

/**
 * Verifica se dois emails são similares (mesmo domínio ou parte antes do @)
 */
function areEmailsSimilar(email1: string | null, email2: string | null): boolean {
  if (!email1 || !email2) return false;

  const normalize = (e: string) => e.toLowerCase().trim();
  email1 = normalize(email1);
  email2 = normalize(email2);

  if (email1 === email2) return true;

  const [user1, domain1] = email1.split('@');
  const [user2, domain2] = email2.split('@');

  // Mesmo domínio E usuário similar (pelo menos 70% de match)
  if (domain1 === domain2) {
    const shorter = user1.length < user2.length ? user1 : user2;
    const longer = user1.length < user2.length ? user2 : user1;
    return longer.includes(shorter);
  }

  return false;
}

/**
 * Busca possíveis matches para um customer órfão baseado em credits_history
 */
async function findMatchesInCreditsHistory(
  subscriptionDate: Date,
  expectedCredits: number | null,
  stripeEmail: string | null
): Promise<OrphanMatch[]> {
  // Buscar adições de créditos manuais em uma janela de ±2 dias
  const twoDaysBefore = new Date(subscriptionDate);
  twoDaysBefore.setDate(twoDaysBefore.getDate() - 2);

  const twoDaysAfter = new Date(subscriptionDate);
  twoDaysAfter.setDate(twoDaysAfter.getDate() + 2);

  let query = supabase
    .from('credits_history')
    .select(`
      id,
      user_id,
      amount,
      created_at,
      profiles!inner(email)
    `)
    .eq('type', 'manual_add')
    .gte('created_at', twoDaysBefore.toISOString())
    .lte('created_at', twoDaysAfter.toISOString())
    .order('created_at', { ascending: false })
    .limit(10);

  // Se soubermos os créditos esperados, filtre por esse valor exato
  if (expectedCredits !== null) {
    query = query.eq('amount', expectedCredits);
  }

  const { data: matches, error } = await query;

  if (error) {
    console.error('Error searching credits_history:', error);
    return [];
  }

  if (!matches || matches.length === 0) {
    return [];
  }

  // Calcular score para cada match
  const scoredMatches: OrphanMatch[] = matches.map((match: any) => {
    const matchDate = new Date(match.created_at);
    const timeDiffMs = Math.abs(matchDate.getTime() - subscriptionDate.getTime());
    const timeDiffMinutes = Math.floor(timeDiffMs / 60000);

    const creditsMatch = expectedCredits === null || match.amount === expectedCredits;
    const emailSimilar = areEmailsSimilar(stripeEmail, match.profiles.email);
    const score = calculateMatchScore(timeDiffMinutes, creditsMatch, emailSimilar);

    return {
      userId: match.user_id,
      userEmail: match.profiles.email,
      creditsAdded: match.amount,
      addedAt: match.created_at,
      timeDiffMinutes,
      score,
      autoLinked: false,
    };
  });

  // Ordenar por score (maior primeiro)
  return scoredMatches.sort((a, b) => b.score - a.score);
}

/**
 * Auto-vincula um órfão se tiver match de alta confiança
 */
async function autoLinkIfConfident(
  customerId: string,
  matches: OrphanMatch[]
): Promise<{ linked: boolean; match?: OrphanMatch; reason?: string }> {
  if (matches.length === 0) {
    return { linked: false, reason: 'No matches found' };
  }

  const bestMatch = matches[0];

  // Auto-vincular apenas se:
  // 1. Score >= 90 (alta confiança)
  // 2. É o único match com score >= 80 (não há ambiguidade)
  const highScoreMatches = matches.filter(m => m.score >= 80);

  if (bestMatch.score >= 90 && highScoreMatches.length === 1) {
    try {
      // Inserir em stripe_customers
      const { error: insertError } = await supabase
        .from('stripe_customers')
        .insert({
          user_id: bestMatch.userId,
          customer_id: customerId,
        });

      if (insertError) {
        console.error('Error auto-linking customer:', insertError);
        return { linked: false, reason: `Database error: ${insertError.message}` };
      }

      // Atualizar metadata no Stripe
      try {
        await stripe.customers.update(customerId, {
          metadata: { user_id: bestMatch.userId }
        });
      } catch (stripeError: any) {
        console.error('Failed to update Stripe metadata:', stripeError.message);
      }

      // Registrar em credits_history
      await supabase.from('credits_history').insert({
        user_id: bestMatch.userId,
        amount: 0,
        balance_after: 0,
        type: 'stripe_auto_link',
        description: `Auto-linked Stripe customer ${customerId} (score: ${bestMatch.score})`,
      });

      bestMatch.autoLinked = true;
      console.log(`Auto-linked customer ${customerId} to user ${bestMatch.userId} (score: ${bestMatch.score})`);
      return { linked: true, match: bestMatch };
    } catch (error: any) {
      console.error('Error in auto-linking:', error);
      return { linked: false, reason: error.message };
    }
  }

  if (highScoreMatches.length > 1) {
    return { linked: false, reason: 'Multiple high-confidence matches found' };
  }

  return { linked: false, reason: `Low confidence (score: ${bestMatch.score})` };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log('Starting full Stripe subscription sync...');

    const allActiveSubscriptionIds = new Set<string>();
    let hasMore = true;
    let startingAfter: string | undefined = undefined;
    let linkedByEmail = 0;
    let linkedByCreditsHistory = 0;
    let totalWithoutUser = 0;
    const orphanedCustomers: OrphanedCustomer[] = [];

    while (hasMore) {
      const subscriptions = await stripe.subscriptions.list({
        status: 'active',
        limit: 100,
        starting_after: startingAfter,
        expand: ['data.default_payment_method', 'data.customer'],
      });

      for (const subscription of subscriptions.data) {
        allActiveSubscriptionIds.add(subscription.id);

        const customer = subscription.customer;
        const customerId = typeof customer === 'string' ? customer : customer.id;

        const customerObj = typeof customer === 'string'
          ? await stripe.customers.retrieve(customer) as Stripe.Customer
          : customer as Stripe.Customer;

        let userId = customerObj.metadata?.user_id;
        const hadUserIdInMetadata = !!userId;

        if (!userId && customerObj.email) {
          console.log(`No user_id in metadata for customer ${customerId}, searching by email: ${customerObj.email}`);

          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', customerObj.email)
            .maybeSingle();

          if (profile) {
            userId = profile.id;
            linkedByEmail++;
            console.log(`Found user ${userId} by email ${customerObj.email}`);

            try {
              await stripe.customers.update(customerId, {
                metadata: { user_id: userId }
              });
              console.log(`Updated Stripe customer ${customerId} metadata with user_id ${userId}`);
            } catch (error) {
              console.error(`Failed to update Stripe customer metadata: ${error.message}`);
            }
          } else {
            console.log(`No user found with email ${customerObj.email}, trying credits_history reconciliation...`);

            // Tentar reconciliação por credits_history
            const subscriptionDate = new Date(subscription.created * 1000);
            const priceId = subscription.items.data[0].price.id;
            const expectedCredits = STRIPE_PRICE_TO_CREDITS[priceId] || null;

            const matches = await findMatchesInCreditsHistory(
              subscriptionDate,
              expectedCredits,
              customerObj.email
            );

            const autoLinkResult = await autoLinkIfConfident(customerId, matches);

            if (autoLinkResult.linked && autoLinkResult.match) {
              userId = autoLinkResult.match.userId;
              linkedByCreditsHistory++;
              console.log(`Linked customer ${customerId} to user ${userId} via credits_history (score: ${autoLinkResult.match.score})`);
            } else {
              totalWithoutUser++;
              orphanedCustomers.push({
                customerId,
                email: customerObj.email,
                name: customerObj.name,
                subscriptionDate: subscriptionDate.toISOString(),
                priceId,
                expectedCredits,
                reason: 'email_not_found_in_db',
                possibleMatches: matches.slice(0, 5), // Top 5 matches
              });
            }
          }
        } else if (!userId) {
          // Sem email no Stripe, tentar reconciliação por credits_history
          console.log(`Customer ${customerId} has no email, trying credits_history reconciliation...`);

          const subscriptionDate = new Date(subscription.created * 1000);
          const priceId = subscription.items.data[0].price.id;
          const expectedCredits = STRIPE_PRICE_TO_CREDITS[priceId] || null;

          const matches = await findMatchesInCreditsHistory(
            subscriptionDate,
            expectedCredits,
            null
          );

          const autoLinkResult = await autoLinkIfConfident(customerId, matches);

          if (autoLinkResult.linked && autoLinkResult.match) {
            userId = autoLinkResult.match.userId;
            linkedByCreditsHistory++;
            console.log(`Linked customer ${customerId} to user ${userId} via credits_history (score: ${autoLinkResult.match.score})`);
          } else {
            totalWithoutUser++;
            orphanedCustomers.push({
              customerId,
              email: customerObj.email || null,
              name: customerObj.name,
              subscriptionDate: subscriptionDate.toISOString(),
              priceId,
              expectedCredits,
              reason: 'no_email_in_stripe',
              possibleMatches: matches.slice(0, 5),
            });
          }
        }

        if (userId) {
          await supabase.from('stripe_customers').upsert(
            {
              user_id: userId,
              customer_id: customerId,
            },
            {
              onConflict: 'customer_id',
            }
          );
        }

        await supabase.from('stripe_subscriptions').upsert(
          {
            customer_id: customerId,
            subscription_id: subscription.id,
            price_id: subscription.items.data[0].price.id,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
            cancel_at_period_end: subscription.cancel_at_period_end,
            ...(subscription.default_payment_method && typeof subscription.default_payment_method !== 'string'
              ? {
                  payment_method_brand: subscription.default_payment_method.card?.brand ?? null,
                  payment_method_last4: subscription.default_payment_method.card?.last4 ?? null,
                }
              : {}),
            status: subscription.status,
          },
          {
            onConflict: 'customer_id',
          }
        );
      }

      hasMore = subscriptions.has_more;
      if (hasMore && subscriptions.data.length > 0) {
        startingAfter = subscriptions.data[subscriptions.data.length - 1].id;
      }
    }

    const { data: dbSubscriptions } = await supabase
      .from('stripe_subscriptions')
      .select('subscription_id, customer_id')
      .eq('status', 'active');

    const toUpdate = [];
    for (const dbSub of dbSubscriptions || []) {
      if (dbSub.subscription_id && !allActiveSubscriptionIds.has(dbSub.subscription_id)) {
        toUpdate.push(dbSub.customer_id);
      }
    }

    if (toUpdate.length > 0) {
      console.log(`Marking ${toUpdate.length} subscriptions as canceled`);
      await supabase
        .from('stripe_subscriptions')
        .update({ status: 'canceled' })
        .in('customer_id', toUpdate);
    }

    console.log(`Sync complete. Active subscriptions in Stripe: ${allActiveSubscriptionIds.size}`);
    console.log(`Linked by email: ${linkedByEmail}`);
    console.log(`Linked by credits_history: ${linkedByCreditsHistory}`);
    console.log(`Without user: ${totalWithoutUser}`);

    // Separar órfãos com e sem matches
    const orphansWithMatches = orphanedCustomers.filter(o =>
      o.possibleMatches && o.possibleMatches.length > 0
    );
    const orphansNoMatches = orphanedCustomers.filter(o =>
      !o.possibleMatches || o.possibleMatches.length === 0
    );

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          activeInStripe: allActiveSubscriptionIds.size,
          markedAsCanceled: toUpdate.length,
          linkedByEmail,
          linkedByCreditsHistory,
          orphanedWithMatches: orphansWithMatches.length,
          orphanedNoMatches: orphansNoMatches.length,
        },
        orphanedCustomers,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Error syncing subscriptions:', error);
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