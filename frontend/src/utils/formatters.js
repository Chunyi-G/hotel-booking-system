export function formatCurrency(value) {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
  }).format(Number(value))
}

export function formatDate(value) {
  if (!value) {
    return '-'
  }

  if (typeof value === 'string') {
    const datePart = value.split('T')[0]

    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      return datePart
    }
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return date.toISOString().split('T')[0]
}
