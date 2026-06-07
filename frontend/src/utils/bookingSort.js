export function getBookingSortValue(booking, field) {
  switch (field) {
    case 'id':
      return Number(booking.id)
    case 'room_number':
      return booking.room?.number || ''
    case 'customer_name':
      return booking.customer_name || ''
    case 'check_in':
      return new Date(booking.check_in).getTime()
    case 'check_out':
      return new Date(booking.check_out).getTime()
    case 'status':
      return booking.status || ''
    default:
      return ''
  }
}

export function compareSortValues(first, second) {
  if (typeof first === 'number' && typeof second === 'number') {
    return first - second
  }

  return String(first).localeCompare(String(second), undefined, {
    numeric: true,
    sensitivity: 'base',
  })
}
