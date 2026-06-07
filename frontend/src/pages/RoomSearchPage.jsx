import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Container,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import LoadingState from '../components/LoadingState'
import { roomCategories } from '../constants/roomCategories'
import { formatCurrency } from '../utils/formatters'
import { getRoomListingStatus, getRoomStatusChipColor } from '../utils/roomStatus'

const initialBookingForm = {
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  guests: 1,
}

function getTodayDateString() {
  return new Date().toISOString().split('T')[0]
}

function RoomSearchPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({
    check_in: '',
    check_out: '',
    category: '',
  })
  const [rooms, setRooms] = useState([])
  const [bookings, setBookings] = useState([])
  const [hasFiltered, setHasFiltered] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [bookingForm, setBookingForm] = useState(initialBookingForm)
  const [bookingErrors, setBookingErrors] = useState({})
  const [bookingErrorMessage, setBookingErrorMessage] = useState('')
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false)
  const [bookingCompleted, setBookingCompleted] = useState(false)
  const today = getTodayDateString()

  useEffect(() => {
    const loadRooms = async () => {
      setIsLoading(true)
      setError('')

      try {
        const [roomsResponse, bookingsResponse] = await Promise.all([
          fetch('/api/rooms'),
          fetch('/api/bookings'),
        ])
        const roomsPayload = await roomsResponse.json()
        const bookingsPayload = await bookingsResponse.json()

        if (!roomsResponse.ok) {
          throw new Error(roomsPayload.message || 'Unable to load rooms.')
        }

        if (!bookingsResponse.ok) {
          throw new Error(bookingsPayload.message || 'Unable to load room statuses.')
        }

        setRooms(roomsPayload.data || [])
        setBookings(bookingsPayload.data || [])
      } catch (loadError) {
        setRooms([])
        setBookings([])
        setError(loadError.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadRooms()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  const handleBookingChange = (event) => {
    const { name, value } = event.target
    setBookingForm((current) => ({ ...current, [name]: value }))
  }

  const resetBookingState = () => {
    setSelectedRoom(null)
    setBookingForm(initialBookingForm)
    setBookingErrors({})
    setBookingErrorMessage('')
    setBookingCompleted(false)
  }

  const validateDateRange = () => {
    const hasCheckIn = Boolean(filters.check_in)
    const hasCheckOut = Boolean(filters.check_out)
    const hasDateRange = hasCheckIn && hasCheckOut

    if (hasCheckIn && filters.check_in < today) {
      return 'Check-in date cannot be in the past.'
    }

    if (hasCheckOut && filters.check_out < today) {
      return 'Check-out date cannot be in the past.'
    }

    if (hasCheckIn !== hasCheckOut) {
      return 'Please select both check-in and check-out dates to filter by availability.'
    }

    if (hasDateRange && filters.check_out <= filters.check_in) {
      return 'Check-out date must be after check-in date.'
    }

    return ''
  }

  const handleSearch = async (event) => {
    event.preventDefault()
    setError('')
    setHasFiltered(true)

    const dateError = validateDateRange()
    if (dateError) {
      setError(dateError)
      setRooms([])
      return
    }

    const hasDateRange = Boolean(filters.check_in && filters.check_out)
    const params = new URLSearchParams()

    if (hasDateRange) {
      params.set('check_in', filters.check_in)
      params.set('check_out', filters.check_out)
    }

    if (filters.category) {
      params.set('category', filters.category)
    }

    const endpoint = '/api/rooms'
    const queryString = params.toString()

    setIsLoading(true)

    try {
      const response = await fetch(queryString ? `${endpoint}?${queryString}` : endpoint)
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to filter rooms.')
      }

      setRooms(payload.data || [])
    } catch (filterError) {
      setRooms([])
      setError(filterError.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBookNow = (room) => {
    setError('')
    setBookingErrors({})
    setBookingErrorMessage('')

    if (!filters.check_in || !filters.check_out) {
      setError('Please select check-in and check-out dates before booking.')
      return
    }

    const dateError = validateDateRange()
    if (dateError) {
      setError(dateError)
      return
    }

    if (getRoomListingStatus(room.id, bookings, filters.check_in, filters.check_out) === 'Unavailable') {
      setError('This room is unavailable for the selected dates.')
      return
    }

    setSelectedRoom(room)
    setBookingForm((current) => ({
      ...current,
      guests: Math.min(Number(current.guests) || 1, room.capacity),
    }))
  }

  const getFieldError = (field) => bookingErrors[field]?.[0] || ''

  const handleBookingSubmit = async (event) => {
    event.preventDefault()

    if (isSubmittingBooking || bookingCompleted) {
      return
    }

    setBookingErrors({})
    setBookingErrorMessage('')
    setIsSubmittingBooking(true)

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_id: selectedRoom.id,
          check_in: filters.check_in,
          check_out: filters.check_out,
          customer_name: bookingForm.customer_name,
          customer_email: bookingForm.customer_email,
          customer_phone: bookingForm.customer_phone,
          guests: Number(bookingForm.guests),
        }),
      })
      const payload = await response.json()

      if (!response.ok) {
        if (payload.errors) {
          setBookingErrors(payload.errors)
          setBookingErrorMessage(
            payload.message || Object.values(payload.errors).flat()[0] || 'Please check the form.',
          )
        } else {
          setBookingErrors({ form: [payload.message || 'Unable to create booking.'] })
          setBookingErrorMessage(payload.message || 'Unable to create booking.')
        }
        return
      }

      setBookingCompleted(true)
      navigate('/booking-success', {
        state: {
          booking: payload.data,
        },
      })
    } catch {
      setBookingErrors({ form: ['Unable to create booking. Please try again.'] })
      setBookingErrorMessage('Unable to create booking. Please try again.')
    } finally {
      setIsSubmittingBooking(false)
    }
  }

  if (selectedRoom) {
    return (
      <Box className="app-shell">
        <Container maxWidth="md">
          <Stack spacing={4}>
            <Box className="page-header">
              <Typography component="h1" variant="h1">
                Create Booking
              </Typography>
              <Typography color="text.secondary">
                Complete customer details for the selected room.
              </Typography>
            </Box>

            <Card className="booking-form-card" variant="outlined">
              <CardContent>
                <Stack spacing={4}>
                  <Box className="booking-room-summary">
                    <Grid container spacing={2.5}>
                      <Grid item xs={12} md={3}>
                        <Typography color="text.secondary">Selected Room</Typography>
                        <Typography component="h2" variant="h2">
                          Room {selectedRoom.number}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography color="text.secondary">Category</Typography>
                        <Typography fontWeight={700}>{selectedRoom.category}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography color="text.secondary">Capacity</Typography>
                        <Typography fontWeight={700}>{selectedRoom.capacity} guests</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography color="text.secondary">Price</Typography>
                        <Typography fontWeight={700}>
                          {formatCurrency(selectedRoom.price_per_night)} / night
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Divider />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography color="text.secondary">Stay Dates</Typography>
                        <Typography fontWeight={700}>
                          {filters.check_in} to {filters.check_out}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  <Divider />

                  {bookingErrorMessage && <Alert severity="error">{bookingErrorMessage}</Alert>}

                  <Box component="form" onSubmit={handleBookingSubmit}>
                    <Stack spacing={3}>
                      <TextField
                        fullWidth
                        required
                        error={Boolean(getFieldError('customer_name'))}
                        helperText={getFieldError('customer_name')}
                        label="Customer Name"
                        name="customer_name"
                        value={bookingForm.customer_name}
                        onChange={handleBookingChange}
                      />
                      <TextField
                        fullWidth
                        required
                        error={Boolean(getFieldError('customer_email'))}
                        helperText={getFieldError('customer_email')}
                        label="Email"
                        name="customer_email"
                        type="email"
                        value={bookingForm.customer_email}
                        onChange={handleBookingChange}
                      />
                      <TextField
                        fullWidth
                        error={Boolean(getFieldError('customer_phone'))}
                        helperText={getFieldError('customer_phone')}
                        label="Phone"
                        name="customer_phone"
                        value={bookingForm.customer_phone}
                        onChange={handleBookingChange}
                      />
                      <TextField
                        fullWidth
                        required
                        error={Boolean(getFieldError('guests'))}
                        helperText={getFieldError('guests')}
                        inputProps={{ min: 1, max: selectedRoom.capacity }}
                        label="Number of Guests"
                        name="guests"
                        type="number"
                        value={bookingForm.guests}
                        onChange={handleBookingChange}
                      />
                      <Stack
                        className="booking-form-actions"
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1.5}
                      >
                        <Button
                          type="submit"
                          variant="contained"
                          size="large"
                          disabled={isSubmittingBooking || bookingCompleted}
                        >
                          {isSubmittingBooking ? 'Submitting...' : 'Submit Booking'}
                        </Button>
                        <Button
                          type="button"
                          variant="outlined"
                          size="large"
                          onClick={resetBookingState}
                        >
                          Back to Rooms
                        </Button>
                      </Stack>
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Container>
      </Box>
    )
  }

  return (
    <Box className="app-shell">
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <Box className="page-header">
            <Typography component="h1" variant="h1">
              Room Search
            </Typography>
            <Typography color="text.secondary">
              Browse rooms or filter by availability and category.
            </Typography>
          </Box>

          <Card className="search-panel" variant="outlined">
            <Typography component="h2" variant="h2" sx={{ mb: 3 }}>
              Filter Rooms
            </Typography>
            <Box component="form" onSubmit={handleSearch} sx={{ mt: 3 }}>
              <Box className="room-filter-grid">
                <Box>
                  <TextField
                    fullWidth
                    label="Check-in"
                    name="check_in"
                    slotProps={{ inputLabel: { shrink: true } }}
                    type="date"
                    inputProps={{ min: today }}
                    value={filters.check_in}
                    onChange={handleChange}
                  />
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="Check-out"
                    name="check_out"
                    slotProps={{ inputLabel: { shrink: true } }}
                    type="date"
                    inputProps={{ min: today }}
                    value={filters.check_out}
                    onChange={handleChange}
                  />
                </Box>
                <Box>
                  <FormControl fullWidth>
                    <InputLabel id="category-label">Room Category</InputLabel>
                    <Select
                      label="Room Category"
                      labelId="category-label"
                      name="category"
                      value={filters.category}
                      onChange={handleChange}
                    >
                      {roomCategories.map((category) => (
                        <MenuItem key={category.label} value={category.value}>
                          {category.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box className="room-filter-action">
                  <Button
                    fullWidth
                    size="large"
                    type="submit"
                    variant="contained"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Filtering...' : 'Filter'}
                  </Button>
                </Box>
              </Box>
            </Box>
          </Card>

          {error && <Alert severity="error">{error}</Alert>}

          {isLoading && <LoadingState message="Loading rooms" />}

          {!isLoading && hasFiltered && !error && rooms.length === 0 && (
            <Alert severity="info">No rooms found for those filters.</Alert>
          )}

          {!isLoading && rooms.length > 0 && (
            <Grid container spacing={2.5}>
              {rooms.map((room) => {
                const hasSelectedDateRange = Boolean(filters.check_in && filters.check_out)
                const roomStatus = getRoomListingStatus(
                  room.id,
                  bookings,
                  hasSelectedDateRange ? filters.check_in : null,
                  hasSelectedDateRange ? filters.check_out : null,
                )
                const isUnavailable = roomStatus === 'Unavailable'

                return (
                  <Grid item xs={12} sm={6} md={4} key={room.id}>
                    <Card className="room-card" variant="outlined">
                      <CardContent>
                        <Stack spacing={2}>
                          <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            spacing={2}
                          >
                            <Typography component="h2" variant="h2">
                              Room {room.number}
                            </Typography>
                            <Chip
                              color="primary"
                              label={room.category}
                              size="small"
                              variant="outlined"
                            />
                          </Stack>

                          <Stack spacing={1}>
                            <Box>
                              <Chip
                                color={getRoomStatusChipColor(roomStatus)}
                                label={roomStatus}
                                size="small"
                              />
                            </Box>
                            <Typography color="text.secondary">
                              Capacity: {room.capacity} guests
                            </Typography>
                            <Typography className="room-price">
                              {formatCurrency(room.price_per_night)} / night
                            </Typography>
                          </Stack>
                        </Stack>
                      </CardContent>
                      <CardActions>
                        <Button
                          fullWidth
                          variant="contained"
                          disabled={isUnavailable}
                          onClick={() => handleBookNow(room)}
                        >
                          {isUnavailable ? 'Unavailable' : 'Book Now'}
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                )
              })}
            </Grid>
          )}
        </Stack>
      </Container>
    </Box>
  )
}

export default RoomSearchPage
