function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const displayName = user.role === "employer" ? user.contact_name || user.name : user.full_name || user.name;

  return {
    id: user.id,
    role: user.role,
    name: displayName,
    full_name: user.full_name || null,
    contact_name: user.contact_name || null,
    company_name: user.company_name || null,
    email: user.email,
    telegram_username: user.telegram_username,
    telegram_chat_id: user.telegram_chat_id,
    created_at: user.created_at
  };
}

module.exports = { sanitizeUser };
