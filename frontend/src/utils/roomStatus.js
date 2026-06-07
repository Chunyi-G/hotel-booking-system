function getDateOnly(value) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)

  return date
}

export function getRoomStatus(roomId, bookings) {
  const today = getDateOnly(new Date())
  const confirmedBookings = bookings.filter((booking) => {
    return booking.room_id === roomId && booking.status === 'confirmed'
  })

  const isOccupied = confirmedBookings.some((booking) => {
    return getDateOnly(booking.check_in) <= today && getDateOnly(booking.check_out) > today
  })

  if (isOccupied) {
    return 'Occupied'
  }

  const isReserved = confirmedBookings.some((booking) => {
    return getDateOnly(booking.check_in) > today
  })

  return isReserved ? 'Reserved' : 'Available'
}

export function getRoomListingStatus(roomId, bookings, checkIn, checkOut) {
  const confirmedBookings = bookings.filter((booking) => {
    return booking.room_id === roomId && booking.status === 'confirmed'
  })

  if (checkIn && checkOut) {
    const hasOverlap = confirmedBookings.some((booking) => {
      return getDateOnly(booking.check_in) < getDateOnly(checkOut)
        && getDateOnly(booking.check_out) > getDateOnly(checkIn)
    })

    return hasOverlap ? 'Unavailable' : 'Available'
  }

  const today = getDateOnly(new Date())
  const isOccupied = confirmedBookings.some((booking) => {
    return getDateOnly(booking.check_in) <= today && getDateOnly(booking.check_out) > today
  })

  return isOccupied ? 'Occupied' : 'Available'
}

export function getRoomStatusChipColor(status) {
  switch (status) {
    case 'Occupied':
    case 'Unavailable':
      return 'error'
    case 'Reserved':
      return 'warning'
    default:
      return 'success'
  }
}
