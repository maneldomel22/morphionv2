import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkCustomer() {
  const customerId = 'cus_TUOppMa8A2jKAZ';

  console.log('\n=== Checking Stripe Customer ===\n');

  // Get customer from Stripe
  const customer = await stripe.customers.retrieve(customerId);

  console.log('Customer ID:', customer.id);
  console.log('Email:', customer.email);
  console.log('Name:', customer.name);
  console.log('Metadata:', customer.metadata);

  // Check if email exists in profiles
  if (customer.email) {
    console.log('\n=== Checking Database ===\n');

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', customer.email)
      .maybeSingle();

    if (error) {
      console.log('Error querying profiles:', error);
    } else if (profile) {
      console.log('✓ Found matching profile:');
      console.log('  User ID:', profile.id);
      console.log('  Email:', profile.email);
    } else {
      console.log('✗ No matching profile found for email:', customer.email);
    }
  } else {
    console.log('\n✗ Customer has no email in Stripe');
  }

  // Check subscriptions
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    limit: 10,
  });

  console.log('\n=== Subscriptions ===\n');
  console.log('Count:', subscriptions.data.length);
  subscriptions.data.forEach(sub => {
    console.log(`  - ${sub.id}: ${sub.status}`);
  });
}

checkCustomer().catch(console.error);
