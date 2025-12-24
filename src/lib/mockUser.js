export const MOCK_USER = {
  id: "00000000-0000-0000-0000-000000000000",
  email: "dev@morphion.app",
  full_name: "Morphion Dev",
  credits: 999999,
  avatar_url: null,
  plan: "enterprise",
  created_at: new Date().toISOString()
};

export function getMockUser() {
  return MOCK_USER;
}

export function getMockProfile() {
  return {
    id: MOCK_USER.id,
    email: MOCK_USER.email,
    full_name: MOCK_USER.full_name,
    credits: MOCK_USER.credits,
    avatar_url: MOCK_USER.avatar_url,
    plan: MOCK_USER.plan,
    created_at: MOCK_USER.created_at
  };
}

export function getMockUserId() {
  return MOCK_USER.id;
}
