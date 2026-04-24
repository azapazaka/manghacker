export function formatSalary(value) {
  if (!value) {
    return "По договоренности";
  }

  return `${new Intl.NumberFormat("ru-RU").format(value)} ₸`;
}

export function formatDate(value) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(value));
}

export function employmentTypeLabel(value) {
  const map = {
    full_time: "Полная занятость",
    part_time: "Частичная занятость",
    contract: "Проектная работа"
  };

  return map[value] || value;
}

export function applicationStatusLabel(value) {
  const map = {
    applied: "Отклик отправлен",
    offer_sent: "Оффер отправлен",
    accepted: "Принят",
    rejected: "Отклонен"
  };

  return map[value] || value;
}

export function applicationStatusVariant(value) {
  const map = {
    applied: "secondary",
    offer_sent: "default",
    accepted: "success",
    rejected: "destructive"
  };

  return map[value] || "secondary";
}
